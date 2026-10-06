"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { WorkingHoursConfig } from "@/types/database.types";

export interface OnboardingPayload {
  slug: string;
  businessName: string;
  ownerName: string;
  phone: string;
  baseAddress: string;
  baseLat: number;
  baseLng: number;
  serviceRadiusMiles: number;
  fixedBufferMinutes: number;
  workingHours: WorkingHoursConfig;
  initialService: {
    title: string;
    description: string;
    durationMinutes: number;
    priceCents: number;
    depositAmountCents: number;
  };
}

/**
 * Validates whether a custom booking slug is available
 */
export async function checkSlugAvailability(slug: string): Promise<{
  available: boolean;
  message?: string;
}> {
  const cleanSlug = slug.toLowerCase().trim();

  // Validate format
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(cleanSlug)) {
    return {
      available: false,
      message: "Slug must contain only lowercase letters, numbers, and hyphens.",
    };
  }

  if (cleanSlug.length < 3 || cleanSlug.length > 32) {
    return {
      available: false,
      message: "Slug must be between 3 and 32 characters.",
    };
  }

  // Reserved slugs
  const reserved = ["login", "onboarding", "dashboard", "api", "auth", "admin", "book"];
  if (reserved.includes(cleanSlug)) {
    return {
      available: false,
      message: "This link name is reserved by RouteBook.",
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select("slug")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (data) {
    return {
      available: false,
      message: "This booking link is already taken.",
    };
  }

  return { available: true };
}

/**
 * Completes provider onboarding: creates provider profile and initial service package
 */
export async function completeOnboarding(
  payload: OnboardingPayload
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to complete onboarding." };
  }

  // 1. Verify slug availability one more time
  const slugCheck = await checkSlugAvailability(payload.slug);
  if (!slugCheck.available) {
    return { error: slugCheck.message || "Invalid slug." };
  }

  // 2. Insert provider profile
  // Note: PostGIS location point is automatically synced by trigger, or we can supply geography WKT
  const { error: providerError } = await supabase.from("providers").insert({
    id: user.id,
    slug: payload.slug.toLowerCase().trim(),
    business_name: payload.businessName,
    owner_name: payload.ownerName,
    phone: payload.phone,
    email: user.email || "",
    base_address: payload.baseAddress,
    base_lat: payload.baseLat,
    base_lng: payload.baseLng,
    // Format WKT point for PostGIS geography
    base_location: `POINT(${payload.baseLng} ${payload.baseLat})`,
    service_radius_miles: payload.serviceRadiusMiles,
    fixed_buffer_minutes: payload.fixedBufferMinutes,
    working_hours: payload.workingHours,
    return_to_base_required: true,
  });

  if (providerError) {
    console.error("Provider insert error:", providerError);
    return { error: providerError.message };
  }

  // 3. Insert initial service package
  const { error: serviceError } = await supabase.from("services").insert({
    provider_id: user.id,
    title: payload.initialService.title,
    description: payload.initialService.description,
    duration_minutes: payload.initialService.durationMinutes,
    price_cents: payload.initialService.priceCents,
    deposit_amount_cents: payload.initialService.depositAmountCents,
    is_active: true,
    sort_order: 0,
  });

  if (serviceError) {
    console.error("Service insert error:", serviceError);
    return { error: serviceError.message };
  }

  redirect("/dashboard");
}

