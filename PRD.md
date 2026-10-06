# RouteBook: Product Requirements Document (PRD)

> **Document Version:** 1.0.0-PROD  
> **Author:** Principal Product Manager (Micro SaaS & Growth)  
> **Status:** APPROVED FOR IMPLEMENTATION  
> **Target Release:** MVP v1.0 (2-Week Sprint)  
> **Stakeholders:** Lead Full-Stack Engineer, Product Designer, Founder  

---

## 1. Executive Summary & Vision Statement

### 1.1 The Market Paradox
Modern appointment schedulers (Calendly, Square Appointments, Acuity, Fresha) are built around **static physical locations** (salons, offices, Zoom rooms). 

For **solo mobile service operators** (mobile auto detailers, mobile pet groomers, mobile dent repair, mobile bicycle mechanics), location is fluid. A provider does not operate from a fixed chair; their office is a van, and their schedule is dictated by metropolitan geography and traffic.

Today, a mobile operator using Calendly experiences one of two fatal problems:
1. **The Teleportation Problem:** A customer in North Suburbs books 10:00 AM – 12:00 PM; another customer in South Suburbs books 12:15 PM – 2:00 PM. The 45-minute drive creates an impossible schedule, forcing awkward cancellations or severe tardiness.
2. **The Wasteful Fixed Buffer Workaround:** To avoid the teleportation problem, providers pad *every* job with a flat 60-minute travel buffer. This artificially limits capacity to 2–3 jobs per day, leaving 1.5–2 hours of dead idle time when jobs happen to be 10 minutes apart.

### 1.2 The RouteBook Solution
**RouteBook** is a high-performance, location-aware booking engine.
- Customers enter their **service address first**.
- The system evaluates real-world driving travel times against the provider's home base and existing sequential appointments.
- Customers are shown **only genuinely achievable time slots**.
- RouteBook unlocks **1 additional job per day** ($120–$250 extra daily revenue for the provider) while eliminating booking friction and drive-time stress.

---

## 2. Target User Personas & Jobs-to-be-Done (JTBD)

### Persona A: "Mobile Mike" — The Solo Van Operator (Provider)
* **Profile:** 29-year-old owner-operator of a premier mobile auto detailing business. Drives a customized Mercedes Sprinter van carrying 100 gallons of water and a generator.
* **Tech Habits:** Runs 90% of his business on an iPhone 15 Pro. Attracts 80% of new leads via Instagram Reels, TikTok, and local Google Maps.
* **Pain Points:**
  - Manages booking inquiries via DM/text while washing cars with wet hands.
  - Spends 1.5 hours every evening cross-referencing Google Maps and Apple Calendar to piece together tomorrow's schedule.
  - Suffers from no-shows and last-minute cancellations without compensation.
* **Jobs-to-be-Done:**
  > *"When an interested client finds me on Instagram, I want them to book a verified route slot and pay a non-refundable deposit automatically, so I never have to manually map routes at night or lose money on no-shows."*

---

### Persona B: "Emma" — The Busy Customer (End Client)
* **Profile:** 34-year-old remote tech professional, owner of a Tesla Model Y and a Golden Doodle.
* **Tech Habits:** Taps the link in an Instagram bio; expects a seamless, app-like checkout flow with Apple Pay.
* **Pain Points:**
  - Frustrated by "Call for quote / DM to book" friction.
  - Annoyed when a detailer agrees to a time and then calls 45 minutes late claiming "traffic was bad across town."
* **Jobs-to-be-Done:**
  > *"When my car needs detailing, I want to type my address, pick an exact morning time slot, and lock it in with Apple Pay in under 45 seconds without downloading an app or exchanging 10 text messages."*

---

## 3. Product Principles & Unit Economics

### 3.1 Core Product Principles
1. **Address First, Calendar Second:** Availability is meaningless without spatial context. No calendar view is ever exposed before an address is validated.
2. **Zero False Promises:** If a 15-minute buffer is required and the drive takes 25 minutes, the slot does not exist. No human intervention needed.
3. **Sub-45-Second Mobile Conversion:** Frictionless booking optimized for Instagram and TikTok in-app browsers.
4. **Ruthless API Cost Efficiency:** Built to ensure third-party API costs (Google Maps, Twilio) stay below **$0.04 per completed booking**.

### 3.2 SaaS Pricing & Unit Economics
* **Provider Subscription:** $39/month flat (or $390/year) with a 14-day free trial.
* **Customer Transaction Fee:** 0% platform fee on client deposits (Stripe standard 2.9% + 30¢ applies directly to provider).
* **Target LTV / CAC:** Target LTV of $468 (12-month average retention) with organic acquisition via provider's client-facing booking link watermark ("Powered by RouteBook").

---

## 4. Functional Requirements & User Stories (with Gherkin AC)

### Feature Set 1: Provider Onboarding & Business Setup

#### US-1.1: 5-Minute Mobile Setup
**As a** mobile service operator,  
**I want to** configure my business profile, home base, service radius, and working hours from my phone,  
**So that** I can share my booking link on my social media bio immediately.

##### Acceptance Criteria (Gherkin):
```gherkin
Scenario: Successful Provider Onboarding
  Given an unauthenticated mobile operator visits "/onboarding"
  When they sign up via Magic Link or Google OAuth
  And they input their business name "Apex Mobile Detail" and claim slug "apex-detail"
  And they input their home base address "742 Evergreen Terrace, Springfield"
  And they set their service radius to 25 miles and turnaround buffer to 15 minutes
  And they configure Monday-Friday 08:00 to 18:00
  Then their profile is saved in Supabase with PostGIS geography point
  And their custom booking URL "routebook.me/apex-detail" becomes active
```

---

#### US-1.2: Service Catalog Configuration
**As a** mobile operator,  
**I want to** define my service packages with fixed durations, prices, and required deposit amounts,  
**So that** clients know exactly how long I need and commit financially to their reservation.

##### Acceptance Criteria (Gherkin):
```gherkin
Scenario: Create a Service with Deposit
  Given an authenticated provider on "/dashboard/services"
  When they create a new service with:
    | Field                | Value                  |
    | Title                | Full Interior & Exterior Detail |
    | Duration             | 150 minutes            |
    | Total Price          | $220.00                |
    | Required Deposit     | $50.00                 |
  Then the service is created in the database
  And it is immediately selectable on the public booking page
```

---

### Feature Set 2: Location-Aware Customer Booking Engine

#### US-2.1: Address Autocomplete & Instant Geo-Fencing
**As a** prospective customer,  
**I want to** enter my street address and see immediately if the provider services my area,  
**So that** I don't waste time choosing services only to find out they won't drive to me.

##### Acceptance Criteria (Gherkin):
```gherkin
Scenario: Address Inside Service Radius
  Given a customer visits "/book/apex-detail"
  When they type "123 Main St" into the address field and select the Google Places prediction
  And the computed Haversine distance from provider base is 14.2 miles (<= 25 miles radius)
  Then the system displays a green badge: "We service your neighborhood!"
  And advances the customer to the Service Selection step

Scenario: Address Outside Service Radius
  Given a customer visits "/book/apex-detail"
  When they select an address 32.5 miles from the provider base (> 25 miles radius)
  Then the system displays an error banner: "Sorry, this address is 7.5 miles outside our 25-mile service area."
  And prevents further booking progression with zero Google Distance Matrix calls made
```

---

#### US-2.2: Dynamic Feasible Slot Generation
**As a** prospective customer,  
**I want to** see calendar dates and time slots that realistically accommodate driving travel,  
**So that** I am never booked for a time the provider cannot attend.

##### Acceptance Criteria (Gherkin):
```gherkin
Scenario: Dynamic Slot Calculation with Existing Neighboring Jobs
  Given provider "apex-detail" has an existing confirmed appointment on Friday:
    | Job Name | Start Time | End Time  | Location Coordinates |
    | Job A    | 09:00 AM   | 11:30 AM  | (37.7749, -122.4194) |
  And the provider has a 15-minute fixed clean-up buffer
  When customer "Emma" selects Friday for a 90-minute service at Location B (37.8044, -122.2711)
  And driving duration from Location A to Location B is calculated as 28 minutes
  Then any slot before 12:15 PM (11:30 + 15 min buffer + 28 min drive = 12:13 PM) is marked unavailable
  And the 12:30 PM slot is rendered as available
```

---

#### US-2.3: Route Efficiency Tagging ("🌱 Eco-Friendly Slot")
**As a** customer,  
**I want to** see which available time slots minimize driving distance for the provider,  
**So that** I can pick an environmentally friendly and optimal appointment.

##### Acceptance Criteria (Gherkin):
```gherkin
Scenario: Display Route Efficiency Tag
  Given a candidate slot requires less than 12 minutes driving from the preceding appointment
  When the slot buttons are rendered
  Then that slot displays an accent badge: "🌱 Efficient Route (< 15 min drive)"
```

---

### Feature Set 3: Reservation Locking & Stripe Deposit Checkout

#### US-3.1: 10-Minute Optimistic Slot Hold
**As a** customer filling out my details,  
**I want my** chosen time slot held temporarily for 10 minutes,  
**So that** someone else doesn't book it while I am inputting my credit card.

##### Acceptance Criteria (Gherkin):
```gherkin
Scenario: Hold Creation and Expiry
  Given a customer selects an available slot and enters their name and phone
  When they proceed to the Stripe Checkout step
  Then an appointment row is inserted with status="pending_deposit" and hold_expires_at = NOW() + 10 minutes
  And subsequent feasibility checks by other users treat this slot as occupied
  And if payment is not received within 10 minutes, the hold expires automatically
```

---

#### US-3.2: Stripe Deposit Capture & Instant Confirmation
**As a** customer,  
**I want to** pay the required deposit using Apple Pay, Google Pay, or Credit Card,  
**So that** my appointment is instantly confirmed without back-and-forth phone calls.

##### Acceptance Criteria (Gherkin):
```gherkin
Scenario: Deposit Payment Success
  Given a customer on the Stripe payment screen
  When they complete a $50.00 deposit payment
  Then Stripe fires "checkout.session.completed" to "/api/webhooks/stripe"
  And the appointment status transitions to "confirmed"
  And deposit_amount_paid_cents is recorded as 5000
  And the customer is redirected to the confirmation screen
```

---

### Feature Set 4: Automated Communications & Dispatch

#### US-4.1: Automated SMS Dispatch
**As a** customer and provider,  
**I want to** receive an immediate SMS text with appointment and address details,  
**So that** both parties have instant mobile records of the booking.

##### Acceptance Criteria (Gherkin):
```gherkin
Scenario: Post-Booking SMS Dispatch
  Given an appointment status transitions to "confirmed"
  When the webhook handler triggers the notification service
  Then an SMS is sent to the customer via Twilio:
    """
    Hi Emma! Your Mobile Detail with Apex Mobile Detail is confirmed for Friday, Oct 10 at 12:30 PM.
    Address: 123 Main St.
    Manage booking: https://routebook.me/b/apt_123xyz
    """
  And an SMS is sent to the provider:
    """
    New Booking! Emma booked Full Detail for Friday at 12:30 PM.
    Address: 123 Main St (14 mi from Base).
    Deposit Paid: $50.00.
    Open in Google Maps: https://maps.google.com/?q=37.8044,-122.2711
    """
```

---

## 5. Non-Functional Requirements & Performance SLAs

| Category | Target Metric | Engineering Architecture Strategy |
| :--- | :--- | :--- |
| **Slot Feasibility Latency** | **P95 < 1,200 ms** | Geohash-6 route cache table with index lookups; parallel Promise execution for candidate windows. |
| **Mobile First Contentful Paint (FCP)** | **P95 < 800 ms** | Next.js React Server Components; zero hydration of heavy JS libraries on initial address screen. |
| **API Cost Per Booking** | **< $0.04 USD** | Google Places Session Tokens ($0.017/session) + Geohash Cache (> 80% hit rate for Routes API). |
| **Mobile In-App Browser Compatibility** | **100% on iOS / Android IAB** | Viewport units set to `dvh`; zero reliance on native browser popups; inline Apple Pay via Stripe Elements. |
| **Data Security & Privacy** | **PCI-DSS & RLS Isolation** | Zero raw credit card storage (Stripe hosted fields); PostGIS customer coordinates isolated by Supabase RLS. |

---

## 6. MVP Scope Matrix (v1.0 vs v1.5 vs v2.0)

```
+-----------------------------------------------------------------------------------------+
|                                    SCOPE BOUNDARY                                       |
+-----------------------------------------------------------------------------------------+
| [IN SCOPE: MVP v1.0]                                                                    |
|  * Solo Provider (Single Van / 1 Calendar)                                             |
|  * Address-first dynamic slot calculation (Haversine + Geohash Cache + Routes API)      |
|  * 5-minute mobile onboarding wizard                                                    |
|  * Stripe Checkout deposit collection                                                   |
|  * Twilio SMS dispatch (Customer + Provider)                                            |
|  * Provider daily agenda dashboard with Google Maps navigation links                    |
|                                                                                         |
| [FAST-FOLLOW: v1.5]                                                                     |
|  * Full 2-way Google Calendar OAuth sync (importing personal calendar blocks)          |
|  * Add-on service upsells (e.g., "+ $40 Engine Bay Detail")                             |
|  * Customer reschedule / self-cancellation portal                                       |
|  * Dynamic travel fee surcharge for fringe distances (e.g., +$25 for > 20 miles)        |
|                                                                                         |
| [FUTURE ROADMAP: v2.0]                                                                  |
|  * Multi-van fleet dispatch (assigning closest van to incoming job)                     |
|  * Native iOS / Android Provider App (Push notifications & GPS live tracking)           |
|  * Automated recurring bookings (e.g., bi-weekly maintenance wash)                      |
+-----------------------------------------------------------------------------------------+
```

---

## 7. Success Metrics & North Star KPIs

1. **North Star Metric:** Number of Confirmed Location-Verified Bookings per active provider/month.
2. **Booking Completion Rate:** $> 65\%$ of users who start entering an eligible address complete deposit checkout.
3. **Route Compression Rate:** Provider average daily driving time reduced by $\ge 22\%$ compared to static booking tools.
4. **API Cost Efficiency:** Monthly Google Maps Platform invoice $\le \$0.035$ per booked appointment.

