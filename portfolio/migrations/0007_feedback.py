from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("portfolio", "0006_showcase_projects")]

    operations = [
        migrations.CreateModel(
            name="Feedback",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rating", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("message", models.TextField(blank=True)),
                ("contact", models.CharField(blank=True, max_length=120)),
                ("page", models.URLField(blank=True)),
                ("client", models.JSONField(blank=True, default=dict)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"verbose_name_plural": "feedback", "ordering": ["-created_at"]},
        ),
    ]
