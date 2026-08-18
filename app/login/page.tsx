import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Naka-sign in na — walang dahilan para makita pa ang login form.
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border p-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">DevPedia</h1>
          <p className="text-sm text-muted-foreground">
            Owner-only access. Mag sign in gamit ang email at password.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
