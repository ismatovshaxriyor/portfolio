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
from .models import ContactMessage, Project, SkillGroup
from .serializers import ContactMessageInputSerializer, ProjectSerializer, SkillGroupSerializer

MIN_FILL_MS = 2500
IP_BURST_COOLDOWN_SECONDS = 25
IP_WINDOW_SECONDS = 600
IP_WINDOW_LIMIT = 6
PROJECTS_CACHE_TTL_SECONDS = getattr(settings, "PROJECTS_API_CACHE_TTL", 300)
SKILLS_CACHE_TTL_SECONDS = getattr(settings, "SKILLS_API_CACHE_TTL", 300)


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


def _rate_limited(ip: str) -> bool:
    cooldown_key = f"contact:cooldown:{ip}"
    try:
        if cache.get(cooldown_key):
            return True

        window_key = f"contact:window:{ip}"
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
