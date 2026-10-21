-- 0002: fitur tambahan (setara Bumble, implementasi sendiri)
--  1. match kedaluwarsa 24 jam kalau tidak ada yang membuka chat (+ rematch sekali)
--  2. Opening Move: pilih "tunggu lawan bicara dulu" — ditegakkan di DB, bukan di UI
--  3. Snooze / Incognito: profil disembunyikan dari discovery
--  4. Passport (gold): jelajah pakai lokasi pilihan sendiri
--  5. Filter "hanya profil terverifikasi" (gold)

alter table matches add column if not exists expires_at timestamptz not null default now() + interval '24 hours';
alter table matches add column if not exists rematch_used boolean not null default false;

alter table preferences add column if not exists opening_move text not null default 'any'
  check (opening_move in ('any', 'them_first'));
alter table preferences add column if not exists verified_only boolean not null default false;
alter table preferences add column if not exists search_lat double precision;
alter table preferences add column if not exists search_lng double precision;

alter table profiles add column if not exists hidden boolean not null default false;

-- klien boleh mengubah kolom ini pada barisnya sendiri
grant update (hidden) on profiles to authenticated;

-- 1a. match baru sudah punya expires_at dari default; pesan pertama membatalkan kedaluwarsa
create or replace function public.touch_match_on_message() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  update matches set expires_at = null where id = new.match_id and expires_at is not null;
  return new;
end;
$$;
drop trigger if exists messages_touch_match on messages;
create trigger messages_touch_match after insert on messages
  for each row execute function public.touch_match_on_message();

-- 2. Opening Move ditegakkan di DB
create or replace function public.enforce_opening_move() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  pref text;
begin
  if exists (select 1 from messages where match_id = new.match_id) then
    return new; -- bukan pesan pertama
  end if;
  select opening_move into pref from preferences where user_id = new.sender_id;
  if pref = 'them_first' then
    raise exception 'Kamu memilih menunggu lawan bicara membuka chat lebih dulu (Opening Move).';
  end if;
  return new;
end;
$$;
drop trigger if exists messages_opening_move on messages;
create trigger messages_opening_move before insert on messages
  for each row execute function public.enforce_opening_move();

-- 3 + 4 + 5. discovery: hormati hidden, passport (gold), verified_only
create or replace function public.discover_candidates(p_limit int default 20, p_verified_only boolean default false)
returns table (
  id uuid, display_name text, age int, gender gender_t, bio text, job text, city text,
  intent intent_t, is_verified verify_status_t, distance_m int, photos text[], interests text[]
)
language sql security definer stable set search_path = public, extensions as $$
  with me as (
    select p.id,
           case
             when p.plan = 'gold' and pref.search_lat is not null and pref.search_lng is not null
               then st_point(pref.search_lng, pref.search_lat)::extensions.geography
             else p.location
           end as origin,
           p.location as home,
           pref.min_age, pref.max_age, pref.max_distance_km, pref.show_gender,
           pref.intent as pref_intent, pref.verified_only
    from profiles p join preferences pref on pref.user_id = p.id
    where p.id = auth.uid()
  ), boosted as (
    select b.profile_id from boosts b where b.expires_at > now()
  )
  select p.id, p.display_name,
         date_part('year', age(p.birthdate))::int as age,
         p.gender, p.bio, p.job, p.city, p.intent, p.is_verified,
         case when p.location is not null and me.origin is not null then st_distance(p.location, me.origin)::int else null end as distance_m,
         coalesce(array(select ph.storage_path from photos ph where ph.profile_id = p.id order by ph.position), '{}') as photos,
         coalesce(array(select i.slug from profile_interests pi join interests i on i.id = pi.interest_id where pi.profile_id = p.id), '{}') as interests
  from profiles p, me
  where p.id <> me.id
    and p.onboarded_at is not null
    and p.hidden = false
    and p.birthdate is not null
    and date_part('year', age(p.birthdate))::int between me.min_age and me.max_age
    and p.gender = any(me.show_gender)
    and (me.pref_intent is null or p.intent = me.pref_intent)
    and (not coalesce(p_verified_only, false) and not me.verified_only or p.is_verified = 'approved')
    and (me.origin is null or p.location is null or st_dwithin(p.location, me.origin, me.max_distance_km * 1000))
    and not exists (select 1 from swipes s where s.actor_id = me.id and s.target_id = p.id)
    and not exists (select 1 from blocks b where (b.blocker_id = me.id and b.blocked_id = p.id) or (b.blocker_id = p.id and b.blocked_id = me.id))
  order by (p.id in (select profile_id from boosted)) desc, p.last_active_at desc
  limit greatest(1, least(p_limit, 50));
$$;

-- daftar match aktif (kedaluwarsa disembunyikan)
create or replace function public.my_matches()
returns table (match_id uuid, other_id uuid, display_name text, photos text[], created_at timestamptz,
               last_message text, last_message_at timestamptz, unread int, expires_at timestamptz)
language sql security definer stable set search_path = public, extensions as $$
  select m.id, o.id, o.display_name,
         coalesce(array(select ph.storage_path from photos ph where ph.profile_id = o.id order by ph.position), '{}'),
         m.created_at,
         (select ms.body from messages ms where ms.match_id = m.id order by ms.created_at desc limit 1),
         (select ms.created_at from messages ms where ms.match_id = m.id order by ms.created_at desc limit 1),
         (select count(*)::int from messages ms where ms.match_id = m.id and ms.sender_id <> auth.uid() and ms.read_at is null),
         m.expires_at
  from matches m
  join profiles o on o.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  where (m.user_a = auth.uid() or m.user_b = auth.uid())
    and m.unmatched_by is null
    and (m.expires_at is null or m.expires_at > now())
  order by coalesce((select ms.created_at from messages ms where ms.match_id = m.id order by ms.created_at desc limit 1), m.created_at) desc;
$$;

-- match kedaluwarsa yang masih bisa di-rematch
create or replace function public.expired_matches()
returns table (match_id uuid, other_id uuid, display_name text, photos text[], expires_at timestamptz, rematch_used boolean)
language sql security definer stable set search_path = public, extensions as $$
  select m.id, o.id, o.display_name,
         coalesce(array(select ph.storage_path from photos ph where ph.profile_id = o.id order by ph.position), '{}'),
         m.expires_at, m.rematch_used
  from matches m
  join profiles o on o.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  where (m.user_a = auth.uid() or m.user_b = auth.uid())
    and m.unmatched_by is null
    and m.expires_at is not null and m.expires_at <= now()
  order by m.expires_at desc limit 50;
$$;

-- rematch: beri 24 jam lagi, hanya sekali per match
create or replace function public.rematch_match(p_match uuid)
returns timestamptz
language plpgsql security definer set search_path = public, extensions as $$
declare
  new_expiry timestamptz;
begin
  if not exists (
    select 1 from matches m where m.id = p_match and (m.user_a = auth.uid() or m.user_b = auth.uid())
  ) then
    raise exception 'Match tidak ditemukan.';
  end if;
  update matches set expires_at = now() + interval '24 hours'
  where id = p_match and rematch_used = false and expires_at is not null and expires_at <= now()
  returning expires_at into new_expiry;
  if new_expiry is null then
    raise exception 'Rematch untuk match ini sudah dipakai atau match belum kedaluwarsa.';
  end if;
  update matches set rematch_used = true where id = p_match;
  return new_expiry;
end;
$$;

grant execute on function public.rematch_match(uuid) to authenticated;
grant execute on function public.expired_matches() to authenticated;
