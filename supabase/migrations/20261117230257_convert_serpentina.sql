-- Spec 09: convierte la maqueta `serpentina` en el cuarto juego real.
-- Convierte la maqueta: solo cambian los textos. Título, categoría, portada, color y posición se quedan.
update public.games
set short = 'Come fruta, crece y no te muerdas la cola.',
    long  = 'Una serpiente recorre la grilla buscando fruta. Cada bocado la alarga y, cada cinco, sube el nivel y la velocidad. A veces aparece una fruta dorada que solo dura unos segundos. Choca con un muro o contigo misma y se acabó.'
where id = 'serpentina';
