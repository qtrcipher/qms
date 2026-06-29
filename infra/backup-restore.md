# Backup and Restore

QMS stores durable application data in PostgreSQL. In the default Docker Compose setup, that data lives in the `postgres-data` volume. Redis is runtime infrastructure for the current MVP and does not need a persistent backup.

## What to Preserve

- PostgreSQL database: branches, services, counters, users, tickets, settings, audit events, and notification templates.
- `.env`: keep production values for `SESSION_SECRET`, `DATABASE_URL`, `REDIS_URL`, `SMTP_*`, `WEB_ORIGIN`, and `NODE_ENV`.
- Deployment files: keep the exact Compose, reverse proxy, and infrastructure configuration used for the instance.

Do not commit database dumps or production `.env` files to Git.

## Create a Backup

Create a local backup directory and export a compressed PostgreSQL dump:

```bash
mkdir -p backups
docker compose exec -T postgres pg_dump -U qms -d qms -Fc > backups/qms-$(date +%Y%m%d-%H%M%S).dump
```

Validate the dump before storing it:

```bash
docker compose exec -T postgres pg_restore --list < backups/qms-YYYYMMDD-HHMMSS.dump >/dev/null
```

Store backups somewhere separate from the server, such as encrypted object storage or a managed backup system. For production, schedule backups at least daily and keep multiple restore points.

## Restore a Backup

Stop app traffic before replacing database contents:

```bash
docker compose stop web api
docker compose up -d postgres
```

Restore into the existing `qms` database:

```bash
docker compose exec -T postgres pg_restore -U qms -d qms --clean --if-exists --no-owner < backups/qms-YYYYMMDD-HHMMSS.dump
```

Start the app again and verify health:

```bash
docker compose up -d api web
docker compose ps
curl -fsS http://localhost:3000/health
```

Sign in to `/admin`, confirm branches and services load, then create a test ticket from `/kiosk`.

## Fresh Server Recovery

On a new host:

1. Clone the repository and check out the target release or commit.
2. Restore the production `.env` with the original `SESSION_SECRET` and provider settings.
3. Run `docker compose up -d postgres redis mailpit`.
4. Restore the database dump.
5. Run `docker compose up --build -d`.
6. Verify `docker compose ps`, `/health`, `/admin`, `/staff`, `/display`, and `/kiosk`.

Keeping the original `SESSION_SECRET` preserves existing session compatibility. Rotating it is valid during incident response, but it signs out active users.
