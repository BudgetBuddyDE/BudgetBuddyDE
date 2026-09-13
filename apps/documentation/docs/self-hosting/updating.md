---
title: Updating
description: Upgrade a self-hosted instance and keep backups.
icon: RefreshCw
---

## Back up first

Always create a database backup before updating:

```bash
docker exec db pg_dump -U myuser mydatabase > backup-$(date +%Y-%m-%d).sql
```

If you use attachments, back up your object storage bucket as well.

## Update

```bash
git pull
npm install
npm run db:migrate --workspace @budgetbuddyde/db
npm run build
```

Then restart your services so they run the new build.

Migrations are the only step that touches existing data. They are additive in normal releases, but a backup is still the fastest way back if something goes wrong.

## Verify

After restarting:

- Check the [health endpoints](/self-hosting/installation#6-verify), including database and Redis connectivity.
- Sign in and open the dashboard once.
- Check the backend logs for errors from the daily recurring-payment job.

## Rolling back

1. Stop the services.
2. Check out the previous release (`git checkout <tag>`).
3. Restore the backup if the update included a schema migration you need to undo.
4. Run `npm install` and `npm run build` again, then restart.

## Next step

- [Troubleshooting](/self-hosting/troubleshooting)
