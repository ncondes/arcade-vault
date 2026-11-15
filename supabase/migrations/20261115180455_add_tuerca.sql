-- Spec 07: siembra el segundo juego real, `tuerca`, en el catálogo.
-- Al final del catálogo: no toca ninguna otra fila.
insert into public.games (id, title, short, long, category, cover, color, position)
select 'tuerca', 'TUERCA',
       'Encaja las piezas, limpia líneas y no te fíes de la tuerca.',
       'Siete piezas de siempre y una octava que no perdona: la tuerca, un anillo con el centro vacío que deja un hueco allí donde cae. Muévelas, gíralas y suéltalas de golpe para completar líneas antes de que la pila toque el techo. Cada diez líneas subes de nivel y todo cae más rápido.',
       'PUZZLE', 'cover-tuerca', 'cyan',
       coalesce(max(position), 0) + 1
from public.games;
