import type { Metadata } from "next";
import AuthForm, { type Tab } from "@/app/components/AuthForm";

export const metadata: Metadata = {
  title: "Acceso",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tab } = await searchParams;
  // `tab` es entrada del usuario: cualquier valor que no sea "registro"
  // —incluido repetirlo, que lo convierte en array— abre en INICIAR SESIÓN.
  const initialTab: Tab = tab === "registro" ? "up" : "in";

  return <AuthForm initialTab={initialTab} />;
}
