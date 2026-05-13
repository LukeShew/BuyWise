"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

type Mode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Accounts are temporarily unavailable. Please try again later.");
      return;
    }

    if (!email.includes("@") || password.length < 6) {
      setError("Use a valid email and a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    const response =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    setMessage(mode === "signup" ? "Account created. Check your email if confirmation is required." : "Logged in.");
    router.refresh();

    if (response.data.session) {
      router.push("/saved");
    }
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex rounded-lg bg-stone-100 p-1">
        {(["login", "signup"] as Mode[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={`focus-ring flex-1 rounded-lg px-4 py-2 text-sm font-semibold capitalize ${
              mode === option ? "bg-white text-ink shadow-sm" : "text-stone-600"
            }`}
          >
            {option === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      {!isSupabaseConfigured() ? (
        <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Accounts are temporarily unavailable. You can still analyze photos and save items on this device.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Email</span>
          <span className="relative mt-2 flex items-center">
            <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-stone-400" aria-hidden />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="focus-ring h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3"
              placeholder="you@example.com"
            />
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Password</span>
          <span className="relative mt-2 flex items-center">
            <LockKeyhole className="pointer-events-none absolute left-3 h-4 w-4 text-stone-400" aria-hidden />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="focus-ring h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3"
              placeholder="Minimum 6 characters"
            />
          </span>
        </label>

        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring h-11 w-full rounded-lg bg-ink px-4 font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Working..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </section>
  );
}
