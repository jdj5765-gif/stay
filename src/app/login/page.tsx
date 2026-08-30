import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";
import { getUser } from "@/lib/supabase/server";

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;
  const target = typeof next === "string" && next.startsWith("/") ? next : "/";

  if (await getUser()) redirect(target);

  return (
    <div className="py-10">
      <h1 className="mb-8 text-center text-2xl font-bold">stay 시작하기</h1>
      <AuthForm next={target} />
    </div>
  );
}
