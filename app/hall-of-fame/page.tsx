import type { Metadata } from "next";
import HallOfFameBoard from "@/app/components/HallOfFameBoard";

export const metadata: Metadata = {
  title: "Salón de la Fama",
};

export default function HallOfFamePage() {
  return <HallOfFameBoard />;
}
