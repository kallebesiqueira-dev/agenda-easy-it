/**
 * Contrato de dados do MVP — espelha supabase/migrations.
 * Qualquer alteração aqui exige decisão documentada e migração correspondente.
 * Todos os IDs são UUID; timestamps em UTC (ISO 8601); dinheiro em centavos (minor units).
 */

export type BusinessType = "barbershop" | "beauty" | "hair_salon" | "other";

export type MemberRole = "owner" | "manager" | "professional";

export type MemberInviteStatus = "pending" | "accepted" | "revoked";

export type AppointmentStatus =
  | "awaiting_deposit"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type PaymentPurpose = "deposit" | "balance" | "full_payment";

export type PaymentMethod = "pix" | "cash" | "card_in_person";

export type PaymentStatus =
  | "pending_confirmation"
  | "recorded"
  | "refunded"
  | "void";

/** 0 = domingo … 6 = sábado (convenção JS Date.getDay / ISO dow do Postgres ajustado) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Business {
  id: string;
  slug: string;
  name: string;
  business_type: BusinessType;
  custom_professional_label: string | null;
  logo_path: string | null;
  cover_path: string | null;
  cover_position: number; // 0–100: enquadramento vertical da capa
  brand_primary: string; // cor de acento validada (hex)
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  timezone: string; // IANA, es. "Europe/Rome"
  country_code: "BR" | "IT";
  pix_key: string | null;
  published: boolean;
  comped: boolean; // cortesia: isento de assinatura
  created_at: string;
}

export interface BusinessMember {
  business_id: string;
  user_id: string;
  role: MemberRole;
  invite_status: MemberInviteStatus;
  created_at: string;
}

export interface BusinessHour {
  id: string;
  business_id: string;
  weekday: Weekday;
  opens_at: string; // "HH:MM" hora local do negócio
  closes_at: string;
  is_closed: boolean;
}

export interface Professional {
  id: string;
  business_id: string;
  display_name: string;
  active: boolean;
  image_path: string | null;
}

export interface ProfessionalShift {
  id: string;
  business_id: string;
  professional_id: string;
  weekday: Weekday;
  starts_at: string; // "HH:MM" hora local
  ends_at: string;
}

export interface Break {
  id: string;
  business_id: string;
  professional_id: string | null; // null = pausa geral do negócio
  weekday: Weekday;
  starts_at: string;
  ends_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_minor: number; // centavos
  currency: "BRL" | "EUR";
  duration_minutes: number;
  image_path: string | null;
  active: boolean;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  customer_id: string;
  customer_email: string | null; // e-mail só desta reserva (confirmação/lembrete)
  professional_id: string;
  service_id: string;
  starts_at: string; // UTC
  ends_at: string; // UTC
  status: AppointmentStatus;
  service_price_minor: number; // snapshot congelado na reserva
  deposit_due_minor: number; // 50% arredondado p/ cima, congelado
  deposit_paid_at: string | null;
  hold_expires_at: string | null; // prazo da retenção awaiting_deposit
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  business_id: string;
  appointment_id: string;
  amount_minor: number;
  currency: "BRL" | "EUR";
  purpose: PaymentPurpose;
  method: PaymentMethod;
  status: PaymentStatus;
  paid_at: string | null;
  recorded_by: string; // user_id do membro que registrou
  created_at: string;
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export interface Subscription {
  business_id: string;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  trial_ends_at: string;
  overdue_since: string | null;
  last_paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Perfil público: o ÚNICO shape que rotas públicas podem retornar sobre um negócio. */
export interface PublicBusinessProfile {
  slug: string;
  name: string;
  business_type: BusinessType;
  professional_label: string;
  logo_path: string | null;
  cover_path: string | null;
  cover_position: number;
  brand_primary: string;
  address: string | null;
  whatsapp: string | null;
  timezone: string;
  services: PublicService[];
  professionals: PublicProfessional[];
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  price_minor: number;
  duration_minutes: number;
  image_path: string | null;
}

export interface PublicProfessional {
  id: string;
  display_name: string;
  image_path: string | null;
}

/** Slot disponível retornado pela função de disponibilidade (sempre calculado no servidor). */
export interface AvailableSlot {
  professional_id: string;
  starts_at: string; // UTC
  ends_at: string; // UTC
}

/** Resultado da criação de reserva pública (retenção aguardando sinal). */
export interface BookingHoldResult {
  appointment_id: string;
  status: "awaiting_deposit";
  starts_at: string;
  ends_at: string;
  service_price_minor: number;
  deposit_due_minor: number;
  hold_expires_at: string;
  pix_key: string | null;
  /** Token secreto para o cliente cancelar a própria reserva. */
  cancel_token: string;
}
