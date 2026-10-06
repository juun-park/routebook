-- ============================================================================
-- ROUTEBOOK MIGRATION: 20261006000000_init_routebook_schema.sql
-- Description: Complete initial schema for RouteBook Micro SaaS
-- Includes: PostGIS extensions, enums, providers, services, appointments,
--           cached_routes, spatial indexes, automated triggers, and RLS policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 2. ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.appointment_status AS ENUM (
        'pending_deposit',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM (
        'unpaid',
        'deposit_paid',
        'fully_paid',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 3. TABLE: providers (Business Profile & Operational Settings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    
    -- Base Location (Home/Garage base for route bounds)
    base_address TEXT NOT NULL,
    base_location extensions.GEOGRAPHY(Point, 4326) NOT NULL,
    base_lat DOUBLE PRECISION NOT NULL,
    base_lng DOUBLE PRECISION NOT NULL,
    
    -- Route & Scheduling Rules
    service_radius_miles NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    fixed_buffer_minutes INTEGER NOT NULL DEFAULT 15,
    return_to_base_required BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Weekly Working Hours (JSONB)
    working_hours JSONB NOT NULL DEFAULT '{
        "monday":    {"active": true, "start": "08:00", "end": "17:00", "breaks": []},
        "tuesday":   {"active": true, "start": "08:00", "end": "17:00", "breaks": []},
        "wednesday": {"active": true, "start": "08:00", "end": "17:00", "breaks": []},
        "thursday":  {"active": true, "start": "08:00", "end": "17:00", "breaks": []},
        "friday":    {"active": true, "start": "08:00", "end": "17:00", "breaks": []},
        "saturday":  {"active": false, "start": "09:00", "end": "14:00", "breaks": []},
        "sunday":    {"active": false, "start": "09:00", "end": "14:00", "breaks": []}
    }'::jsonb,

    -- Integrations
    stripe_account_id TEXT,
    stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    google_calendar_token JSONB,
    google_calendar_id TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT check_positive_radius CHECK (service_radius_miles > 0),
    CONSTRAINT check_non_negative_buffer CHECK (fixed_buffer_minutes >= 0)
);

-- Indexes for providers
CREATE INDEX IF NOT EXISTS idx_providers_slug ON public.providers(slug);
CREATE INDEX IF NOT EXISTS idx_providers_base_location ON public.providers USING GIST(base_location);

-- ----------------------------------------------------------------------------
-- 4. TABLE: services (Offered Service Packages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    deposit_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (deposit_amount_cents >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Index for services
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id) WHERE is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 5. TABLE: appointments (Location-Aware Scheduled Jobs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    
    -- Customer Contact Info
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    
    -- Job Location
    service_address TEXT NOT NULL,
    location extensions.GEOGRAPHY(Point, 4326) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    
    -- Scheduled Window
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Computed Travel Buffers (diagnostic snapshot at time of booking)
    travel_time_from_prev_mins INTEGER NOT NULL DEFAULT 0,
    travel_time_to_next_mins INTEGER NOT NULL DEFAULT 0,
    
    -- Status & Payments
    status public.appointment_status NOT NULL DEFAULT 'pending_deposit',
    payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    deposit_amount_paid_cents INTEGER NOT NULL DEFAULT 0,
    
    -- Notes & Feedback
    customer_notes TEXT,
    internal_notes TEXT,
    cancellation_reason TEXT,
    
    -- Hold Reservation Timeout (10 minutes)
    hold_expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT check_end_after_start CHECK (end_time > start_time)
);

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_provider_schedule 
    ON public.appointments(provider_id, start_time, end_time) 
    WHERE status NOT IN ('cancelled');

CREATE INDEX IF NOT EXISTS idx_appointments_location 
    ON public.appointments USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_appointments_status 
    ON public.appointments(status);

CREATE INDEX IF NOT EXISTS idx_appointments_hold 
    ON public.appointments(hold_expires_at) 
    WHERE status = 'pending_deposit';

-- ----------------------------------------------------------------------------
-- 6. TABLE: cached_routes (Geohash-6 Pair Routing Cache)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cached_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_geohash VARCHAR(12) NOT NULL,
    dest_geohash VARCHAR(12) NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
    distance_meters INTEGER NOT NULL CHECK (distance_meters >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    
    CONSTRAINT uq_route_geohash_pair UNIQUE (origin_geohash, dest_geohash)
);

CREATE INDEX IF NOT EXISTS idx_cached_routes_lookup 
    ON public.cached_routes(origin_geohash, dest_geohash);

CREATE INDEX IF NOT EXISTS idx_cached_routes_expiry 
    ON public.cached_routes(expires_at);

-- ----------------------------------------------------------------------------
-- 7. AUTOMATED TRIGGERS & PROCEDURES
-- ----------------------------------------------------------------------------

-- A. Timestamp auto-updater
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_providers_updated_at ON public.providers;
CREATE TRIGGER trg_providers_updated_at 
    BEFORE UPDATE ON public.providers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at 
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at 
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- B. Geography point auto-sync from lat/lng
CREATE OR REPLACE FUNCTION public.sync_coordinates_to_geography()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.location = extensions.ST_SetSRID(extensions.ST_MakePoint(NEW.lng, NEW.lat), 4326)::extensions.GEOGRAPHY;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_sync_geography ON public.appointments;
CREATE TRIGGER trg_appointments_sync_geography
    BEFORE INSERT OR UPDATE OF lat, lng ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.sync_coordinates_to_geography();

-- ----------------------------------------------------------------------------
-- 8. POSTGIS HELPER RPC FUNCTIONS
-- ----------------------------------------------------------------------------

-- Check whether a candidate lat/lng is within the provider's operating radius
CREATE OR REPLACE FUNCTION public.is_within_service_radius(
    p_provider_id UUID,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS BOOLEAN AS $$
DECLARE
    v_base_location extensions.GEOGRAPHY;
    v_radius_meters DOUBLE PRECISION;
BEGIN
    SELECT base_location, (service_radius_miles * 1609.344)
    INTO v_base_location, v_radius_meters
    FROM public.providers
    WHERE id = p_provider_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    RETURN extensions.ST_DWithin(
        v_base_location,
        extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.GEOGRAPHY,
        v_radius_meters
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_routes ENABLE ROW LEVEL SECURITY;

-- PROVIDERS POLICIES
DROP POLICY IF EXISTS "Public providers profile read" ON public.providers;
CREATE POLICY "Public providers profile read" 
    ON public.providers FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Provider self update" ON public.providers;
CREATE POLICY "Provider self update" 
    ON public.providers FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Provider self insert" ON public.providers;
CREATE POLICY "Provider self insert" 
    ON public.providers FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = id);

-- SERVICES POLICIES
DROP POLICY IF EXISTS "Public services read" ON public.services;
CREATE POLICY "Public services read" 
    ON public.services FOR SELECT 
    USING (is_active = true);

DROP POLICY IF EXISTS "Provider manage services" ON public.services;
CREATE POLICY "Provider manage services" 
    ON public.services FOR ALL 
    TO authenticated 
    USING (auth.uid() = provider_id) 
    WITH CHECK (auth.uid() = provider_id);

-- APPOINTMENTS POLICIES
DROP POLICY IF EXISTS "Provider view and manage own appointments" ON public.appointments;
CREATE POLICY "Provider view and manage own appointments" 
    ON public.appointments FOR ALL 
    TO authenticated 
    USING (auth.uid() = provider_id) 
    WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Public client create pending appointment" ON public.appointments;
CREATE POLICY "Public client create pending appointment" 
    ON public.appointments FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (status = 'pending_deposit');

DROP POLICY IF EXISTS "Public client read specific appointment" ON public.appointments;
CREATE POLICY "Public client read specific appointment" 
    ON public.appointments FOR SELECT 
    TO anon, authenticated 
    USING (true);

-- CACHED ROUTES POLICIES
DROP POLICY IF EXISTS "Public read non-expired cached routes" ON public.cached_routes;
CREATE POLICY "Public read non-expired cached routes" 
    ON public.cached_routes FOR SELECT 
    TO anon, authenticated 
    USING (expires_at > TIMEZONE('utc', NOW()));

DROP POLICY IF EXISTS "Insert cached routes" ON public.cached_routes;
CREATE POLICY "Insert cached routes" 
    ON public.cached_routes FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 10. REALTIME PUBLICATION SETUP
-- Allows providers' live dashboard to receive new appointment events
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

