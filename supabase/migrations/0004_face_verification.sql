-- 0004: verifikasi wajah otomatis (deskriptor 128-D + liveness tantangan gerak)
-- Selfie tidak lagi wajib; yang disimpan adalah deskriptor hasil model di perangkat pengguna.

alter table verifications alter column selfie_path drop not null;
alter table verifications add column if not exists face_descriptor jsonb;
alter table verifications add column if not exists device text;

create index if not exists verifications_approved_idx on verifications (status) where status = 'approved';
create index if not exists verifications_profile_status_idx on verifications (profile_id, status);

-- Satu profil hanya boleh punya satu verifikasi aktif.
create unique index if not exists verifications_one_approved
  on verifications (profile_id) where status = 'approved';
