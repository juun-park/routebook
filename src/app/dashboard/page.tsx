import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Navigation,
  MapPin,
  Clock,
  ExternalLink,
  LogOut,
  Calendar,
  Sparkles,
  Layers,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { formatCurrency, formatDuration } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch provider profile
  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!provider) {
    redirect("/onboarding");
  }

  // Fetch provider services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", user.id)
    .order("sort_order", { ascending: true });

  // Fetch upcoming appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("provider_id", user.id)
    .order("start_time", { ascending: true })
    .limit(10);

  const publicBookingUrl = `/book/${provider.slug}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 block leading-tight">
                {provider.business_name}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                routebook.me/{provider.slug}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={publicBookingUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition border border-emerald-200"
            >
              <span>View Booking Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Banner with Share Link */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              Location-Aware Engine Active
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Ready for client bookings
            </h1>
            <p className="text-sm text-emerald-100 mt-1 max-w-md">
              Share your link in your Instagram bio or Google Maps profile. Customers will only be shown feasible driving slots.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-white truncate max-w-[200px] sm:max-w-xs">
              routebook.me/{provider.slug}
            </span>
            <Link
              href={publicBookingUrl}
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-white text-emerald-800 font-semibold text-xs shrink-0 hover:bg-emerald-50 transition"
            >
              Copy Link
            </Link>
          </div>
        </div>

        {/* Operating Rules Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Home Base & Radius
            </div>
            <div className="text-xl font-bold text-slate-900">
              {provider.service_radius_miles} miles
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate" title={provider.base_address}>
              From {provider.base_address}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Equipment Turnaround
            </div>
            <div className="text-xl font-bold text-slate-900">
              {provider.fixed_buffer_minutes} mins
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fixed clean-up buffer between jobs
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase mb-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Active Packages
            </div>
            <div className="text-xl font-bold text-slate-900">
              {services?.length || 0} services
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live in customer booking picker
            </p>
          </div>
        </div>

        {/* Two Column Section: Services & Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services Column */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Service Catalog</h2>
              <span className="text-xs text-slate-500">
                {services?.length || 0} configured
              </span>
            </div>

            <div className="space-y-3">
              {services && services.length > 0 ? (
                services.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {svc.title}
                      </h3>
                      {svc.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {svc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-medium">
                          ⏱ {formatDuration(svc.duration_minutes)}
                        </span>
                        <span className="text-xs text-emerald-700 font-medium">
                          Deposit: {formatCurrency(svc.deposit_amount_cents)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-slate-900 block">
                        {formatCurrency(svc.price_cents)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No services added yet.
                </p>
              )}
            </div>
          </div>

          {/* Appointments / Agenda Column */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Upcoming Route Agenda</h2>
              <span className="text-xs text-slate-500">Live Schedule</span>
            </div>

            {appointments && appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {apt.customer_name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {apt.service_address}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        {new Date(apt.start_time).toLocaleString()}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    No scheduled appointments yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Once customers book via your public link, their route-verified jobs will appear here in chronological order.
                  </p>
                </div>
                <Link
                  href={publicBookingUrl}
                  target="_blank"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Test your booking link &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

