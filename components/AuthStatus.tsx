"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <Link
        href="/auth"
        className="focus-ring rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800"
      >
        Log in
      </Link>
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className="focus-ring rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700 sm:inline-flex">
        <UserRound className="h-4 w-4" aria-hidden />
        {user.email}
      </span>
      <button
        type="button"
        onClick={() => supabase?.auth.signOut()}
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-danger hover:text-danger"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Log out
      </button>
    </div>
  );
}
