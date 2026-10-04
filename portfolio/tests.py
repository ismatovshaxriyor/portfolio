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
