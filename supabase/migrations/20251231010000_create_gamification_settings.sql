-- Gamification settings configuration table
begin;

create table if not exists public.gamification_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique default 'default',
  crystal_reward_session integer not null default 10,
  crystal_reward_assessment integer not null default 25,
  crystal_reward_challenge integer not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gamification_settings_name on public.gamification_settings(name);

alter table public.gamification_settings enable row level security;

drop policy if exists "Gamification settings readable" on public.gamification_settings;
create policy "Gamification settings readable"
  on public.gamification_settings
  for select
  using (true);

drop policy if exists "Admins manage gamification settings" on public.gamification_settings;
create policy "Admins manage gamification settings"
  on public.gamification_settings
  for all
  using (auth.email() = 'admin@newomen.me');

drop trigger if exists update_gamification_settings_updated_at on public.gamification_settings;
create trigger update_gamification_settings_updated_at
  before update on public.gamification_settings
  for each row
  execute function public.update_updated_at_column();

insert into public.gamification_settings (name)
values ('default')
on conflict (name) do nothing;

commit;
