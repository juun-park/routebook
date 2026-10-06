import Link from "next/link";
import { MapPin, Navigation, Calendar, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Navigation className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Route<span className="text-emerald-600">Book</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition shadow-sm shadow-emerald-200"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Location-Aware Booking for Solo Mobile Pros
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-2xl leading-[1.15]">
          Never map routes manually again.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed">
          Dynamic travel-time scheduling for mobile auto detailers, pet groomers, and mobile mechanics. 
          Customers enter their address first—we only show slots you can actually drive to.
        </p>

        {/* CTA Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 rounded-xl transition shadow-md shadow-emerald-200"
          >
            Set Up Your Booking Link
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/book/demo-detailer"
            className="inline-flex items-center justify-center gap-2 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-6 py-3.5 rounded-xl transition shadow-sm"
          >
            Try Customer Demo
          </Link>
        </div>

        {/* 3 Core Value Pillars */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Address-First Filtering</h3>
            <p className="mt-2 text-sm text-slate-600 leading-normal">
              Instant boundary validation. Never get booked by a customer 40 miles away across the bridge.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Dynamic Drive Buffers</h3>
            <p className="mt-2 text-sm text-slate-600 leading-normal">
              Live route travel calculations between sequential jobs. Zero teleports, zero double-bookings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Deposit Protection</h3>
            <p className="mt-2 text-sm text-slate-600 leading-normal">
              Stripe 1-tap Apple Pay deposits lock appointments in under 45 seconds and eliminate no-shows.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} RouteBook. Designed for solo mobile service operators.</p>
      </footer>
    </div>
  );
}
