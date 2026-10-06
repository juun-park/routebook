import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user has completed onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: provider } = await supabase
          .from("providers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!provider) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Fallback to login with error
  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
}

