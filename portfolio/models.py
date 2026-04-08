from django.db import models
from uuid import uuid4

from .storages import project_cover_storage


def project_cover_upload_to(instance: "Project", filename: str) -> str:
    ext = ""
    if "." in filename:
        ext = f".{filename.rsplit('.', 1)[1].lower()}"
    return f"{instance.slug or 'project'}-{uuid4().hex[:10]}{ext}"


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    message = models.TextField()
    source_url = models.URLField(blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True)
    is_spam = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Project(models.Model):
    class Signal(models.TextChoices):
        BLUE = "blue", "Blue"
        RED = "red", "Red"

    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=120)
    summary = models.CharField(max_length=220)
    description = models.TextField()
    architecture = models.TextField()
    api_hint = models.CharField(max_length=160)
    project_url = models.URLField(blank=True, default="", help_text="Public link for visiting this project.")
    cover_image = models.CharField(max_length=255, blank=True, default="", help_text="Fallback static path, e.g. /static/images/img.png")
    cover_upload = models.FileField(
        upload_to=project_cover_upload_to,
        storage=project_cover_storage,
        blank=True,
        null=True,
        help_text="Upload file here to save automatically into static/images/projects/",
    )
    signal = models.CharField(max_length=8, choices=Signal.choices, default=Signal.BLUE)
    tech_stack = models.JSONField(default=list)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.title


class SkillGroup(models.Model):
    class Direction(models.TextChoices):
        LEFT = "left", "Left"
        RIGHT = "right", "Right"

    key = models.SlugField(unique=True)
    title = models.CharField(max_length=80)
    stream_direction = models.CharField(max_length=8, choices=Direction.choices, default=Direction.LEFT)
    items = models.JSONField(default=list)
    logos = models.JSONField(default=list)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.title
