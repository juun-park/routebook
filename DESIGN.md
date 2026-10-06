# RouteBook: UI/UX & Design System Specification

> **Document Version:** 1.0.0-PROD  
> **Author:** Lead Product Designer (Design Systems & Mobile UX)  
> **Status:** APPROVED FOR BUILD  
> **Target Experience:** Mobile-First Web View (Instagram Bio / TikTok / Mobile Safari & Chrome)  
> **Design Framework:** Tailwind CSS 3.4+ / shadcn/ui Design Tokens  

---

## 1. Design Philosophy & Mobile-First Principles

### 1.1 The "Instagram Bio 45-Second Rule"
80%+ of incoming traffic to RouteBook booking pages arrives via an **In-App Browser (IAB)** on iOS (Instagram, TikTok, Google Maps app). These environments impose strict constraints:
- Navigation bars eat vertical screen real estate.
- Users have zero patience; every unnecessary form field increases drop-off by 15%.
- **The Golden Rule:** The entire booking journey (Address $\rightarrow$ Service $\rightarrow$ Slot $\rightarrow$ Deposit) must be executable in **under 45 seconds using only the user's thumb**.

### 1.2 Core UX Axioms
1. **Progressive Spatial Disclosure:** Only prompt for what is needed at that moment.
   - Screen 1: Address check (validates geographic feasibility).
   - Screen 2: Service choice (sets duration parameter).
   - Screen 3: Date & time (computes feasible route slot).
   - Screen 4: 1-Tap Checkout (Apple Pay / Google Pay).
2. **Instant Visual Feedback:** Never leave the user wondering if their address worked. Instant green or red status badges with clear, reassuring micro-copy.
3. **Route Efficiency Incentives:** Visual badges (e.g. `🌱 Eco-Route`) subtly steer customers toward slots that minimize provider drive time.

---

## 2. Design Tokens & Styling System

RouteBook uses a high-trust, modern utility aesthetic tailored for high-ticket mobile services.

### 2.1 Color Palette

```typescript
// tailwind.config.ts color tokens
export const colors = {
  // Brand & Action (Emerald - signals travel, green light, eco-efficiency)
  primary: {
    DEFAULT: "#059669", // emerald-600 (Primary CTAs, active states)
    hover: "#047857",   // emerald-700
    light: "#D1FAE5",   // emerald-100 (Badge backgrounds)
    foreground: "#FFFFFF"
  },
  
  // Backgrounds & Neutrals (High-contrast Slate)
  background: "#F8FAFC", // slate-50 (App background)
  surface: "#FFFFFF",    // pure white (Cards, modals, bottom sheets)
  foreground: "#0F172A", // slate-900 (Headings, primary body)
  muted: {
    DEFAULT: "#64748B", // slate-500 (Captions, subtext)
    border: "#E2E8F0",  // slate-200 (Subtle dividers, inputs)
    card: "#F1F5F9"     // slate-100 (Inactive pills, secondary chips)
  },

  // Semantic Feedback
  success: {
    DEFAULT: "#10B981", // emerald-500
    subtle: "#ECFDF5",
    text: "#065F46"
  },
  warning: {
    DEFAULT: "#F59E0B", // amber-500
    subtle: "#FFFBEB",
    text: "#92400E"
  },
  destructive: {
    DEFAULT: "#EF4444", // rose-500
    subtle: "#FEF2F2",
    text: "#991B1B"
  }
};
```

### 2.2 Typography Scale
- **Font Stack:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Numerical & Monospace Figures:** `font-mono` / `tabular-nums` for all time displays (`11:30 AM`), prices (`$220.00`), and durations (`1h 45m`) to prevent visual jitter during transitions.

| Token | Class | Size / Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `text-2xl` | 24px / 32px | 700 (Bold) | Step headers, Provider name |
| **Section Title**| `text-lg` | 18px / 28px | 600 (Semibold) | Card titles, service names |
| **Body Large** | `text-base`| 16px / 24px | 500 (Medium) | Inputs, primary buttons, slot times |
| **Body Small** | `text-sm`  | 14px / 20px | 400 (Regular) | Helper text, descriptions |
| **Badge / Meta**| `text-xs`  | 12px / 16px | 600 (Semibold) | Badges, tags, price captions |

### 2.3 Layout & Touch Target Constraints
- **Minimum Tap Target:** $48\text{px} \times 48\text{px}$ across all touchable controls (buttons, chips, calendar dates).
- **Corner Radii:**
  - Card & Container: `rounded-2xl` (16px) for an organic, mobile-native feel.
  - Form Fields & Buttons: `rounded-xl` (12px).
  - Chips & Badges: `rounded-full` (9999px).
- **Elevation Shadows:**
  - Subtle cards: `shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`).
  - Floating bottom bar: `shadow-[0_-4px_16px_rgba(0,0,0,0.06)]`.

---

## 3. Component Inventory & Specifications

### 3.1 `AddressAutocompleteInput`
* **Anatomy:**
  - Left icon: Location Pin (`Lucide: MapPin`)
  - Text input: `font-medium`, 16px font (prevents iOS Safari auto-zoom on focus)
  - Clear icon: `Lucide: XCircle` (appears when input is non-empty)
  - Floating dropdown: Z-index 50, clipped to screen margins, highlighting matched search terms in bold.

### 3.2 `EligibilityBanner`
* **Variant A: Eligible (Green)**
  - Background: `bg-emerald-50`, Border: `border-emerald-200`
  - Icon: Checkmark Circle (`Lucide: CheckCircle2` in `text-emerald-600`)
  - Copy: *"Great news! We service your neighborhood."*
* **Variant B: Out-of-Area (Rose)**
  - Background: `bg-rose-50`, Border: `border-rose-200`
  - Icon: Alert Circle (`Lucide: AlertCircle` in `text-rose-600`)
  - Copy: *"We currently only service within 20 miles of [Base City]. Your address is [X] miles away."*

### 3.3 `ServiceCard`
* **States:** Default (unselected), Selected (`ring-2 ring-emerald-600 bg-emerald-50/20`), Disabled.
* **Layout:**
  - Top row: Service Name (Bold) + Price (Right aligned)
  - Sub-row: Duration pill (`⏱ 2.5 hrs`) + Deposit requirement caption (`$50 deposit`)
  - Description: Max 2 lines with subtle fade.

### 3.4 `DatePillScroller`
* **Anatomy:** Horizontal swipeable track (`overflow-x-auto scrollbar-none snap-x`).
* **Pill Anatomy:**
  - Top: Day of week (e.g. `THU`) in `text-xs uppercase text-slate-400`
  - Bottom: Date number (e.g. `12`) in `text-base font-bold`
  - Selected state: `bg-slate-900 text-white shadow-md`
  - Indicator: Tiny green dot beneath date if high availability.

### 3.5 `DynamicTimeSlotGrid`
* **Grid:** 3 columns on mobile (`grid-cols-3 gap-2.5`).
* **Slot Pill Anatomy:**
  - Label: `10:00 AM` (`tabular-nums text-sm font-semibold`)
  - Sub-badge (if applicable): `🌱 Eco-Route` (rendered as tiny badge above or below time)
  - Selected state: `bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2`
  - Unavailable: Not rendered or rendered as disabled gray pill.

---

## 4. Screen-by-Screen Mobile Wireframes & Flows

### Screen 1: Address Input & Verification (`/book/[slug]`)

```
+------------------------------------------+
|  [Van Avatar]  Apex Mobile Auto Detail   |
|  ⭐ 4.9 (128 reviews) • Mobile Van Unit  |
+------------------------------------------+
|                                          |
|  Where should we come to you?            |
|  We bring 100 gallons of water & power.  |
|                                          |
|  +------------------------------------+  |
|  | [Pin] 1420 Market St, San Franc... |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | [✓] Great news! We service your    |  |
|  |     neighborhood (11 mi from base) |  |
|  +------------------------------------+  |
|                                          |
|  ======================================  |
|  |   [ Continue to Select Service -> ]|  |  (Sticky Bottom Button)
|  ======================================  |
+------------------------------------------+
```

---

### Screen 2: Service Selection (`/book/[slug]?step=service`)

```
+------------------------------------------+
|  <- Back              Step 2 of 4        |
|  Select Service Package                  |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | Full Interior & Exterior Detail    |  |
|  | ⏱ 2.5 hours               $220.00  |  |
|  | • Deep steam clean & leather care  |  |
|  | • Foam bath & spray ceramic seal   |  |
|  | [ $50 deposit to reserve ] [✓ SEL] |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | Maintenance Exterior Wash          |  |
|  | ⏱ 1.0 hour                $95.00   |  |
|  | • Hand wash & wheel decontamination|  |
|  | [ $30 deposit to reserve ]         |  |
|  +------------------------------------+  |
|                                          |
|  ======================================  |
|  |   [ Choose Date & Time -> ]        |  |  (Sticky Bottom Button)
|  ======================================  |
+------------------------------------------+
```

---

### Screen 3: Date & Dynamic Feasible Slot Picker (`/book/[slug]?step=time`)

```
+------------------------------------------+
|  <- Back              Step 3 of 4        |
|  Choose Date & Time                      |
+------------------------------------------+
|  Service: Full Interior & Exterior (2.5h)|
|  Address: 1420 Market St, SF             |
|                                          |
|  [ OCT 2026 ]                            |
|  +-----+ +-----+ +-----+ +-----+ +-----+ |
|  | THU | | FRI | | SAT | | SUN | | MON | |
|  | 08  | | 09* | | 10  | | 11  | | 12  | |  (*Selected)
|  +-----+ +-----+ +-----+ +-----+ +-----+ |
|                                          |
|  Available Time Slots                    |
|  Routes verified for live traffic:       |
|                                          |
|  +------------+ +------------+           |
|  |  09:00 AM  | |  12:30 PM  |           |
|  |            | | 🌱 Eco-Route|          |
|  +------------+ +------------+           |
|  +------------+                          |
|  |  03:45 PM  |                          |
|  |            |                          |
|  +------------+                          |
|                                          |
|  ======================================  |
|  |   [ Reserve 12:30 PM Slot -> ]     |  |  (Sticky Bottom Button)
|  ======================================  |
+------------------------------------------+
```

---

### Screen 4: Customer Details & 1-Tap Deposit (`/book/[slug]?step=checkout`)

```
+------------------------------------------+
|  <- Back              Step 4 of 4        |
|  Confirm & Reserve                       |
+------------------------------------------+
|                                          |
|  Booking Summary                         |
|  Friday, Oct 9 • 12:30 PM - 3:00 PM      |
|  1420 Market St, San Francisco           |
|  Total: $220.00  |  Deposit Due Now: $50 |
|                                          |
|  Your Information                        |
|  +------------------------------------+  |
|  | Full Name: Emma Watson             |  |
|  +------------------------------------+  |
|  | Mobile Phone: (415) 555-0192       |  |
|  +------------------------------------+  |
|  | Vehicle: 2023 Tesla Model Y (White)|  |
|  +------------------------------------+  |
|                                          |
|  🔒 10-Minute Hold Active (09:42 left)   |
|                                          |
|  +------------------------------------+  |
|  |         Pay  Pay with Apple Pay   |  |  (Stripe 1-Tap Elements)
|  +------------------------------------+  |
|  |   -- or Pay with Credit Card --    |  |
|  +------------------------------------+  |
+------------------------------------------+
```

---

### Screen 5: Post-Booking Confirmation (`/book/[slug]/confirmed/[id]`)

```
+------------------------------------------+
|                                          |
|               [ ✓ Green Ring ]           |
|            You're All Booked!            |
|                                          |
|   Apex Mobile Auto Detail will arrive:   |
|   Friday, Oct 9 at 12:30 PM              |
|                                          |
|  +------------------------------------+  |
|  | 📍 1420 Market St, San Francisco   |  |
|  | 🚗 2023 Tesla Model Y (White)      |  |
|  | 💳 $50.00 Deposit Paid via Pay    |  |
|  | 💵 $170.00 Remaining due at service|  |
|  +------------------------------------+  |
|                                          |
|  [ 📱 Add to Apple / Google Calendar ]   |
|                                          |
|  We sent an SMS receipt with this link   |
|  to (415) 555-0192.                      |
|                                          |
+------------------------------------------+
```

---

### Screen 6: Provider Mobile Daily Dispatch (`/dashboard`)

```
+------------------------------------------+
|  Apex Mobile Detail   [Van Active 🟢]    |
|  Today: Friday, Oct 9 • 3 Jobs Scheduled |
+------------------------------------------+
|  Daily Route Efficiency: 92% (48 min drive)
|                                          |
|  08:30 AM • Depart Base                  |
|  ↓ 18 min drive                          |
|                                          |
|  +------------------------------------+  |
|  | 09:00 AM - 11:30 AM                |  |
|  | David K. • Porsche 911             |  |
|  | 240 Pine St, SF                    |  |
|  | [ Open in Google Maps ] [ Call ]   |  |
|  +------------------------------------+  |
|  ↓ 12 min drive                          |
|                                          |
|  +------------------------------------+  |
|  | 12:30 PM - 03:00 PM                |  |
|  | Emma W. • Tesla Model Y            |  |
|  | 1420 Market St, SF                 |  |
|  | [ Open in Google Maps ] [ Call ]   |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

---

## 5. Mobile In-App Browser Quirks & Edge Case Mitigations

| Quirk / Mobile Issue | Root Cause | UI/UX Defensive Mitigation |
| :--- | :--- | :--- |
| **Virtual Keyboard shifts layout** | On iOS Safari, focusing an `<input>` scrolls the viewport unpredictably and can hide the autocomplete dropdown. | Use `position: fixed` with top-aligned modal sheet when address input is focused. Dropdown expands downward with `max-h-[40dvh]` overflow. |
| **Viewport height jump (`100vh`)** | In Instagram/TikTok IAB, bottom toolbar appearing/disappearing breaks `100vh`. | Exclusively use `100dvh` (Dynamic Viewport Height) for full-screen layout wrappers. |
| **Accidental navigation dismissal** | Swiping down in Instagram browser can accidentally close the webview during checkout. | Avoid scroll containers that trigger overscroll drag; add `overscroll-behavior-y: contain`. |
| **Apple Pay / Google Pay failures** | In-App WebViews may restrict direct Apple Pay sheet invocation if domain is unverified. | Implement Stripe Elements with automatic fallback to standard Credit Card inputs if Apple Pay capability check returns false. |
| **Stale Slot Picked during Hold** | Slot was selected right as another client completed checkout. | Optimistic UI feedback: if hold fails, display clear toast: *"Just missed it! That slot was just reserved. Here is the closest alternative: 1:00 PM"*. |

