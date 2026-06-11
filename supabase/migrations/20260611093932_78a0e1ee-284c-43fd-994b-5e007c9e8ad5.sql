UPDATE public.sync_logs
SET status = 'error',
    finished_at = now(),
    message = message || ' — прервано (зависший запуск, закрыто автоматически)'
WHERE status = 'running'
  AND started_at < now() - interval '10 minutes';