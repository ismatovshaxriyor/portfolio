from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import ContactMessage, Feedback

ORIGIN = "https://beta.ismatov.uz"


# LocMem: the throttles and per-IP limits must not touch the server's Redis.
@override_settings(
    CONTACT_ALLOWED_ORIGINS={ORIGIN},
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
)
class FeedbackAPITests(TestCase):
    def setUp(self):
        # Every test posts from the same address; start each with no limits hit.
        cache.clear()
        self.api = APIClient()

    def post(self, path, payload, origin=ORIGIN):
        return self.api.post(path, payload, format="json", HTTP_ORIGIN=origin)

    def test_saves_rating_message_and_client_info(self):
        response = self.post(
            "/api/feedback/",
            {"rating": 4, "message": "Smooth on my phone", "client": {"fps": 58}, "client_elapsed_ms": 4000},
        )
        self.assertEqual(response.status_code, 201)
        feedback = Feedback.objects.get()
        self.assertEqual((feedback.rating, feedback.message, feedback.client), (4, "Smooth on my phone", {"fps": 58}))

    def test_needs_a_rating_or_a_message(self):
        self.assertEqual(self.post("/api/feedback/", {"client_elapsed_ms": 4000}).status_code, 400)
        self.assertEqual(self.post("/api/feedback/", {"rating": 6, "client_elapsed_ms": 4000}).status_code, 400)
        self.assertFalse(Feedback.objects.exists())

    def test_bots_get_a_fake_success_and_nothing_is_stored(self):
        self.assertEqual(self.post("/api/feedback/", {"rating": 5, "website": "x", "client_elapsed_ms": 4000}).status_code, 200)
        self.assertEqual(self.post("/api/feedback/", {"rating": 5, "client_elapsed_ms": 200}).status_code, 200)
        self.assertFalse(Feedback.objects.exists())

    def test_rejects_other_origins(self):
        response = self.post("/api/feedback/", {"rating": 3, "client_elapsed_ms": 4000}, origin="https://example.com")
        self.assertEqual(response.status_code, 403)

    def test_oversized_client_info_is_rejected(self):
        response = self.post("/api/feedback/", {"rating": 3, "client": {"x": "y" * 4000}, "client_elapsed_ms": 4000})
        self.assertEqual(response.status_code, 400)

    def test_feedback_does_not_block_a_contact_message(self):
        self.assertEqual(self.post("/api/feedback/", {"rating": 5, "client_elapsed_ms": 4000}).status_code, 201)
        contact = {
            "full_name": "Test Visitor",
            "email": "visitor@example.com",
            "phone": "+998901234567",
            "message": "Hello from the tests",
            "client_elapsed_ms": 4000,
        }
        self.assertEqual(self.post("/api/contact/", contact).status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)


class WhoAmIAPITests(TestCase):
    def setUp(self):
        self.api = APIClient()

    def test_shows_the_address_and_where_it_is(self):
        response = self.api.get(
            "/api/whoami/",
            HTTP_X_FORWARDED_FOR="203.0.113.7",
            HTTP_CF_IPCOUNTRY="UZ",
            HTTP_CF_IPCITY="Tashkent",
            HTTP_CF_TIMEZONE="Asia/Tashkent",
            HTTP_CF_RAY="8f1c2d3e4f5a6b7c-TAS",
            HTTP_USER_AGENT="TestBrowser/1.0",
            HTTP_ACCEPT_LANGUAGE="uz,en;q=0.8",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual((body["ip"], body["ip_version"]), ("203.0.113.7", 4))
        self.assertEqual(body["geo"], {"country": "UZ", "city": "Tashkent", "timezone": "Asia/Tashkent"})
        self.assertEqual(body["edge"], {"colo": "TAS"})
        self.assertEqual(body["headers"], {"User-Agent": "TestBrowser/1.0", "Accept-Language": "uz,en;q=0.8"})

    def test_never_echoes_cookies_or_credentials(self):
        response = self.api.get(
            "/api/whoami/",
            HTTP_COOKIE="sessionid=secret-session",
            HTTP_AUTHORIZATION="Bearer secret-token",
            HTTP_X_CSRFTOKEN="secret-csrf",
            HTTP_X_FORWARDED_FOR="2001:db8::7",
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("secret", response.content.decode())
        self.assertEqual((response.json()["ip"], response.json()["ip_version"]), ("2001:db8::7", 6))

    def test_keeps_nothing_and_is_never_cached(self):
        with self.assertNumQueries(0):
            response = self.api.get("/api/whoami/", HTTP_X_FORWARDED_FOR="203.0.113.7")
        self.assertIn("no-store", response["Cache-Control"])
        self.assertFalse(response.cookies)

    def test_is_not_rate_limited(self):
        # A throttle would have to remember the caller's address.
        for _ in range(40):
            self.assertEqual(self.api.get("/api/whoami/", HTTP_X_FORWARDED_FOR="203.0.113.7").status_code, 200)

    def test_city_names_arrive_as_utf8(self):
        as_wsgi_sees_it = "São Paulo".encode("utf-8").decode("latin-1")
        response = self.api.get("/api/whoami/", HTTP_CF_IPCOUNTRY="BR", HTTP_CF_IPCITY=as_wsgi_sees_it)
        self.assertEqual(response.json()["geo"], {"country": "BR", "city": "São Paulo"})

    def test_unknown_location_is_left_out(self):
        response = self.api.get("/api/whoami/", HTTP_CF_IPCOUNTRY="XX")
        self.assertEqual(response.json()["geo"], {})
        self.assertEqual(response.json()["edge"], {"colo": ""})

    def test_only_reads(self):
        self.assertEqual(self.api.post("/api/whoami/", {}, format="json").status_code, 405)
