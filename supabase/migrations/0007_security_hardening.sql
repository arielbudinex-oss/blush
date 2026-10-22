-- Batasi kolom yang boleh diubah user. Sebelumnya user bisa mengubah role,
-- plan, plan_expires_at, atau is_verified miliknya sendiri lewat PostgREST.
revoke update on public.profiles from authenticated, anon;
grant update (
  display_name, birthdate, gender, bio, job, city, intent, location, hidden,
  height_cm, exercise, drinking, smoking, pets, zodiac, education, languages,
  hometown, handle, last_active_at, onboarded_at
) on public.profiles to authenticated;

-- Status verifikasi hanya boleh ditulis server dengan service role.
revoke insert, update, delete on public.verifications from authenticated, anon;
revoke all on public.verifications from authenticated, anon;

-- Satu-satunya kolom match yang boleh diubah klien adalah unmatched_by.
revoke update on public.matches from authenticated, anon;
grant update (unmatched_by) on public.matches to authenticated;

-- Pesan tidak boleh dibaca setelah match ditutup atau kedaluwarsa.
create or replace function public.can_access_match(p_match uuid)
returns boolean
language sql
stable security definer
set search_path to 'public', 'extensions'
as $$
  select exists (
    select 1 from matches m
    where m.id = p_match
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
      and m.unmatched_by is null
      and (m.expires_at is null or m.expires_at > now())
  );
$$;

-- Selfie verifikasi hanya diakses server/admin, bukan dari sesi user.
drop policy if exists verif_own on storage.objects;
