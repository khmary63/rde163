
-- Storage bucket for order documents (invoices, etc.)
insert into storage.buckets (id, name, public)
values ('order-docs', 'order-docs', false)
on conflict (id) do nothing;

-- Staff can upload/update/delete any object in this bucket
create policy "staff upload order docs"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'order-docs' and public.is_staff(auth.uid()));

create policy "staff update order docs"
  on storage.objects for update to authenticated
  using (bucket_id = 'order-docs' and public.is_staff(auth.uid()))
  with check (bucket_id = 'order-docs' and public.is_staff(auth.uid()));

create policy "staff delete order docs"
  on storage.objects for delete to authenticated
  using (bucket_id = 'order-docs' and public.is_staff(auth.uid()));

-- Read: staff sees all; client sees only docs of own orders.
-- Path convention: <order_id>/<filename>
create policy "read order docs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'order-docs'
    and (
      public.is_staff(auth.uid())
      or exists (
        select 1 from public.orders o
        where o.id::text = (storage.foldername(name))[1]
          and o.user_id = auth.uid()
      )
    )
  );
