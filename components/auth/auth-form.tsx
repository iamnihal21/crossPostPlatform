"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/accounts");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/accounts` },
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/accounts");
          router.refresh();
        } else {
          setMessage({ type: "success", text: "Check your email to confirm the account, then return here to sign in." });
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Authentication failed. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
      <div className="mb-6 flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Authentication mode">
        {(["login", "signup"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => { setMode(item); setMessage(null); }} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{item === "login" ? "Sign in" : "Create account"}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-semibold text-slate-700">Email<input name="email" type="email" autoComplete="email" required className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500" /></label>
        <label className="block text-xs font-semibold text-slate-700">Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500" /></label>
        {message && <p className={`rounded-lg px-3 py-2 text-xs ${message.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`} role="status">{message.text}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending && <LoaderCircle className="size-4 animate-spin" />}{mode === "login" ? "Sign in" : "Create account"}</Button>
      </form>
    </div>
  );
}
