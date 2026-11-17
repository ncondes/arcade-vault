-- Spec 08: siembra el tercer juego real, `ladrillazo`, en el catálogo.
-- Al final del catálogo: no toca ninguna otra fila.
insert into public.games (id, title, short, long, category, cover, color, position)
select 'ladrillazo', 'LADRILLAZO',
       'Rompe el muro ladrillo a ladrillo sin dejar caer la bola.',
       'Una pala, una bola y cinco muros que derribar. Mueve la pala con el ratón o con las flechas y devuelve la bola antes de que caiga: cada ladrillo vale 10 puntos y cada muro que tiras hace la bola un 10 % más rápida. Tienes tres bolas para llegar al final del quinto. Gráficos de Petraheim.',
       'ARCADE', 'cover-ladrillazo', 'magenta',
       coalesce(max(position), 0) + 1
from public.games;
