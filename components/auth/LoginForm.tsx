"use client";

import { useState } from "react";
import { signInAction, signUpAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const result =
        mode === "signin"
          ? await signInAction({ email, password })
          : await signUpAction({ email, password });

      // Kung successful ang sign in (o sign up na may session agad),
      // may redirect() na nangyari na sa loob ng action bago pa nito
      // ma-reach ang linyang ito — ang result ay para lang sa mga
      // kaso ng validation error o "check your email" message.
      if (result?.error) {
        setError(result.error);
      } else if (result?.message) {
        setMessage(result.message);
      }
    } catch {
      setError("May error na hindi inaasahan. Subukan ulit.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex w-full rounded-md border border-border p-0.5">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "signin"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "signup"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Sign up
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-error bg-error/10 px-4 py-2 text-sm text-foreground">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-md border border-success bg-success/10 px-4 py-2 text-sm text-foreground">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ikaw@example.com"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          type="submit"
          disabled={pending || !email || !password}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending
            ? "Sinusubukan…"
            : mode === "signin"
              ? "Mag sign in"
              : "Gumawa ng account"}
        </button>
      </form>

      {mode === "signup" && (
        <p className="text-xs text-muted-foreground">
          Owner-only ang app na ito — ang unang mag sign up ang magiging
          may-ari ng lahat ng datos.
        </p>
      )}
    </div>
  );
}
