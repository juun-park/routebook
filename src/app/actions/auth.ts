"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if provider profile exists
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
      redirect("/onboarding");
    }
  }

  redirect("/dashboard");
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(formData: FormData): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return {
    success: true,
  };
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

