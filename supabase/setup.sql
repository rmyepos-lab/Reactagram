-- Hookd remote config. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Everyone can read the settings. Only users listed in `admins` can change them.

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.app_config enable row level security;
alter table public.admins enable row level security;

-- `admins` has no policies on purpose: the app can never read or change it.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "config: anyone reads" on public.app_config;
create policy "config: anyone reads" on public.app_config
  for select using (true);

drop policy if exists "config: admins insert" on public.app_config;
create policy "config: admins insert" on public.app_config
  for insert to authenticated with check (public.is_admin());

drop policy if exists "config: admins update" on public.app_config;
create policy "config: admins update" on public.app_config
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.touch_app_config()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists app_config_touch on public.app_config;
create trigger app_config_touch before update on public.app_config
  for each row execute function public.touch_app_config();

-- Starting values. Public values only: never store API secrets in this table.
insert into public.app_config (key, value) values
  ('adsEnabled', 'true'),
  ('proActivationEnabled', 'false'),
  ('helpUrl', '""'),
  ('contactEmail', '""'),
  ('contactWhatsapp', '""'),
  ('lemonSqueezyStoreId', '""'),
  ('lemonSqueezyProductId', '""')
on conflict (key) do nothing;

-- After creating your admin user (Authentication > Users > Add user), make it an admin.
-- Replace the email, then run this line on its own:
-- insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
