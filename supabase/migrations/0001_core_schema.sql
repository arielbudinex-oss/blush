create extension if not exists postgis;
create extension if not exists pgcrypto;

create type gender_t as enum ('woman','man','nonbinary');
create type intent_t as enum ('relationship','dating','friends');
create type swipe_action_t as enum ('like','pass','superlike');
create type plan_t as enum ('free','plus','gold');
create type payment_status_t as enum ('pending','paid','expired','failed');
create type report_status_t as enum ('open','reviewing','closed');
create type verify_status_t as enum ('none','pending','approved','rejected');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text,
  display_name text not null default '',
  birthdate date,
  gender gender_t,
  bio text not null default '',
  job text not null default '',
  city text not null default '',
  intent intent_t not null default 'dating',
  location extensions.geography(point, 4326),
  is_verified verify_status_t not null default 'none',
  role text not null default 'member' check (role in ('member','admin')),
  plan plan_t not null default 'free',
  plan_expires_at timestamptz,
  onboarded_at timestamptz,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index profiles_handle_key on profiles (lower(handle)) where handle is not null;
create index profiles_location_idx on profiles using gist (location);

create table preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  min_age int not null default 18 check (min_age between 18 and 99),
  max_age int not null default 45 check (max_age between 18 and 99),
  max_distance_km int not null default 50 check (max_distance_km between 1 and 20000),
  show_gender gender_t[] not null default '{woman,man}'::gender_t[],
  intent intent_t,
  updated_at timestamptz not null default now()
);

create table interests (
  id serial primary key,
  slug text unique not null,
  label text not null
);

create table profile_interests (
  profile_id uuid not null references profiles(id) on delete cascade,
  interest_id int not null references interests(id) on delete cascade,
  primary key (profile_id, interest_id)
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null,
  position int not null default 0 check (position between 0 and 8),
  created_at timestamptz not null default now(),
  unique (profile_id, position)
);

create table swipes (
  id bigserial primary key,
  actor_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  action swipe_action_t not null,
  created_at timestamptz not null default now(),
  unique (actor_id, target_id),
  check (actor_id <> target_id)
);
create index swipes_actor_idx on swipes (actor_id, created_at desc);
create index swipes_target_idx on swipes (target_id);

create table matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unmatched_by uuid references profiles(id) on delete set null,
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table messages (
  id bigserial primary key,
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_match_idx on messages (match_id, created_at desc);

create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table reports (
  id bigserial primary key,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  details text,
  status report_status_t not null default 'open',
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  plan plan_t not null,
  months int not null default 1 check (months between 1 and 12),
  amount_idr int not null check (amount_idr > 0),
  status payment_status_t not null default 'pending',
  method text not null default 'qris',
  qris_payload text,
  provider_ref text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes',
  paid_at timestamptz
);
create index payments_profile_idx on payments (profile_id, created_at desc);

create table boosts (
  id bigserial primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create or replace function public.is_matched_with(p_other uuid) returns boolean
language sql security definer stable set search_path = public, extensions as $$
  select exists (
    select 1 from matches m
    where m.unmatched_by is null
      and ((m.user_a = auth.uid() and m.user_b = p_other) or (m.user_b = auth.uid() and m.user_a = p_other))
  );
$$;

create or replace function public.can_access_match(p_match uuid) returns boolean
language sql security definer stable set search_path = public, extensions as $$
  select exists (select 1 from matches m where m.id = p_match and (m.user_a = auth.uid() or m.user_b = auth.uid()));
$$;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public, extensions as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.likes_used_today() returns int
language sql security definer stable set search_path = public, extensions as $$
  select count(*)::int from swipes s
  where s.actor_id = auth.uid() and s.action in ('like','superlike')
    and s.created_at >= date_trunc('day', now());
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name','')) on conflict (id) do nothing;
  insert into preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_swipe() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.action in ('like','superlike') then
    if exists (
      select 1 from swipes s
      where s.actor_id = new.target_id and s.target_id = new.actor_id and s.action in ('like','superlike')
    ) then
      insert into matches (user_a, user_b)
      values (least(new.actor_id, new.target_id), greatest(new.actor_id, new.target_id))
      on conflict (user_a, user_b) do nothing;
    end if;
  end if;
  return new;
end;
$$;
create trigger swipes_after_insert after insert on swipes
  for each row execute function public.handle_swipe();

create or replace function public.discover_candidates(p_limit int default 20, p_verified_only boolean default false)
returns table (
  id uuid, display_name text, age int, gender gender_t, bio text, job text, city text,
  intent intent_t, is_verified verify_status_t, distance_m int, photos text[], interests text[]
)
language sql security definer stable set search_path = public, extensions as $$
  with me as (
    select p.id, p.location, pref.min_age, pref.max_age, pref.max_distance_km, pref.show_gender, pref.intent as pref_intent
    from profiles p join preferences pref on pref.user_id = p.id
    where p.id = auth.uid()
  ), boosted as (
    select b.profile_id from boosts b where b.expires_at > now()
  )
  select p.id, p.display_name,
         date_part('year', age(p.birthdate))::int as age,
         p.gender, p.bio, p.job, p.city, p.intent, p.is_verified,
         case when p.location is not null and me.location is not null then st_distance(p.location, me.location)::int else null end as distance_m,
         coalesce(array(select ph.storage_path from photos ph where ph.profile_id = p.id order by ph.position), '{}') as photos,
         coalesce(array(select i.slug from profile_interests pi join interests i on i.id = pi.interest_id where pi.profile_id = p.id), '{}') as interests
  from profiles p, me
  where p.id <> me.id
    and p.onboarded_at is not null
    and p.birthdate is not null
    and date_part('year', age(p.birthdate))::int between me.min_age and me.max_age
    and p.gender = any(me.show_gender)
    and (me.pref_intent is null or p.intent = me.pref_intent)
    and (not p_verified_only or p.is_verified = 'approved')
    and (me.location is null or p.location is null or st_dwithin(p.location, me.location, me.max_distance_km * 1000))
    and not exists (select 1 from swipes s where s.actor_id = me.id and s.target_id = p.id)
    and not exists (select 1 from blocks b where (b.blocker_id = me.id and b.blocked_id = p.id) or (b.blocker_id = p.id and b.blocked_id = me.id))
  order by (p.id in (select profile_id from boosted)) desc, p.last_active_at desc
  limit greatest(1, least(p_limit, 50));
$$;

create or replace function public.likes_received()
returns table (id uuid, display_name text, age int, photos text[], action swipe_action_t, created_at timestamptz)
language sql security definer stable set search_path = public, extensions as $$
  select p.id, p.display_name, date_part('year', age(p.birthdate))::int,
         coalesce(array(select ph.storage_path from photos ph where ph.profile_id = p.id order by ph.position), '{}'),
         s.action, s.created_at
  from swipes s join profiles p on p.id = s.actor_id
  where s.target_id = auth.uid() and s.action in ('like','superlike')
    and not exists (select 1 from swipes mine where mine.actor_id = auth.uid() and mine.target_id = s.actor_id)
    and not exists (select 1 from blocks b where (b.blocker_id = auth.uid() and b.blocked_id = p.id) or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
  order by s.created_at desc limit 100;
$$;

create or replace function public.my_matches()
returns table (match_id uuid, other_id uuid, display_name text, photos text[], created_at timestamptz, last_message text, last_message_at timestamptz, unread int)
language sql security definer stable set search_path = public, extensions as $$
  select m.id, o.id, o.display_name,
         coalesce(array(select ph.storage_path from photos ph where ph.profile_id = o.id order by ph.position), '{}'),
         m.created_at,
         (select ms.body from messages ms where ms.match_id = m.id order by ms.created_at desc limit 1),
         (select ms.created_at from messages ms where ms.match_id = m.id order by ms.created_at desc limit 1),
         (select count(*)::int from messages ms where ms.match_id = m.id and ms.sender_id <> auth.uid() and ms.read_at is null)
  from matches m
  join profiles o on o.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  where (m.user_a = auth.uid() or m.user_b = auth.uid()) and m.unmatched_by is null
  order by coalesce((select ms.created_at from messages ms where ms.match_id = m.id order by ms.created_at desc limit 1), m.created_at) desc;
$$;

alter table profiles enable row level security;
alter table preferences enable row level security;
alter table interests enable row level security;
alter table profile_interests enable row level security;
alter table photos enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table blocks enable row level security;
alter table reports enable row level security;
alter table payments enable row level security;
alter table boosts enable row level security;

create policy profiles_select on profiles for select to authenticated using (id = auth.uid() or public.is_matched_with(id));
create policy profiles_admin_select on profiles for select to authenticated using (public.is_admin());
create policy profiles_update on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

revoke all on profiles from anon, authenticated;
grant select on profiles to authenticated;
grant update (handle, display_name, birthdate, gender, bio, job, city, intent, location, onboarded_at, last_active_at) on profiles to authenticated;

create policy preferences_own on preferences for select to authenticated using (user_id = auth.uid());
create policy preferences_update on preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy preferences_insert on preferences for insert to authenticated with check (user_id = auth.uid());

create policy interests_read on interests for select to authenticated using (true);
create policy pi_own on profile_interests for all to authenticated using (profile_id = auth.uid() or public.is_matched_with(profile_id)) with check (profile_id = auth.uid());

create policy photos_read on photos for select to authenticated using (profile_id = auth.uid() or public.is_matched_with(profile_id));
create policy photos_write on photos for insert to authenticated with check (profile_id = auth.uid());
create policy photos_delete on photos for delete to authenticated using (profile_id = auth.uid());

create policy swipes_own on swipes for select to authenticated using (actor_id = auth.uid());
create policy swipes_insert on swipes for insert to authenticated with check (actor_id = auth.uid());
create policy swipes_undo on swipes for delete to authenticated using (actor_id = auth.uid());

create policy matches_read on matches for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());
create policy matches_update on matches for update to authenticated using (user_a = auth.uid() or user_b = auth.uid()) with check (user_a = auth.uid() or user_b = auth.uid());

create policy messages_read on messages for select to authenticated using (public.can_access_match(match_id));
create policy messages_send on messages for insert to authenticated with check (sender_id = auth.uid() and public.can_access_match(match_id));
create policy messages_flag on messages for update to authenticated using (public.can_access_match(match_id) and sender_id <> auth.uid()) with check (public.can_access_match(match_id));

create policy blocks_own on blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy reports_insert on reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_read on reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy payments_read on payments for select to authenticated using (profile_id = auth.uid() or public.is_admin());
create policy boosts_read on boosts for select to authenticated using (profile_id = auth.uid());

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table matches;

insert into storage.buckets (id, name, public) values ('photos','photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('verifications','verifications', false) on conflict (id) do nothing;
create policy photos_obj_read on storage.objects for select using (bucket_id = 'photos');
create policy photos_obj_insert on storage.objects for insert to authenticated with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_obj_update on storage.objects for update to authenticated using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_obj_delete on storage.objects for delete to authenticated using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy verif_own on storage.objects for all to authenticated using (bucket_id = 'verifications' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'verifications' and (storage.foldername(name))[1] = auth.uid()::text);

insert into interests (slug, label) values
  ('kopi','Ngopi'),('hiking','Hiking'),('musik','Musik'),('film','Film'),('kucing','Kucing'),
  ('anjing','Anjing'),('masak','Masak'),('gym','Gym'),('lari','Lari'),('buku','Baca buku'),
  ('game','Gaming'),('foto','Fotografi'),('travel','Traveling'),('seni','Seni'),('konser','Konser'),
  ('kuliner','Kulineran'),('startup','Startup'),('coding','Coding'),('tari','Dansa'),('yoga','Yoga')
on conflict (slug) do nothing;
