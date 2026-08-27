-- Nombre de la partida (para el registro de ganadores)
alter table public.loteria_rooms
  add column if not exists name text not null default 'Lotería FERCO';

-- Un mismo cartón no puede repetirse dos veces en la misma sala. Esto es lo
-- que evita la condición de carrera cuando dos jugadores eligen el mismo
-- cartón casi al mismo tiempo: el segundo insert falla con 23505 y el
-- cliente lo atrapa para pedirle que elija otro.
alter table public.loteria_players
  add constraint loteria_players_room_template_unique unique (room_id, template_id);

-- Registro histórico de ganadores confirmados, para exportar por partida.
create table if not exists public.loteria_winners (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.loteria_rooms(id) on delete cascade,
  player_name text not null,
  pattern text not null,
  won_at timestamptz not null default now()
);

alter table public.loteria_winners enable row level security;

create policy "loteria anon all winners" on public.loteria_winners
  for all using (true) with check (true);
