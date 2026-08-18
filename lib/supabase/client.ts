import { createBrowserClient } from "@supabase/ssr";

// Gamitin ito sa Client Components lang.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
