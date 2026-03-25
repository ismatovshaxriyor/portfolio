from django.db import migrations, models


PROJECT_IMAGE_MAP = {
    "marketplace-bot": "/static/images/img.png",
    "movie-download-bot": "/static/images/img_1.png",
    "realtime-chat-api": "/static/images/profile.png",
    "drf-boilerplate": "/static/images/ismtov.png",
}


def seed_cover_images(apps, _schema_editor):
    Project = apps.get_model("portfolio", "Project")
    for slug, image_path in PROJECT_IMAGE_MAP.items():
        Project.objects.filter(slug=slug).update(cover_image=image_path)


def clear_cover_images(apps, _schema_editor):
    Project = apps.get_model("portfolio", "Project")
    Project.objects.update(cover_image="")


class Migration(migrations.Migration):
    dependencies = [
        ("portfolio", "0002_backend_content"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="cover_image",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.RunPython(seed_cover_images, reverse_code=clear_cover_images),
    ]
