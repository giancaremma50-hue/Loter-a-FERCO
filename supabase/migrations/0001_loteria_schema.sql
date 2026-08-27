create table if not exists public.loteria_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  country text,
  status text not null default 'waiting'
    check (status in ('waiting','playing','verifying','finished')),
  pattern text not null default 'lleno'
    check (pattern in ('linea','esquinas','lleno')),
  drawn_pieces int[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.loteria_card_templates (
  id serial primary key,
  grid int[] not null
);

create table if not exists public.loteria_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.loteria_rooms(id) on delete cascade,
  name text not null,
  template_id int references public.loteria_card_templates(id),
  confirmed boolean not null default false,
  marks boolean[] not null default array_fill(false, array[16]),
  shouted_at timestamptz,
  joined_at timestamptz not null default now()
);

alter table public.loteria_rooms enable row level security;
alter table public.loteria_card_templates enable row level security;
alter table public.loteria_players enable row level security;

-- Juego interno de oficina, sin login de usuario: acceso anónimo abierto
-- a estas 3 tablas (no hay datos sensibles, solo nombre + estado de juego).
create policy "loteria anon all rooms" on public.loteria_rooms
  for all using (true) with check (true);
create policy "loteria anon read templates" on public.loteria_card_templates
  for select using (true);
create policy "loteria anon all players" on public.loteria_players
  for all using (true) with check (true);

alter publication supabase_realtime add table public.loteria_rooms;
alter publication supabase_realtime add table public.loteria_players;
