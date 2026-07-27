import type { Metadata } from "next";
import AuthForm from "@/app/components/AuthForm";

export const metadata: Metadata = {
  title: "Acceso",
};

export default function LoginPage() {
  return <AuthForm />;
}
