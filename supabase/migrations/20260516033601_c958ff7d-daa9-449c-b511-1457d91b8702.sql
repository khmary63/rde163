
-- Fix function search_path
alter function public.set_updated_at() set search_path = public;

-- Revoke execute on security-definer helpers from API roles (policies still work; they run as table owner)
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.is_staff(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Tighten feedback insert policy (no empty messages, no obvious abuse)
drop policy if exists "anyone can send feedback" on public.feedback_messages;
create policy "anyone can send feedback" on public.feedback_messages
  for insert to authenticated, anon
  with check (
    length(coalesce(message,'')) between 2 and 4000
    and (phone is null or length(phone) <= 40)
    and (email is null or length(email) <= 200)
    and (name is null or length(name) <= 200)
  );
