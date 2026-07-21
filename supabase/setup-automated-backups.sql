-- ============================================================
-- SETUP: Bucket de Storage para respaldos automáticos
-- ============================================================
-- Ejecuta esto en el SQL Editor de Supabase.
-- Crea un bucket "backups" donde el Cron Job de Vercel sube un
-- JSON completo del sistema cada noche.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('backups', 'backups', true)
on conflict (id) do nothing;

-- Acceso público (mismo criterio que el resto del sistema: sin login)
drop policy if exists "public backup access" on storage.objects;
create policy "public backup access" on storage.objects
  for all
  using (bucket_id = 'backups')
  with check (bucket_id = 'backups');
