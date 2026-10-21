-- Match berhenti kedaluwarsa setelah ada pesan pertama (touch_match_on_message set expires_at = null).
-- Kolom karena itu harus nullable; NOT NULL dari 0002 membuat setiap kirim pesan gagal 23502.
alter table public.matches alter column expires_at drop not null;
