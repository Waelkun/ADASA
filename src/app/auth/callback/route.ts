import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles OAuth callback (e.g. Google Sign-In) and exchanges PKCE code for session cookies
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("OAuth exchange error:", error);
    } catch (err) {
      console.error("OAuth callback error:", err);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
