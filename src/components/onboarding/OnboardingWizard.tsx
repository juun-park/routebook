"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Navigation,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { checkSlugAvailability, completeOnboarding, type OnboardingPayload } from "@/app/actions/onboarding";
import type { WorkingHoursConfig } from "@/types/database.types";

interface OnboardingWizardProps {
  userEmail: string;
}

const defaultWorkingHours: WorkingHoursConfig = {
  monday: { active: true, start: "08:00", end: "17:00", breaks: [] },
  tuesday: { active: true, start: "08:00", end: "17:00", breaks: [] },
  wednesday: { active: true, start: "08:00", end: "17:00", breaks: [] },
  thursday: { active: true, start: "08:00", end: "17:00", breaks: [] },
  friday: { active: true, start: "08:00", end: "17:00", breaks: [] },
  saturday: { active: false, start: "09:00", end: "14:00", breaks: [] },
  sunday: { active: false, start: "09:00", end: "14:00", breaks: [] },
};

export default function OnboardingWizard({ userEmail }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Identity
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [slugMessage, setSlugMessage] = useState("");

  // Step 2: Location & Boundaries
  const [baseAddress, setBaseAddress] = useState("");
  const [baseLat, setBaseLat] = useState<number>(37.7749);
  const [baseLng, setBaseLng] = useState<number>(-122.4194);
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState<number>(20);
  const [fixedBufferMinutes, setFixedBufferMinutes] = useState<number>(15);

  // Step 3: Working Hours
  const [workingHours, setWorkingHours] = useState<WorkingHoursConfig>(defaultWorkingHours);

  // Step 4: First Service Package
  const [serviceTitle, setServiceTitle] = useState("Full Mobile Detail");
  const [serviceDesc, setServiceDesc] = useState("Complete interior steam cleaning, exterior foam wash, and wheel detailing.");
  const [serviceDurationMins, setServiceDurationMins] = useState(120);
  const [servicePriceDollars, setServicePriceDollars] = useState(180);
  const [serviceDepositDollars, setServiceDepositDollars] = useState(50);

  // Auto-generate slug suggestion when business name changes
  const handleBusinessNameChange = (name: string) => {
    setBusinessName(name);
    if (!slug || slugStatus === "idle") {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  };

  // Debounce slug availability check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const res = await checkSlugAvailability(slug);
        if (res.available) {
          setSlugStatus("available");
          setSlugMessage("This link is available!");
        } else {
          setSlugStatus("unavailable");
          setSlugMessage(res.message || "Unavailable");
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  // Geocode address when entered (supports Nominatim / fallback coordinates)
  const handleGeocodeAddress = async (address: string) => {
    setBaseAddress(address);
    if (!address || address.length < 5) return;

    try {
      // Use free OpenStreetMap Nominatim for initial geocoding fallback
      const encoded = encodeURIComponent(address);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`, {
        headers: { "Accept-Language": "en" },
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setBaseLat(parseFloat(data[0].lat));
        setBaseLng(parseFloat(data[0].lon));
      }
    } catch {
      // Keep existing default coords if offline
    }
  };

  // Submit onboarding
  const handleFinalSubmit = () => {
    setError(null);
    const payload: OnboardingPayload = {
      slug,
      businessName,
      ownerName,
      phone,
      baseAddress: baseAddress || "100 Main St, San Francisco, CA",
      baseLat,
      baseLng,
      serviceRadiusMiles,
      fixedBufferMinutes,
      workingHours,
      initialService: {
        title: serviceTitle,
        description: serviceDesc,
        durationMinutes: serviceDurationMins,
        priceCents: Math.round(servicePriceDollars * 100),
        depositAmountCents: Math.round(serviceDepositDollars * 100),
      },
    };

    startTransition(async () => {
      const result = await completeOnboarding(payload);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Navigation className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-slate-900">
              Route<span className="text-emerald-600">Book</span> Setup
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            Step {step} of 4
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Step 1: Business Identity */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Business Identity</h2>
            <p className="mt-1 text-sm text-slate-600">
              Set up your public brand and claim your unique booking link.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder="Apex Mobile Auto Detail"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Your Name (Owner)
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Mike Miller"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Business Mobile Phone (for SMS dispatches)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(415) 555-0192"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Your Public Booking Link
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500">
                <span className="text-sm text-slate-400 select-none">routebook.me/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="apex-detail"
                  className="w-full bg-transparent border-none text-slate-900 focus:outline-none text-sm font-medium px-1"
                />
                {slugStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                {slugStatus === "available" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {slugStatus === "unavailable" && <AlertCircle className="w-4 h-4 text-rose-600" />}
              </div>
              {slugMessage && (
                <p
                  className={`mt-1.5 text-xs font-medium ${
                    slugStatus === "available" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {slugMessage}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={!businessName || !ownerName || !phone || slugStatus !== "available"}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              Continue to Location
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Location & Boundaries */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Base Location & Radius</h2>
            <p className="mt-1 text-sm text-slate-600">
              Where does your van start each day, and how far are you willing to drive?
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Home Base / Garage Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={baseAddress}
                  onChange={(e) => handleGeocodeAddress(e.target.value)}
                  placeholder="742 Evergreen Terrace, Springfield, OR"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Resolved: {baseLat.toFixed(4)}, {baseLng.toFixed(4)}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Maximum Service Radius
                </label>
                <span className="text-sm font-bold text-emerald-600">
                  {serviceRadiusMiles} miles
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={serviceRadiusMiles}
                onChange={(e) => setServiceRadiusMiles(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5 miles</span>
                <span>25 miles</span>
                <span>50 miles</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Fixed Clean-up & Equipment Buffer
                </label>
                <span className="text-sm font-bold text-slate-900">
                  {fixedBufferMinutes} mins
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="5"
                value={fixedBufferMinutes}
                onChange={(e) => setFixedBufferMinutes(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <p className="mt-1 text-xs text-slate-500">
                Added automatically to every job for packing up hoses, cords, and refilling tanks.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              disabled={!baseAddress}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              Configure Hours
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Working Hours */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Operating Schedule</h2>
            <p className="mt-1 text-sm text-slate-600">
              Set your weekly availability. RouteBook will only generate appointments within these windows.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map(
              (day) => {
                const config = workingHours[day];
                return (
                  <div key={day} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`check-${day}`}
                        checked={config.active}
                        onChange={(e) =>
                          setWorkingHours({
                            ...workingHours,
                            [day]: { ...config, active: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                      />
                      <label
                        htmlFor={`check-${day}`}
                        className="text-sm font-semibold capitalize text-slate-800"
                      >
                        {day}
                      </label>
                    </div>

                    {config.active ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={config.start}
                          onChange={(e) =>
                            setWorkingHours({
                              ...workingHours,
                              [day]: { ...config, start: e.target.value },
                            })
                          }
                          className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <input
                          type="time"
                          value={config.end}
                          onChange={(e) =>
                            setWorkingHours({
                              ...workingHours,
                              [day]: { ...config, end: e.target.value },
                            })
                          }
                          className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Closed</span>
                    )}
                  </div>
                );
              }
            )}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition"
            >
              Add First Service
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: First Service Package & Review */}
      {step === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your First Service Package</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a core package so customers can book you right away. You can add more later in your dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service Title
              </label>
              <input
                type="text"
                required
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="Full Mobile Auto Detail"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="Details of what's included..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={serviceDurationMins}
                  onChange={(e) => setServiceDurationMins(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Total Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={servicePriceDollars}
                  onChange={(e) => setServicePriceDollars(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Deposit ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={serviceDepositDollars}
                  onChange={(e) => setServiceDepositDollars(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                />
              </div>
            </div>

            {/* Launch Summary Card */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 mt-6 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Ready to launch!
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your booking page will go live at:{" "}
                <span className="font-bold underline">routebook.me/{slug}</span>. Customers will only be
                offered slots that are within your {serviceRadiusMiles}-mile radius and include your{" "}
                {fixedBufferMinutes}-minute clean-up buffer.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              disabled={isPending || !serviceTitle}
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building Your Booking Engine...
                </>
              ) : (
                <>
                  Launch RouteBook Engine
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

