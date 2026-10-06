import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if provider profile already exists
  const { data: existingProvider } = await supabase
    .from("providers")
    .select("slug")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProvider) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OnboardingWizard userEmail={user.email || ""} />
    </div>
  );
}

