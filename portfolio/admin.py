from django.contrib import admin
from .cache_keys import invalidate_public_content_cache
from .models import ContactMessage, Project, SkillGroup


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "is_spam", "created_at")
    list_filter = ("is_spam", "created_at")
    search_fields = ("name", "email", "phone", "message")
    readonly_fields = ("created_at",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "signal", "sort_order", "is_active", "updated_at")
    list_filter = ("signal", "is_active")
    search_fields = ("title", "slug", "summary", "description")
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("sort_order", "id")
    fields = (
        "title",
        "slug",
        "summary",
        "description",
        "architecture",
        "api_hint",
        "cover_upload",
        "cover_image",
        "signal",
        "tech_stack",
        "sort_order",
        "is_active",
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        invalidate_public_content_cache()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        invalidate_public_content_cache()

    def delete_queryset(self, request, queryset):
        super().delete_queryset(request, queryset)
        invalidate_public_content_cache()


@admin.register(SkillGroup)
class SkillGroupAdmin(admin.ModelAdmin):
    list_display = ("title", "key", "stream_direction", "sort_order", "is_active", "updated_at")
    list_filter = ("stream_direction", "is_active")
    search_fields = ("title", "key")
    ordering = ("sort_order", "id")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        invalidate_public_content_cache()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        invalidate_public_content_cache()

    def delete_queryset(self, request, queryset):
        super().delete_queryset(request, queryset)
        invalidate_public_content_cache()
