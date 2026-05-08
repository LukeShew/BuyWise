import { AuthForm } from "@/components/AuthForm";

export default function AuthPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-mint">Account</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Log in or sign up</h1>
        <p className="mt-3 leading-7 text-stone-600">
          Supabase auth ties saved items and listing checks to a user account once environment variables are configured.
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
