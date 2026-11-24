# Supabase

Apply `migrations/20261124123500_auto_finalize_expired_exams.sql` to the
Supabase database once. It stores a server-side exam deadline and schedules a
job every minute to grade every expired session from `sesi_ujian` into `nilai`,
including locked and disqualified sessions. A disqualified session keeps the
`Diskualifikasi` result status.

The migration requires the `pg_cron` extension. In Supabase, enable it under
Database → Extensions before applying the migration if it is not already
enabled. If duplicate non-null `nilai.id_sesi` values exist, the migration
stops without creating the unique index; resolve those duplicates first.

Verify that the job is active with:

```sql
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'cbt-finalize-expired-exams';
```
