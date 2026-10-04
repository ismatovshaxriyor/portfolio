# Server deploy

Runs on `main_bots_server` in `/root/portfolio`:

    .env                 secrets, created on the server and never synced
    docker-compose.yml   from deploy/
    nginx/default.conf   from deploy/nginx/
    app/                 this repo (see .dockerignore for what stays out)
    build/fronted/       fronted/, built there in a node container
    sites/main/          its dist              -> ismatov.uz
    sites/beta/          portfolio_3d's dist   -> beta.ismatov.uz

Traffic: Cloudflare -> the bots' Caddy (`/root/bots/oddiy_test_bot`, which owns
ports 80/443 and has the `ismatov.uz`, `www.ismatov.uz` and `beta.ismatov.uz`
blocks) -> `portfolio-nginx` over the `oddiy_test_bot_default` network. If that
network is ever recreated, restart this stack so nginx joins it again.

`.env`: `SECRET_KEY`, `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS`,
`DJANGO_CSRF_TRUSTED_ORIGINS` (also the contact form's allowed origins),
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

- Deploy the API and the main site: `deploy/deploy.sh`
- Deploy the beta: `npm run deploy:beta` in portfolio_3d
- Admin user: `ssh main_bots_server 'cd /root/portfolio && docker compose exec web python manage.py createsuperuser'`
- Logs: `docker compose logs -f web nginx`
- Backups: the `backup` service writes a `pg_dump` into `/root/portfolio/backups` daily (14 days kept)
