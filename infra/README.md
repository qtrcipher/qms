# Infrastructure

The default development and small-install deployment target is Docker Compose.

```bash
docker compose up -d postgres redis mailpit
```

For the full stack, run:

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

The API and web images include health checks. `web` waits for a healthy API, and the API waits for healthy PostgreSQL and Redis.

See [Production Deployment](production.md) before exposing QMS on a public domain.

See [Public Demo Environment](demo.md) for a disposable Caddy-backed public demo stack.

See [Backup and Restore](backup-restore.md) for PostgreSQL dump, restore, and fresh-server recovery commands.

Production deployments should set a strong `SESSION_SECRET`, use managed backups for PostgreSQL, put the API behind HTTPS, and configure a real SMTP provider.
