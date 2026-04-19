// Server-side Supabase client for use in React Server Components and route handlers.
// Reads the user's session from cookies (set by Supabase Auth on login).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — ignore. Middleware handles refresh.
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // ignore as above
          }
        },
      },
    }
  );
}
