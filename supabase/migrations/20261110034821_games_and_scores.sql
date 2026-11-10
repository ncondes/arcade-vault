-- Spec 06: catálogo de juegos y puntuaciones.
-- Una sola migración con esquema, seguridad y siembra, para que en remoto no llegue a existir
-- nunca una tabla sin RLS.

-- =====================================================================
-- Catálogo
-- =====================================================================
create table public.games (
  id        text primary key check (id ~ '^[a-z0-9-]+$'),
  title     text not null,
  short     text not null,
  long      text not null,
  category  text not null check (category in ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS')),
  -- Check laxo a propósito: la lista cerrada vive en el tipo TS `CoverClass`.
  cover     text not null check (cover like 'cover-%'),
  color     text not null check (color in ('cyan', 'magenta', 'yellow', 'green')),
  position  smallint not null unique
);

-- =====================================================================
-- Puntuaciones
-- =====================================================================
create table public.scores (
  id          bigint generated always as identity primary key,
  game_id     text not null references public.games (id),
  name        text not null check (name ~ '^[A-Z0-9_]{1,10}$'),
  score       integer not null check (score between 0 and 10000000),
  created_at  timestamptz not null default now()
);

-- Cubre también la FK `game_id` (columna inicial del índice).
create index scores_game_score_idx on public.scores (game_id, score desc, created_at);
create index scores_created_idx on public.scores (created_at desc);

-- =====================================================================
-- RLS y políticas
-- =====================================================================
alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games: lectura pública"
  on public.games for select
  to anon, authenticated
  using (true);

create policy "scores: lectura pública"
  on public.scores for select
  to anon, authenticated
  using (true);

-- Repite la validación del check de la tabla: no queda como `with check (true)`.
create policy "scores: inserción anónima validada"
  on public.scores for insert
  to anon, authenticated
  with check (
    name ~ '^[A-Z0-9_]{1,10}$'
    and score between 0 and 10000000
  );

-- Sin políticas de update ni de delete en ninguna de las dos tablas.

-- =====================================================================
-- Grants explícitos
-- =====================================================================
-- Se parte de cero para no depender de los privilegios por defecto del proyecto, y solo se
-- concede lo que la spec permite. Ningún grant de update ni de delete.
revoke all on public.games from anon, authenticated;
revoke all on public.scores from anon, authenticated;

grant select on public.games to anon, authenticated;
grant select on public.scores to anon, authenticated;
-- Insert solo de las columnas que pone el cliente: `id` y `created_at` los pone la BD, así que
-- nadie puede antedatar una marca para ganar un desempate.
grant insert (game_id, name, score) on public.scores to anon, authenticated;

-- =====================================================================
-- Vistas de agregados (heredan el RLS de `scores` con security_invoker)
-- =====================================================================

-- Una fila por (juego, nombre): su mejor marca y cuándo la consiguió por primera vez.
create view public.game_player_bests
  with (security_invoker = true)
as
select distinct on (s.game_id, s.name)
  s.game_id,
  s.name,
  s.score,
  s.created_at as achieved_at
from public.scores s
order by s.game_id, s.name, s.score desc, s.created_at asc;

-- Una fila por juego con puntuaciones: récord y número total de filas guardadas.
create view public.game_stats
  with (security_invoker = true)
as
select
  s.game_id,
  max(s.score) as best,
  count(*) as score_count
from public.scores s
group by s.game_id;

-- Una fila por nombre: su marca individual más alta en cualquier juego.
create view public.player_bests
  with (security_invoker = true)
as
select distinct on (s.name)
  s.name,
  s.score as best,
  s.created_at as achieved_at
from public.scores s
order by s.name, s.score desc, s.created_at asc;

revoke all on public.game_player_bests from anon, authenticated;
revoke all on public.game_stats from anon, authenticated;
revoke all on public.player_bests from anon, authenticated;

grant select on public.game_player_bests to anon, authenticated;
grant select on public.game_stats to anon, authenticated;
grant select on public.player_bests to anon, authenticated;

-- =====================================================================
-- Siembra del catálogo (copiada de `GAMES` en app/lib/games.ts, mismo orden)
-- =====================================================================
insert into public.games (id, title, short, long, category, cover, color, position) values
  (
    'asteroides',
    'ASTEROIDES',
    'Parte las rocas antes de que te partan a ti.',
    'Tu nave deriva sin fricción por un campo de asteroides que no tiene bordes: sal por un lado y vuelves por el otro. Cada roca grande se parte en dos medianas, y cada mediana en dos pequeñas — más rápidas, más pequeñas y más difíciles de acertar. Si la suerte acompaña, caerá un módulo de disparo triple.',
    'SHOOTER', 'cover-asteroides', 'yellow', 1
  ),
  (
    'bloque-buster',
    'BLOQUE BUSTER',
    'Rebota la pelota y destruye muros de neón.',
    'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?',
    'ARCADE', 'cover-bricks', 'cyan', 2
  ),
  (
    'caida',
    'CAÍDA',
    'Encaja las piezas antes de que el techo te aplaste.',
    'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.',
    'PUZZLE', 'cover-tetro', 'magenta', 3
  ),
  (
    'serpentina',
    'SERPENTINA',
    'Crece sin morder tu propia cola.',
    'Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.',
    'ARCADE', 'cover-snake', 'green', 4
  ),
  (
    'gloton',
    'GLOTÓN',
    'Devora puntos y escapa de los fantasmas.',
    'Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.',
    'ARCADE', 'cover-glot', 'yellow', 5
  ),
  (
    'invasores',
    'INVASORES',
    'Defiende el planeta de filas alienígenas.',
    'Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.',
    'SHOOTER', 'cover-invaders', 'green', 6
  ),
  (
    'rocas',
    'ROCAS',
    'Pulveriza asteroides en gravedad cero.',
    'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.',
    'SHOOTER', 'cover-rocas', 'yellow', 7
  ),
  (
    'ranaria',
    'RANARIA',
    'Cruza la autopista de pixeles.',
    'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.',
    'ARCADE', 'cover-rana', 'green', 8
  ),
  (
    'duelo-pixel',
    'DUELO PIXEL',
    'Dos paletas. Una pelota. Reflejos máximos.',
    'El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.',
    'VERSUS', 'cover-duelo', 'cyan', 9
  );
