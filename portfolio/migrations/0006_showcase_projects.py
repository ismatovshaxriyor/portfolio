from django.db import migrations

# The projects the 3D rewrite (beta.ismatov.uz) shows, so both sites list the
# same work. The original placeholders are switched off, not deleted.
PLACEHOLDER_SLUGS = ("marketplace-bot", "movie-download-bot", "realtime-chat-api", "drf-boilerplate")

PROJECTS = [
    {
        "slug": "navigo",
        "title": "Navigo",
        "summary": "Multi-tenant CRM for US car-shipping brokers, from lead to dispatched order.",
        "description": (
            "As the main backend developer, built the lead intake API, auto-quoting, Central and Super Dispatch "
            "load-board sync and a live email/SMS inbox, then rebuilt it as a multi-tenant SaaS."
        ),
        "architecture": (
            "DRF API on gunicorn with Daphne WebSockets behind nginx. Celery/Redis jobs sync the load boards, "
            "SMS and Gmail, and every company gets its own PostgreSQL schema (django-tenants)."
        ),
        "api_hint": "GET /projects/navigo",
        "project_url": "https://navigocrm.com",
        "signal": "blue",
        "tech_stack": ["Django", "DRF", "django-tenants", "PostgreSQL", "Celery", "Channels"],
    },
    {
        "slug": "topmaster",
        "title": "TopMaster",
        "summary": "Two-sided marketplace connecting Uzbek clients with verified tradespeople.",
        "description": (
            "Built the Django REST + Channels backend: job posts, proposals, reviews, tradesperson verification, "
            "real-time chat and push, plus PostgreSQL full-text and geo search."
        ),
        "architecture": (
            "REST and WebSocket APIs with Celery/Redis workers, PostgreSQL full-text and geo queries, MinIO media "
            "storage and FCM push. Runs in Docker on AWS EC2 behind Nginx/TLS, deployed by GitHub Actions."
        ),
        "api_hint": "GET /projects/topmaster",
        "project_url": "https://github.com/ismatovshaxriyor/topmaster",
        "signal": "red",
        "tech_stack": ["Django", "DRF", "Channels", "PostgreSQL", "Celery", "AWS EC2"],
    },
    {
        "slug": "kinobot",
        "title": "KinoBot",
        "summary": "Uzbek Telegram movie bot with code lookup, fuzzy search and AI recommendations.",
        "description": (
            "Built pg_trgm search that ignores Uzbek apostrophe variants and typos, an in-chat admin panel, and a "
            "Redis send-queue worker that paces broadcasts under Telegram flood limits."
        ),
        "architecture": (
            "Two processes: the bot and a Redis-backed send-queue worker with rate pacing and flood-wait retries. "
            "Tortoise ORM on PostgreSQL with trigram indexes, shipped with Docker Compose."
        ),
        "api_hint": "GET /projects/kinobot",
        "project_url": "https://github.com/ismatovshaxriyor/kino_bot",
        "signal": "blue",
        "tech_stack": ["python-telegram-bot", "PostgreSQL", "Tortoise ORM", "Redis", "Gemini API"],
    },
    {
        "slug": "hamrohpos",
        "title": "HamrohPOS",
        "summary": "Offline-first restaurant POS with cloud licensing, sync and QR menus.",
        "description": (
            "Built both Django servers: one inside each restaurant keeps orders, kitchen printing and staff apps "
            "working offline; the cloud one signs licenses, collects sales and rolls out updates."
        ),
        "architecture": (
            "Ona-Bola design: the cloud signs RS256 license tokens that each restaurant stack verifies offline. "
            "Heartbeats every 60 s carry queued commands, finished orders sync upstream and Watchtower applies updates."
        ),
        "api_hint": "GET /projects/hamrohpos",
        "project_url": "",
        "signal": "red",
        "tech_stack": ["Django", "DRF", "Channels", "PostgreSQL", "Celery", "Docker", "React"],
    },
]


def publish(apps, _schema_editor):
    Project = apps.get_model("portfolio", "Project")
    Project.objects.filter(slug__in=PLACEHOLDER_SLUGS).update(is_active=False)
    for order, payload in enumerate(PROJECTS, start=1):
        Project.objects.update_or_create(
            slug=payload["slug"], defaults={**payload, "sort_order": order, "is_active": True}
        )


def unpublish(apps, _schema_editor):
    Project = apps.get_model("portfolio", "Project")
    Project.objects.filter(slug__in=[payload["slug"] for payload in PROJECTS]).delete()
    Project.objects.filter(slug__in=PLACEHOLDER_SLUGS).update(is_active=True)


class Migration(migrations.Migration):
    dependencies = [("portfolio", "0005_project_project_url")]

    operations = [migrations.RunPython(publish, reverse_code=unpublish)]
