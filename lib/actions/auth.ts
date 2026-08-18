"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Phase 1 — Supabase Auth (email/password). Personal tool ito, kaya
// "owner-only" talaga ang buong app: sinuman ang unang mag sign-up ang
// magiging may-ari ng lahat ng datos (ang mga owner_only_* RLS policies
// sa migrations ang nagpapatupad nito sa database level).

export interface AuthFormState {
  error: string | null;
  message: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export async function signInAction({
  email,
  password,
}: AuthCredentials): Promise<AuthFormState> {
  const trimmedEmail = email.trim();

  if (!trimmedEmail || !password) {
    return { error: "Kailangan ng email at password.", message: null };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    return { error: error.message, message: null };
  }

  redirect("/dashboard");
}

export async function signUpAction({
  email,
  password,
}: AuthCredentials): Promise<AuthFormState> {
  const trimmedEmail = email.trim();

  if (!trimmedEmail || !password) {
    return { error: "Kailangan ng email at password.", message: null };
  }
  if (password.length < 6) {
    return {
      error: "Dapat hindi bababa sa 6 characters ang password.",
      message: null,
    };
  }

  const supabase = createClient();
  const { error, data } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
  });

  if (error) {
    return { error: error.message, message: null };
  }

  // Kung naka-enable ang "Confirm email" sa Supabase Auth settings, wala
  // pang active session dito kahit successful ang sign-up — kailangan
  // munang i-verify ang email bago makapag sign-in.
  if (!data.session) {
    return {
      error: null,
      message:
        "Na-send na ang confirmation email. I-verify muna ang email mo bago mag sign in.",
    };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
