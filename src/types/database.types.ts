export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppointmentStatus =
  | 'pending_deposit'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'fully_paid'
  | 'refunded';

export interface WorkingDaySchedule {
  active: boolean;
  start: string; // "08:00"
  end: string;   // "17:00"
  breaks: Array<{ start: string; end: string }>;
}

export interface WorkingHoursConfig {
  monday: WorkingDaySchedule;
  tuesday: WorkingDaySchedule;
  wednesday: WorkingDaySchedule;
  thursday: WorkingDaySchedule;
  friday: WorkingDaySchedule;
  saturday: WorkingDaySchedule;
  sunday: WorkingDaySchedule;
}

export interface Database {
  public: {
    Tables: {
      providers: {
        Row: {
          id: string;
          slug: string;
          business_name: string;
          owner_name: string;
          phone: string;
          email: string;
          base_address: string;
          base_location: unknown; // PostGIS geography point
          base_lat: number;
          base_lng: number;
          service_radius_miles: number;
          fixed_buffer_minutes: number;
          return_to_base_required: boolean;
          working_hours: WorkingHoursConfig;
          stripe_account_id: string | null;
          stripe_charges_enabled: boolean;
          google_calendar_token: Json | null;
          google_calendar_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          business_name: string;
          owner_name: string;
          phone: string;
          email: string;
          base_address: string;
          base_location?: unknown;
          base_lat: number;
          base_lng: number;
          service_radius_miles?: number;
          fixed_buffer_minutes?: number;
          return_to_base_required?: boolean;
          working_hours?: WorkingHoursConfig | Json;
          stripe_account_id?: string | null;
          stripe_charges_enabled?: boolean;
          google_calendar_token?: Json | null;
          google_calendar_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          business_name?: string;
          owner_name?: string;
          phone?: string;
          email?: string;
          base_address?: string;
          base_location?: unknown;
          base_lat?: number;
          base_lng?: number;
          service_radius_miles?: number;
          fixed_buffer_minutes?: number;
          return_to_base_required?: boolean;
          working_hours?: WorkingHoursConfig | Json;
          stripe_account_id?: string | null;
          stripe_charges_enabled?: boolean;
          google_calendar_token?: Json | null;
          google_calendar_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          provider_id: string;
          title: string;
          description: string | null;
          duration_minutes: number;
          price_cents: number;
          deposit_amount_cents: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          title: string;
          description?: string | null;
          duration_minutes: number;
          price_cents: number;
          deposit_amount_cents?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          title?: string;
          description?: string | null;
          duration_minutes?: number;
          price_cents?: number;
          deposit_amount_cents?: number;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          }
        ];
      };
      appointments: {
        Row: {
          id: string;
          provider_id: string;
          service_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          service_address: string;
          location: unknown;
          lat: number;
          lng: number;
          start_time: string;
          end_time: string;
          travel_time_from_prev_mins: number;
          travel_time_to_next_mins: number;
          status: AppointmentStatus;
          payment_status: PaymentStatus;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          deposit_amount_paid_cents: number;
          customer_notes: string | null;
          internal_notes: string | null;
          cancellation_reason: string | null;
          hold_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          service_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          service_address: string;
          location?: unknown;
          lat: number;
          lng: number;
          start_time: string;
          end_time: string;
          travel_time_from_prev_mins?: number;
          travel_time_to_next_mins?: number;
          status?: AppointmentStatus;
          payment_status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          deposit_amount_paid_cents?: number;
          customer_notes?: string | null;
          internal_notes?: string | null;
          cancellation_reason?: string | null;
          hold_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider_id?: string;
          service_id?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          service_address?: string;
          location?: unknown;
          lat?: number;
          lng?: number;
          start_time?: string;
          end_time?: string;
          travel_time_from_prev_mins?: number;
          travel_time_to_next_mins?: number;
          status?: AppointmentStatus;
          payment_status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          deposit_amount_paid_cents?: number;
          customer_notes?: string | null;
          internal_notes?: string | null;
          cancellation_reason?: string | null;
          hold_expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          }
        ];
      };
      cached_routes: {
        Row: {
          id: string;
          origin_geohash: string;
          dest_geohash: string;
          duration_seconds: number;
          distance_meters: number;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          origin_geohash: string;
          dest_geohash: string;
          duration_seconds: number;
          distance_meters: number;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          origin_geohash?: string;
          dest_geohash?: string;
          duration_seconds?: number;
          distance_meters?: number;
          expires_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_within_service_radius: {
        Args: {
          p_provider_id: string;
          p_lat: number;
          p_lng: number;
        };
        Returns: boolean;
      };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
