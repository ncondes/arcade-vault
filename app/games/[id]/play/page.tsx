import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GamePlayerScreen from "@/app/components/GamePlayerScreen";
import { getGame } from "@/app/lib/games";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = getGame(id);
  return { title: game ? `Jugando a ${game.title}` : "Juego no encontrado" };
}

export default async function GamePlayPage({ params }: Props) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayerScreen game={game} />;
}
