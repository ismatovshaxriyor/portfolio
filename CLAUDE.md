# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio site (https://ismatov.uz). Two independent halves that talk over a JSON API:

- **Backend** — Django 5.2 + Django REST Framework. Lives in `config/` (project settings/urls) and two apps: `portfolio/` (public content API, the contact and feedback forms, `whoami`) and `server_monitor/` (reusable server health-check + alerting app).
- **Frontend** — Vite + React 18 + TypeScript + Tailwind, in `fronted/` (note the spelling — it is not `frontend`). Single-page app; React Router is not used — routing is a manual `window.location.pathname` check in `fronted/src/App.tsx`.

Locally the backend uses SQLite (`db.sqlite3`) and an optional Redis cache; neither the database nor the venv (`.venv/`, Python 3.14) is committed. On the server it runs in Docker on Python 3.12 with Postgres and Redis (`deploy/`, see Deploy below).

The 3D rewrite of the site is a separate repository (`portfolio-3d`). Its build is served as https://beta.ismatov.uz by this stack's nginx and uses this API: its feedback form posts to `/api/feedback/` and its "Danger zone" asks `/api/whoami/`. `fronted/src/components/layout/BetaInvite.tsx` is the card that invites the main site's visitors to it.

## Commands

Backend (run from repo root):

```bash
.venv/bin/python manage.py runserver        # dev server on :8000
.venv/bin/python manage.py migrate
.venv/bin/python manage.py makemigrations
.venv/bin/python manage.py createsuperuser
.venv/bin/python manage.py collectstatic
.venv/bin/python manage.py test portfolio             # the API tests (portfolio/tests.py)
.venv/bin/python manage.py test portfolio.tests.WhoAmIAPITests.test_only_reads   # a single test
docker compose up -d redis                   # optional Redis (the root compose file only defines redis)
deploy/deploy.sh                             # ships the API and the main site to the server (see Deploy)
```

Frontend (run from `fronted/`):

```bash
npm run dev        # Vite dev server on :5173, proxies /api and /static to :8000
npm run build      # tsc --noEmit type check, then vite build
npm run preview
```

There is no JS linter configured; `npm run build` is the type-check gate (`tsc --noEmit`).

## Architecture notes

### Frontend ↔ backend wiring
- In dev, run **both** servers: Vite (`:5173`) proxies `/api` and `/static` to Django (`:8000`) — see `fronted/vite.config.ts`. The `@` import alias maps to `fronted/src`.
- `fronted/src/lib/api.ts` builds request URLs; set `VITE_API_BASE_URL` to point at a non-proxied backend, otherwise paths are used as-is (relying on the proxy).
- The public API surface is small and unauthenticated: `GET /api/projects/`, `GET /api/skills/`, `GET /api/health/`, `POST /api/contact/`, `POST /api/feedback/`, `GET /api/whoami/`, plus `GET /api/server-monitor/health/`.

### Frontend static-fallback pattern
- `Projects.tsx` and `Skills.tsx` each initialize state from hardcoded data in `fronted/src/lib/data.ts`, then fetch from the API on mount and replace state if the response is valid. If the API is unreachable, the static data stays visible — no error state.
- `Roadmap` is **entirely static** (`ROADMAP_STAGES` in `lib/data.ts`) — there is no API backing it.
- `ABOUT_TEXT[0]` contains the `{{age}}` placeholder; `About.tsx` splits on it and injects a live-computed age (from `BIRTH_DATE = new Date(2007, 1, 3)`) that ticks every second.

### API field renames (serializers)
`ProjectSerializer` maps Django snake_case to camelCase for the frontend: `slug→id`, `api_hint→apiHint`, `project_url→projectUrl`, `tech_stack→techStack`. `coverImage` is the uploaded file URL when `cover_upload` exists, falling back to the `cover_image` static path.

`SkillGroupSerializer` maps: `key→id`, `stream_direction→streamDirection`. The `items` JSONField must be an array of `{"label": string, "iconKey": SkillIconKey}` objects where `iconKey` is one of the ten values in `SkillIconKey` (`api | bot | code | concept | cpu | database | grid | layers | server | tooling`). The `logos` JSONField must be an array of `{"name": string, "src": string}` objects (the frontend validates and drops malformed entries silently).

### Public API caching + invalidation
- `ProjectListAPIView` and `SkillGroupListAPIView` cache their serialized payloads under the keys in `portfolio/cache_keys.py` (TTL from `PROJECTS_API_CACHE_TTL` / `SKILLS_API_CACHE_TTL`).
- The cache is invalidated **only** through the Django admin: `ProjectAdmin`/`SkillGroupAdmin` override `save_model`/`delete_model`/`delete_queryset` to call `invalidate_public_content_cache()`. If you add another write path for `Project`/`SkillGroup`, you must invalidate the cache yourself or stale data will be served.
- Cache backend is Redis when `REDIS_URL` is set, otherwise in-memory LocMem (see `config/settings.py`).

### DRF defaults are restrictive on purpose
- Global default permission is `IsAuthenticated`. All public endpoints opt out explicitly with `permission_classes = [AllowAny]` and `authentication_classes = []`. New public endpoints must do the same.
- The default throttle classes are the `Safe*` ones in `portfolio/throttling.py`, which **fail open** if the cache backend is down. The public views do not inherit them: each sets `throttle_classes = [ScopedRateThrottle]` (DRF's own class) with a `throttle_scope`, so that wrapper does not cover them. Rates are per-scope in `REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]` (`anon`, `user`, `health`, `public`, `contact`, `feedback`). `whoami` has no throttle at all, on purpose (see below).

### Contact form anti-spam pipeline (`portfolio/api_views.py`)
The `POST /api/contact/` flow layers several defenses, evaluated in this order — preserve it when editing:
1. Origin allow-list check (`CONTACT_ALLOWED_ORIGINS`).
2. Honeypot `website` field → silently stored as `is_spam=True`, returns success.
3. Minimum fill time (`client_elapsed_ms` < `MIN_FILL_MS` = 2500) → silently dropped as success.
4. Per-IP rate limit via cache (burst cooldown + sliding window), also fails open.
5. Only then is validation enforced and a real `ContactMessage` saved.
Spam/bot submissions deliberately return `200 success` so bots get no signal.

### Beta feedback and whoami (`portfolio/api_views.py`)
- `POST /api/feedback/` is the 3D beta's feedback form. Same origin check as the contact form. A filled honeypot (`website`) or a submit faster than `FEEDBACK_MIN_FILL_MS` (1500) gets a fake success and **nothing is stored** (the contact form stores its honeypot hits as spam). The input is validated before the per-IP limit, so a visitor who fixes a rejected form can send it again at once. The per-IP limit is kept per scope (`_rate_limited(ip, scope=...)`): feedback sent a moment ago never blocks a contact message. Rows are `Feedback` in the admin.
- `GET /api/whoami/` answers with what this server saw of the request, for the beta's Danger zone to show the visitor: the address, where Cloudflare places it (`CF-IPCountry` always arrives; city, region and coordinates only while the zone's "Add visitor location headers" managed transform is on), the data centre from the ray id, and a fixed list of the browser's own headers (never `Cookie` or `Authorization`). It promises to keep nothing, and the tests pin each part of that: no database or cache access, `throttle_classes = []` (a DRF throttle would hold every caller's address in the cache for its window), `Cache-Control: no-store, private`, and it only reads (GET, HEAD, OPTIONS).

### server_monitor app
- Reusable, self-contained Django app. `ServerMonitorService` (`services.py`) runs a fixed set of checks (`checks.py`: system health, watched-file hashes, critical paths, git working-tree changes, optional Docker containers, SSH login events), diffs results against a JSON state file (`.server_monitor_state.json`), and emits alerts only on **status change** (incident/recovery) via fingerprint comparison.
- Notifications go through `build_notifier()` (`notifiers.py`) — Telegram and/or generic webhook, configured entirely by `SERVER_MONITOR_*` env vars.
- Run as a loop: `.venv/bin/python manage.py monitor_server --once` (one pass) or `--interval 30` (continuous). `--no-notify` / `--no-persist` for dry runs.
- All config lives in the `SERVER_MONITOR` dict in `config/settings.py`, sourced from `SERVER_MONITOR_*` env vars (see README for the full list).

### Configuration
- All settings read from env via `.env` (loaded by `python-dotenv`) using the `_env_bool` / `_env_list` / `_env_int` helpers in `config/settings.py`. Prefer these helpers over raw `os.getenv` for consistent parsing.
- The database is SQLite unless `DJANGO_DATABASE=postgres`, which `deploy/docker-compose.yml` sets on the server.
- Static files served by WhiteNoise with the compressed-manifest storage (run `collectstatic` after static changes). Project cover image uploads land in `static/images/projects/` by default (`PROJECT_COVER_UPLOADS_TO_STATIC_ROOT`).
- Security cookie/SSL settings are env-gated (`DJANGO_DEBUG`, `DJANGO_SECURE_SSL_REDIRECT`) — production runs behind Cloudflare, the server's Caddy and this stack's nginx (`SECURE_PROXY_SSL_HEADER`). The visitor's address reaches Django as `X-Forwarded-For`, which nginx sets from Cloudflare's `CF-Connecting-IP`; the per-IP limits and `whoami` read it through `_client_ip()`.
- The Django admin is themed with Jazzmin (`JAZZMIN_SETTINGS`).

## Deploy

The server's stack is in `deploy/` (`deploy/README.md` has the layout): gunicorn in Docker, Postgres with a daily `pg_dump`, Redis, and an nginx that serves the main site and the beta and proxies the API, the admin and Django's static files.

- `deploy/deploy.sh` ships **the working tree**, committed or not (`.dockerignore` lists what stays out), builds `fronted/` on the server in a node container, syncs the compose file and the nginx config, then runs `docker compose up -d --build` and reloads nginx. Commit before deploying: in October 2026 the live site turned out to serve a favicon change that had only ever existed in this working tree.
- nginx resolves `web` when it loads its config. Whenever the `web` container is recreated, reload nginx (`docker compose exec -T nginx nginx -s reload`), or it may keep proxying to the old container's address.
- A change to the API alone does not need the whole script: copy the changed files into `/root/portfolio/app/`, then on the server `docker compose build web`, check the new image before it replaces the running one (`docker compose run --rm --no-deps -T web python manage.py check`), `docker compose up -d`, and reload nginx.
- The beta's files (`sites/beta`) are published from the `portfolio-3d` repository (`npm run deploy:beta` there).
- This checkout lives in iCloud, which evicts files it has not seen used for a while: the venv, `node_modules` and even some git objects can hang a command silently (`git archive` and `git grep <rev>` did; `git show <rev>:<path>` reads one object and works). That is also why the frontend is built on the server.
