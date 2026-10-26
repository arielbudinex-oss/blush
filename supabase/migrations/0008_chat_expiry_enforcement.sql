-- Batas waktu mulai chat: pesan baru hanya boleh masuk selama match masih terbuka.
-- expires_at null berarti chat sudah dibuka (pesan pertama menghapus batas).
create or replace function public.match_is_open(p_match uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match
      and m.unmatched_by is null
      and (m.expires_at is null or m.expires_at > now())
      and (auth.uid() = m.user_a or auth.uid() = m.user_b)
  );
$$;
revoke all on function public.match_is_open(uuid) from anon;
grant execute on function public.match_is_open(uuid) to authenticated;

drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.can_access_match(match_id) and public.match_is_open(match_id));
