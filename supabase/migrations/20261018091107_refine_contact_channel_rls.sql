drop policy if exists "Admins manage contact channels" on public.contact_channels;

create policy "Admins create contact channels"
on public.contact_channels for insert
to authenticated
with check (
  ((select auth.jwt())->'app_metadata'->>'role') = 'admin'
  and updated_by = (select auth.uid())
);

create policy "Admins update contact channels"
on public.contact_channels for update
to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') = 'admin')
with check (
  ((select auth.jwt())->'app_metadata'->>'role') = 'admin'
  and updated_by = (select auth.uid())
);

create policy "Admins delete contact channels"
on public.contact_channels for delete
to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
