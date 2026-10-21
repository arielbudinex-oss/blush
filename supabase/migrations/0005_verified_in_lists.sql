-- 0005: sertakan status verifikasi di daftar like & match supaya badge centang konsisten.

drop function if exists public.likes_received();
create function public.likes_received()
returns table (
  id uuid, display_name text, age int, photos text[],
  action swipe_action_t, created_at timestamptz, is_verified verify_status_t
)
language sql security definer stable set search_path = public, extensions as $$
  select p.id, p.display_name, date_part('year', age(p.birthdate))::int,
         coalesce(array(select ph.storage_path from photos ph where ph.profile_id = p.id order by ph.position), '{}'),
         s.action, s.created_at, p.is_verified
  from swipes s join profiles p on p.id = s.actor_id
  where s.target_id = auth.uid() and s.action in ('like','superlike')
    and not exists (select 1 from swipes mine where mine.actor_id = auth.uid() and mine.target_id = s.actor_id)
    and not exists (select 1 from blocks b where (b.blocker_id = auth.uid() and b.blocked_id = p.id) or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
  order by s.created_at desc limit 100;
$$;

grant execute on function public.likes_received() to authenticated;

drop function if exists public.my_matches();
create function public.my_matches()
returns table (
  match_id uuid, other_id uuid, display_name text, photos text[], created_at timestamptz,
  last_message text, last_message_at timestamptz, unread int, expires_at timestamptz,
  is_verified verify_status_t
)
language sql security definer stable set search_path = public, extensions as $$
  select m.id, o.id, o.display_name,
         coalesce(array(select ph.storage_path from photos ph where ph.profile_id = o.id order by ph.position), '{}'),
         m.created_at,
         (select ms.body from messages ms where ms.match_id = m.id order by ms.created_at desc limit 1),
         (select ms.created_at from messages ms where ms.match_id = m.id order by ms.created_at desc limit 1),
         (select count(*)::int from messages ms where ms.match_id = m.id and ms.sender_id <> auth.uid() and ms.read_at is null),
         m.expires_at,
         o.is_verified
  from matches m
  join profiles o on o.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  where (m.user_a = auth.uid() or m.user_b = auth.uid())
    and m.unmatched_by is null
    and (m.expires_at is null or m.expires_at > now())
  order by coalesce((select ms.created_at from messages ms where ms.match_id = m.id order by ms.created_at desc limit 1), m.created_at) desc;
$$;

grant execute on function public.my_matches() to authenticated;
