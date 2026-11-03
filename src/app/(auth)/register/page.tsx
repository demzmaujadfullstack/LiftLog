import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Daftar" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/overview");
  return <RegisterForm />;
}
