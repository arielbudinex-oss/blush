-- 0003: verifikasi wajah + profil kaya (prompt ala dating app, vitals, caption foto)
-- Semua implementasi sendiri; tidak ada aset/kode pihak lain.

-- ---------- 1. prompt profil ----------
create table if not exists prompts (
  id serial primary key,
  text text not null unique,
  category text not null default 'umum'
);

insert into prompts (text, category) values
  ('Cara terbaikku menghabiskan Sabtu pagi', 'kebiasaan'),
  ('Aku sedang belajar', 'diri'),
  ('Tiket pesawat impianku', 'travel'),
  ('Aku akan jatuh hati kalau', 'cinta'),
  ('Dua hal yang tidak bisa kutolak', 'kebiasaan'),
  ('Green flag yang kucari', 'cinta'),
  ('Menurutku humor terbaik itu', 'kepribadian'),
  ('Kopi atau teh, dan alasannya', 'kebiasaan'),
  ('Lagu yang selalu kubuka', 'musik'),
  ('Aku paling bangga dengan', 'diri'),
  ('Akhir pekan idealku', 'kebiasaan'),
  ('Hal kecil yang bikin hariku', 'kepribadian'),
  ('Aku tidak akan pernah bosan dengan', 'diri'),
  ('Makanan favorit tengah malam', 'kuliner'),
  ('Kalau aku punya sehari bebas, aku akan', 'kebiasaan'),
  ('Baru-baru ini aku takjub pada', 'diri'),
  ('Tempat yang ingin kukunjungi tahun ini', 'travel'),
  ('Cara aku mengisi ulang energi', 'kepribadian'),
  ('Aku sedang menonton', 'hiburan'),
  ('Pet peeve-ku', 'kepribadian'),
  ('Kata orang aku', 'diri'),
  ('Skill yang sedang kupelajari', 'diri'),
  ('Aku percaya', 'nilai'),
  ('Ambisi terbesarku', 'nilai')
on conflict (text) do nothing;

create table if not exists profile_prompts (
  profile_id uuid not null references profiles(id) on delete cascade,
  prompt_id int not null references prompts(id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 300),
  position int not null default 0 check (position between 0 and 5),
  created_at timestamptz not null default now(),
  primary key (profile_id, prompt_id)
);

alter table profile_prompts enable row level security;
drop policy if exists pp_read on profile_prompts;
create policy pp_read on profile_prompts for select to authenticated using (true);
drop policy if exists pp_write on profile_prompts;
create policy pp_write on profile_prompts for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

grant select on prompts to authenticated;
grant all on profile_prompts to authenticated;

-- ---------- 2. vitals ----------
alter table profiles add column if not exists height_cm int check (height_cm between 100 and 230);
alter table profiles add column if not exists exercise text;
alter table profiles add column if not exists drinking text;
alter table profiles add column if not exists smoking text;
alter table profiles add column if not exists pets text;
alter table profiles add column if not exists zodiac text;
alter table profiles add column if not exists education text;
alter table profiles add column if not exists languages text[] not null default '{}';
alter table profiles add column if not exists hometown text;

grant select (height_cm, exercise, drinking, smoking, pets, zodiac, education, languages, hometown)
  on profiles to authenticated;
grant update (height_cm, exercise, drinking, smoking, pets, zodiac, education, languages, hometown)
  on profiles to authenticated;

-- ---------- 3. caption foto ----------
alter table photos add column if not exists caption text check (char_length(caption) <= 120);

-- ---------- 4. verifikasi wajah ----------
create table if not exists verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  selfie_path text not null,
  challenge text not null,
  liveness_passed boolean not null default false,
  similarity numeric(5,4),
  status verify_status_t not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists verifications_profile_idx on verifications (profile_id, created_at desc);
alter table verifications enable row level security;

drop policy if exists verifications_read on verifications;
create policy verifications_read on verifications for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());

drop policy if exists verifications_insert on verifications;
create policy verifications_insert on verifications for insert to authenticated
  with check (profile_id = auth.uid());

grant select, insert on verifications to authenticated;

-- ---------- 5. discovery: sertakan prompt + vitals ----------
drop function if exists public.discover_candidates(int, boolean);
create function public.discover_candidates(p_limit int default 20, p_verified_only boolean default false)
returns table (
  id uuid, display_name text, age int, gender gender_t, bio text, job text, city text,
  intent intent_t, is_verified verify_status_t, distance_m int, photos text[], interests text[],
  prompts jsonb, vitals jsonb
)
language sql security definer stable set search_path = public, extensions as $$
  with me as (
    select p.id,
           case
             when p.plan = 'gold' and pref.search_lat is not null and pref.search_lng is not null
               then st_point(pref.search_lng, pref.search_lat)::extensions.geography
             else p.location
           end as origin,
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
         coalesce(array(select i.slug from profile_interests pi join interests i on i.id = pi.interest_id where pi.profile_id = p.id), '{}') as interests,
         coalesce((select jsonb_agg(jsonb_build_object('q', pr.text, 'a', pp.answer) order by pp.position)
                   from profile_prompts pp join prompts pr on pr.id = pp.prompt_id
                   where pp.profile_id = p.id), '[]'::jsonb) as prompts,
         jsonb_strip_nulls(jsonb_build_object(
           'tinggi', p.height_cm, 'olahraga', p.exercise, 'alkohol', p.drinking,
           'rokok', p.smoking, 'hewan', p.pets, 'zodiak', p.zodiac,
           'pendidikan', p.education, 'bahasa', p.languages, 'kota_asal', p.hometown
         )) as vitals
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

grant execute on function public.discover_candidates(int, boolean) to authenticated;
