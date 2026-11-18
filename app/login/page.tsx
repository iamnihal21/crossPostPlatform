import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/accounts");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-lg shadow-violet-200">P</span><h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">Welcome to Postlane</h1><p className="mt-2 text-sm text-slate-500">Sign in before connecting your YouTube channel.</p></div>
        <AuthForm />
      </div>
    </main>
  );
}
