# Railway database

The website remains on Vercel. Its PostgreSQL database now runs in Railway
project `e65fcc16-2569-4081-89c8-affd53bd2092`.

Use the Railway database's public connection URL with `sslmode=require` for
`DATABASE_URL` and the `POSTGRES_*` URL variables. The deployed application
limits each function's connection pool to five connections. Production,
preview, and development Vercel database variables have been updated.

On September 7, 2026, the source's nine public tables matched the final Railway
copy by row count and content hash. Production deployment
`stravawesome-dhkf6rczn-winter-advisory.vercel.app` passed `/api/health`, including
the database and Strava checks.

The source Supabase database is retained with the application's `postgres`
role set to read-only. Backups and the previous Vercel environment are stored
outside the repository in the operator's private migration directory.

For rollback, freeze Railway writes and synchronize new data back before
restoring source write access, Vercel variables, and the previous deployment.
Do not simply promote the old deployment after new records have reached Railway.
