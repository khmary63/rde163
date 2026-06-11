UPDATE public.sync_logs
SET status = 'error',
    finished_at = now(),
    message = message || ' — прервано: запрос завис на середине, закрыто вручную'
WHERE id = '024b6aee-83ca-44b7-b0cf-c1f0052cd239'
  AND status = 'running';