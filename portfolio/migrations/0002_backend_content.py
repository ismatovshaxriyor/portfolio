# Generated manually for backend API content models.
from django.db import migrations, models


def seed_content(apps, _schema_editor):
    Project = apps.get_model("portfolio", "Project")
    SkillGroup = apps.get_model("portfolio", "SkillGroup")

    projects = [
        {
            "slug": "marketplace-bot",
            "title": "Marketplace Telegram Bot",
            "summary": "OLX-style product marketplace fully operated inside Telegram.",
            "description": "Designed an async-first marketplace bot with category flows, seller/buyer interactions, moderation queues, and resilient background delivery for high request concurrency.",
            "architecture": "Layered service architecture with queue-backed workloads. Redis powers hot-path caching and rate-safe task distribution while PostgreSQL handles transactional domain state.",
            "api_hint": "GET /projects/marketplace-bot",
            "signal": "blue",
            "tech_stack": ["Python", "Django", "DRF", "PostgreSQL", "Redis", "Celery"],
            "sort_order": 10,
        },
        {
            "slug": "movie-download-bot",
            "title": "Movie Download Bot",
            "summary": "High-throughput media bot optimized for quick retrieval and delivery.",
            "description": "Built a searchable movie delivery backend with metadata indexing, file-id caching, and async queue orchestration to keep response times stable under burst traffic.",
            "architecture": "Read-heavy architecture with indexed search and cache-first routing. Media metadata and lookup keys are partitioned to protect command-response latency.",
            "api_hint": "GET /projects/movie-download-bot",
            "signal": "red",
            "tech_stack": ["Python", "Django", "Telegram API", "PostgreSQL", "Redis"],
            "sort_order": 20,
        },
        {
            "slug": "realtime-chat-api",
            "title": "Real-time Chat API",
            "summary": "WebSocket and REST backend for live messaging systems.",
            "description": "Implemented channel-based communication, durable message persistence, presence tracking, and read/typing indicators with reliable fan-out between WebSocket workers.",
            "architecture": "Event-driven core with Redis pub/sub as broadcast fabric. HTTP APIs provide durable history while socket workers handle transient realtime state.",
            "api_hint": "GET /projects/realtime-chat-api",
            "signal": "blue",
            "tech_stack": ["Django Channels", "DRF", "Redis", "PostgreSQL", "Daphne"],
            "sort_order": 30,
        },
        {
            "slug": "drf-boilerplate",
            "title": "DRF Boilerplate",
            "summary": "Production-focused Django REST baseline for rapid project starts.",
            "description": "Created a reusable backend foundation with auth, permissions, structured settings, observability defaults, and deployment-ready conventions for teams.",
            "architecture": "Clean module boundaries, explicit service/use-case layers, and environment-driven configuration for consistent behavior from local development to production.",
            "api_hint": "GET /projects/drf-boilerplate",
            "signal": "red",
            "tech_stack": ["Django", "DRF", "PostgreSQL", "Docker", "GitHub Actions"],
            "sort_order": 40,
        },
    ]

    for payload in projects:
        Project.objects.update_or_create(slug=payload["slug"], defaults=payload)

    groups = [
        {
            "key": "backend",
            "title": "Backend",
            "stream_direction": "left",
            "items": [
                {"label": "Python", "iconKey": "code"},
                {"label": "Django / DRF", "iconKey": "layers"},
                {"label": "PostgreSQL", "iconKey": "database"},
                {"label": "Redis", "iconKey": "grid"},
            ],
            "logos": [
                {"name": "Python", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg"},
                {"name": "Django", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg"},
                {"name": "FastAPI", "src": "https://cdn.simpleicons.org/fastapi/009688"},
                {"name": "PostgreSQL", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg"},
                {"name": "SQLite", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg"},
                {"name": "MySQL", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg"},
                {"name": "Redis", "src": "https://cdn.simpleicons.org/redis/DC382D"},
                {"name": "Pytest", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytest/pytest-original.svg"},
            ],
            "sort_order": 10,
        },
        {
            "key": "tools",
            "title": "Tools",
            "stream_direction": "right",
            "items": [
                {"label": "Docker", "iconKey": "tooling"},
                {"label": "Celery", "iconKey": "server"},
                {"label": "Git / CI", "iconKey": "cpu"},
                {"label": "Linux", "iconKey": "tooling"},
            ],
            "logos": [
                {"name": "Docker", "src": "https://cdn.simpleicons.org/docker/2496ED"},
                {"name": "RabbitMQ", "src": "https://cdn.simpleicons.org/rabbitmq/FF6600"},
                {"name": "Git", "src": "https://cdn.simpleicons.org/git/F05032"},
                {"name": "GitHub", "src": "https://skillicons.dev/icons?i=github"},
                {"name": "GitHub Actions", "src": "https://skillicons.dev/icons?i=githubactions"},
                {"name": "Nginx", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg"},
                {"name": "Postman", "src": "https://skillicons.dev/icons?i=postman"},
                {"name": "VS Code", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg"},
            ],
            "sort_order": 20,
        },
        {
            "key": "concepts",
            "title": "Concepts",
            "stream_direction": "left",
            "items": [
                {"label": "API Design", "iconKey": "api"},
                {"label": "Scalability", "iconKey": "concept"},
                {"label": "Async Systems", "iconKey": "bot"},
                {"label": "Realtime Comms", "iconKey": "server"},
            ],
            "logos": [
                {"name": "Linux", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg"},
                {"name": "Bash", "src": "https://cdn.simpleicons.org/gnubash/4EAA25"},
                {"name": "AWS", "src": "https://skillicons.dev/icons?i=aws"},
                {"name": "GCP", "src": "https://skillicons.dev/icons?i=gcp"},
                {"name": "JavaScript", "src": "https://skillicons.dev/icons?i=js"},
                {"name": "HTML5", "src": "https://skillicons.dev/icons?i=html"},
                {"name": "CSS3", "src": "https://skillicons.dev/icons?i=css"},
                {"name": "PyCharm", "src": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pycharm/pycharm-original.svg"},
            ],
            "sort_order": 30,
        },
    ]

    for payload in groups:
        SkillGroup.objects.update_or_create(key=payload["key"], defaults=payload)


def clear_content(apps, _schema_editor):
    Project = apps.get_model("portfolio", "Project")
    SkillGroup = apps.get_model("portfolio", "SkillGroup")
    Project.objects.all().delete()
    SkillGroup.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("portfolio", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="contactmessage",
            name="ip_address",
            field=models.GenericIPAddressField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="is_spam",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="source_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="contactmessage",
            name="user_agent",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(unique=True)),
                ("title", models.CharField(max_length=120)),
                ("summary", models.CharField(max_length=220)),
                ("description", models.TextField()),
                ("architecture", models.TextField()),
                ("api_hint", models.CharField(max_length=160)),
                ("signal", models.CharField(choices=[("blue", "Blue"), ("red", "Red")], default="blue", max_length=8)),
                ("tech_stack", models.JSONField(default=list)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["sort_order", "id"]},
        ),
        migrations.CreateModel(
            name="SkillGroup",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(unique=True)),
                ("title", models.CharField(max_length=80)),
                ("stream_direction", models.CharField(choices=[("left", "Left"), ("right", "Right")], default="left", max_length=8)),
                ("items", models.JSONField(default=list)),
                ("logos", models.JSONField(default=list)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["sort_order", "id"]},
        ),
        migrations.RunPython(seed_content, reverse_code=clear_content),
    ]
