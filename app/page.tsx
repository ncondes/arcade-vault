import type { Metadata } from "next";
import GameLibrary from "@/app/components/GameLibrary";

export const metadata: Metadata = {
  title: "Biblioteca",
};

export default function Home() {
  return <GameLibrary />;
}
