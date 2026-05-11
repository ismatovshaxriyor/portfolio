# Shaxriyor Ismatov Portfolio

Production-ready portfolio project with a modern frontend and API-driven backend.

## Live Website

- https://ismatov.uz

## Project Parts

- `fronted/` - Vite + React + TypeScript + Tailwind CSS frontend
- `portfolio/` + `config/` - Django + Django REST Framework backend
- `static/` - static assets

## Technology Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Django
- Django REST Framework
- Redis
- Nginx

## Official Websites

- Vite: https://vite.dev
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Tailwind CSS: https://tailwindcss.com
- Django: https://www.djangoproject.com
- Django REST Framework: https://www.django-rest-framework.org
- Redis: https://redis.io
- Nginx: https://nginx.org

## Server Monitor App

`server_monitor` is a reusable Django app for server-side monitoring and alerting.

### What it checks

- Core system health (database, cache, disk usage)
- `.env` and other watched file changes (hash-based)
- Missing critical files
- Git working tree changes
- Docker container status (optional)
- New SSH login events from auth logs

### Health endpoint

- `GET /api/server-monitor/health/`
- Optional token auth:
  - Header: `X-Server-Monitor-Token: <token>`
  - Or query: `?token=<token>`

### Run monitor loop

```bash
.venv/bin/python manage.py monitor_server --once
.venv/bin/python manage.py monitor_server --interval 30
```

### Main environment variables

```env
SERVER_MONITOR_ENABLED=true
SERVER_MONITOR_INTERVAL_SECONDS=30
SERVER_MONITOR_WATCH_FILES=.env,config/settings.py,docker-compose.yml
SERVER_MONITOR_CRITICAL_PATHS=.env,manage.py,config/settings.py
SERVER_MONITOR_GIT_WATCH_ENABLED=true
SERVER_MONITOR_DOCKER_ENABLED=false
SERVER_MONITOR_DOCKER_CONTAINER_NAMES=web,db,redis
SERVER_MONITOR_SSH_LOG_PATHS=/var/log/auth.log,/var/log/secure
SERVER_MONITOR_HEALTH_TOKEN=
SERVER_MONITOR_TELEGRAM_BOT_TOKEN=
SERVER_MONITOR_TELEGRAM_CHAT_ID=
SERVER_MONITOR_TELEGRAM_HEALTH_BUTTON_URL=https://your-domain.com/api/server-monitor/health/
SERVER_MONITOR_TELEGRAM_HEALTH_BUTTON_TEXT=Health
SERVER_MONITOR_WEBHOOK_URL=
```

`SERVER_MONITOR_TELEGRAM_HEALTH_BUTTON_URL` berilsa, Telegram alert xabarida inline tugma chiqadi. Agar `SERVER_MONITOR_HEALTH_TOKEN` to'ldirilgan bo'lsa, `token` query param avtomatik qo'shiladi.
