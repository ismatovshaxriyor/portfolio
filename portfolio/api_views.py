import ipaddress

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .cache_keys import PROJECT_LIST_CACHE_KEY, SKILL_GROUP_LIST_CACHE_KEY
from .models import ContactMessage, Feedback, Project, SkillGroup
from .serializers import (
    ContactMessageInputSerializer,
    FeedbackInputSerializer,
    ProjectSerializer,
    SkillGroupSerializer,
)

MIN_FILL_MS = 2500
# The feedback form is shorter: a rating alone takes a second or two.
FEEDBACK_MIN_FILL_MS = 1500
IP_BURST_COOLDOWN_SECONDS = 25
IP_WINDOW_SECONDS = 600
IP_WINDOW_LIMIT = 6
PROJECTS_CACHE_TTL_SECONDS = getattr(settings, "PROJECTS_API_CACHE_TTL", 300)
SKILLS_CACHE_TTL_SECONDS = getattr(settings, "SKILLS_API_CACHE_TTL", 300)

# Request headers /api/whoami/ shows back to the visitor, as their browser sent
# them. A fixed list: never Cookie or Authorization, and nothing a proxy adds
# or rewrites on the way in (Accept-Encoding, X-Forwarded-*).
WHOAMI_HEADERS = (
    "User-Agent",
    "Accept-Language",
    "Referer",
    "DNT",
    "Sec-GPC",
    "Sec-CH-UA",
    "Sec-CH-UA-Mobile",
    "Sec-CH-UA-Platform",
    "Sec-Fetch-Site",
    "Sec-Fetch-Mode",
    "Sec-Fetch-Dest",
    "Save-Data",
    "Priority",
)
WHOAMI_HEADER_MAX_CHARS = 400
# Where Cloudflare places the visitor's address. CF-IPCountry always comes;
# the rest only with the "Add visitor location headers" managed transform.
WHOAMI_GEO_HEADERS = {
    "country": "CF-IPCountry",
    "city": "CF-IPCity",
    "region": "CF-Region",
    "region_code": "CF-Region-Code",
    "postal_code": "CF-Postal-Code",
    "latitude": "CF-IPLatitude",
    "longitude": "CF-IPLongitude",
    "timezone": "CF-Timezone",
    "continent": "CF-IPContinent",
}


def _client_ip(request) -> str:
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        for value in xff.split(","):
            candidate = value.strip()
            try:
                return str(ipaddress.ip_address(candidate))
            except ValueError:
                continue

    remote_addr = request.META.get("REMOTE_ADDR", "0.0.0.0")
    try:
        return str(ipaddress.ip_address(remote_addr))
    except ValueError:
        return "0.0.0.0"


def _rate_limited(ip: str, scope: str = "contact") -> bool:
    # Per scope, so feedback sent a moment ago never blocks a contact message.
    cooldown_key = f"{scope}:cooldown:{ip}"
    try:
        if cache.get(cooldown_key):
            return True

        window_key = f"{scope}:window:{ip}"
        count = cache.get(window_key, 0)
        if count >= IP_WINDOW_LIMIT:
            return True

        cache.set(window_key, count + 1, timeout=IP_WINDOW_SECONDS)
        cache.set(cooldown_key, True, timeout=IP_BURST_COOLDOWN_SECONDS)
        return False
    except Exception:
        # Fail open if cache backend is unavailable.
        return False


def _cache_get(key: str):
    try:
        return cache.get(key)
    except Exception:
        return None


def _cache_set(key: str, value, timeout: int) -> None:
    try:
        cache.set(key, value, timeout=timeout)
    except Exception:
        return


def _header_text(value: str) -> str:
    # WSGI hands header bytes over as latin-1; city names arrive as UTF-8.
    try:
        return value.encode("latin-1").decode("utf-8").strip()
    except UnicodeError:
        return value.strip()


def _origin_allowed(request) -> bool:
    origin = str(request.headers.get("Origin", "")).strip().rstrip("/")
    if not origin:
        return True
    return origin in settings.CONTACT_ALLOWED_ORIGINS


class HealthAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "health"
    http_method_names = ["get", "head", "options"]

    def get(self, _request):
        return Response({"status": "ok", "time": timezone.now().isoformat()})


class WhoAmIAPIView(APIView):
    """What this server saw of the request, for the visitor to look at.

    The beta's Danger zone shows a visitor what a site learns about them; the
    address and its location are the part only a server can see. Nothing is
    kept: the answer is built from the request headers alone, with no database
    or cache access, and must never be stored by a proxy either.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    # No throttle on purpose: DRF's keep every caller's address in the cache
    # for the length of their window, and this endpoint promises to keep none.
    throttle_classes = []
    http_method_names = ["get", "head", "options"]

    def get(self, request):
        ip = _client_ip(request)
        geo = {key: _header_text(request.headers.get(name, "")) for key, name in WHOAMI_GEO_HEADERS.items()}
        # Cloudflare's code for "no idea where this address is".
        if geo["country"].upper() == "XX":
            geo["country"] = ""
        ray = request.headers.get("CF-Ray", "")
        response = Response(
            {
                "ip": ip,
                "ip_version": ipaddress.ip_address(ip).version,
                "geo": {key: value for key, value in geo.items() if value},
                # A ray id ends in the code of the data centre that took the request.
                "edge": {"colo": ray.rsplit("-", 1)[1] if "-" in ray else ""},
                "headers": {
                    name: _header_text(request.headers[name])[:WHOAMI_HEADER_MAX_CHARS]
                    for name in WHOAMI_HEADERS
                    if name in request.headers
                },
            }
        )
        response["Cache-Control"] = "no-store, private"
        return response


class ProjectListAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public"
    http_method_names = ["get", "head", "options"]

    def get(self, _request):
        payload = _cache_get(PROJECT_LIST_CACHE_KEY)
        if payload is None:
            queryset = Project.objects.filter(is_active=True).order_by("sort_order", "id")
            payload = {"results": ProjectSerializer(queryset, many=True).data}
            _cache_set(PROJECT_LIST_CACHE_KEY, payload, timeout=PROJECTS_CACHE_TTL_SECONDS)
        return Response(payload)


class SkillGroupListAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public"
    http_method_names = ["get", "head", "options"]

    def get(self, _request):
        payload = _cache_get(SKILL_GROUP_LIST_CACHE_KEY)
        if payload is None:
            queryset = SkillGroup.objects.filter(is_active=True).order_by("sort_order", "id")
            payload = {"results": SkillGroupSerializer(queryset, many=True).data}
            _cache_set(SKILL_GROUP_LIST_CACHE_KEY, payload, timeout=SKILLS_CACHE_TTL_SECONDS)
        return Response(payload)


class ContactCreateAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"
    http_method_names = ["post", "options"]

    def post(self, request):
        if not _origin_allowed(request):
            return Response(
                {"success": False, "message": "Origin is not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ContactMessageInputSerializer(data=request.data)
        is_valid = serializer.is_valid(raise_exception=False)
        payload = serializer.validated_data if is_valid else {}

        full_name = payload.get("full_name") or str(request.data.get("full_name", "")).strip() or str(
            request.data.get("name", "")
        ).strip()
        email = payload.get("email") or str(request.data.get("email", "")).strip()
        phone = payload.get("phone") or str(request.data.get("phone", "")).strip()
        message = payload.get("message") or str(request.data.get("message", "")).strip()
        source_url = payload.get("page") or str(request.data.get("page", "")).strip()
        honeypot = str(request.data.get("website", "")).strip()
        user_agent = str(request.META.get("HTTP_USER_AGENT", ""))[:255]
        ip_address = _client_ip(request)

        if honeypot:
            ContactMessage.objects.create(
                name=full_name or "bot",
                email=email or "bot@example.invalid",
                phone=phone,
                message=message or "honeypot triggered",
                source_url=source_url,
                ip_address=ip_address,
                user_agent=user_agent,
                is_spam=True,
            )
            return Response({"success": True, "message": "Accepted."}, status=status.HTTP_200_OK)

        elapsed_value = payload.get("client_elapsed_ms")
        if elapsed_value is None:
            try:
                elapsed_value = int(request.data.get("client_elapsed_ms", MIN_FILL_MS))
            except (TypeError, ValueError):
                elapsed_value = MIN_FILL_MS

        if elapsed_value < MIN_FILL_MS:
            return Response({"success": True, "message": "Accepted."}, status=status.HTTP_200_OK)

        if _rate_limited(ip_address):
            return Response(
                {"success": False, "message": "Too many requests. Try again in a moment."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if not is_valid:
            return Response(
                {"success": False, "errors": serializer.errors, "message": "Validation failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ContactMessage.objects.create(
            name=payload["full_name"],
            email=payload["email"],
            phone=payload["phone"],
            message=payload["message"],
            source_url=source_url,
            ip_address=ip_address,
            user_agent=user_agent,
            is_spam=False,
        )

        return Response({"success": True, "message": "Message has been queued."}, status=status.HTTP_201_CREATED)


class FeedbackCreateAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "feedback"
    http_method_names = ["post", "options"]

    def post(self, request):
        if not _origin_allowed(request):
            return Response(
                {"success": False, "message": "Origin is not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # A filled honeypot or an instant submit is a bot: it gets a fake
        # success and nothing is stored.
        if str(request.data.get("website", "")).strip():
            return Response({"success": True, "message": "Accepted."}, status=status.HTTP_200_OK)
        try:
            elapsed_ms = int(request.data.get("client_elapsed_ms", FEEDBACK_MIN_FILL_MS))
        except (TypeError, ValueError):
            elapsed_ms = FEEDBACK_MIN_FILL_MS
        if elapsed_ms < FEEDBACK_MIN_FILL_MS:
            return Response({"success": True, "message": "Accepted."}, status=status.HTTP_200_OK)

        # Validated before the per-IP limit, so a visitor who fixes a rejected
        # form can send it again right away.
        serializer = FeedbackInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors, "message": "Validation failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ip_address = _client_ip(request)
        if _rate_limited(ip_address, scope="feedback"):
            return Response(
                {"success": False, "message": "Too many requests. Try again in a moment."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        payload = serializer.validated_data
        Feedback.objects.create(
            rating=payload.get("rating"),
            message=payload.get("message", ""),
            contact=payload.get("contact", ""),
            page=payload.get("page", ""),
            client=payload.get("client", {}),
            ip_address=ip_address,
            user_agent=str(request.META.get("HTTP_USER_AGENT", ""))[:255],
        )
        return Response({"success": True, "message": "Feedback saved."}, status=status.HTTP_201_CREATED)

