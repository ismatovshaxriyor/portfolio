import json
import re

from rest_framework import serializers

from .models import Project, SkillGroup

PHONE_DIGIT_RE = re.compile(r"\D+")
MESSAGE_MIN_LENGTH = 5
FEEDBACK_CLIENT_MAX_BYTES = 2048


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug", read_only=True)
    apiHint = serializers.CharField(source="api_hint", read_only=True)
    projectUrl = serializers.CharField(source="project_url", read_only=True)
    coverImage = serializers.SerializerMethodField()
    techStack = serializers.ListField(source="tech_stack", child=serializers.CharField(), read_only=True)

    def get_coverImage(self, obj: Project) -> str:
        uploaded = getattr(obj, "cover_upload", None)
        if uploaded:
            try:
                return str(uploaded.url)
            except Exception:
                pass
        return (obj.cover_image or "").strip()

    class Meta:
        model = Project
        fields = ("id", "title", "summary", "description", "architecture", "apiHint", "projectUrl", "coverImage", "signal", "techStack")


class SkillGroupSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="key", read_only=True)
    streamDirection = serializers.CharField(source="stream_direction", read_only=True)
    items = serializers.JSONField(read_only=True)
    logos = serializers.JSONField(read_only=True)

    class Meta:
        model = SkillGroup
        fields = ("id", "title", "streamDirection", "items", "logos")


class ContactMessageInputSerializer(serializers.Serializer):
    full_name = serializers.CharField(min_length=3, max_length=100, trim_whitespace=True)
    email = serializers.EmailField()
    phone = serializers.CharField(min_length=7, max_length=30, trim_whitespace=True)
    message = serializers.CharField(min_length=MESSAGE_MIN_LENGTH, max_length=4000, trim_whitespace=True)
    page = serializers.URLField(required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)
    client_elapsed_ms = serializers.IntegerField(required=False, min_value=0)

    def validate_phone(self, value: str) -> str:
        digits = PHONE_DIGIT_RE.sub("", value)
        if len(digits) < 7 or len(digits) > 16:
            raise serializers.ValidationError("phone format is invalid.")
        return value


class FeedbackInputSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False, allow_null=True)
    message = serializers.CharField(max_length=2000, required=False, allow_blank=True, trim_whitespace=True)
    contact = serializers.CharField(max_length=120, required=False, allow_blank=True, trim_whitespace=True)
    page = serializers.URLField(required=False, allow_blank=True)
    client = serializers.DictField(required=False)
    website = serializers.CharField(required=False, allow_blank=True)
    client_elapsed_ms = serializers.IntegerField(required=False, min_value=0)

    def validate_client(self, value):
        if len(json.dumps(value, default=str)) > FEEDBACK_CLIENT_MAX_BYTES:
            raise serializers.ValidationError("client info is too large.")
        return value

    def validate(self, attrs):
        if attrs.get("rating") is None and not attrs.get("message"):
            raise serializers.ValidationError("Send a rating or a message.")
        return attrs
