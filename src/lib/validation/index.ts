/**
 * Schemas de validação compartilhados. TODA mutação valida no servidor com estes schemas.
 * Nunca confiar em preço, duração, tenant ou status vindos do browser.
 */

import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const slugSchema = z
  .string()
  .min(3, "Mínimo de 3 caracteres")
  .max(40, "Máximo de 40 caracteres")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens");

export const hhmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (HH:MM)");

export const dateISOSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (AAAA-MM-DD)");

export const weekdaySchema = z.number().int().min(0).max(6);

/** Telefone BR: 10–11 dígitos, aceita máscara na entrada. */
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .min(10, "Telefone incompleto")
      .max(11, "Telefone inválido")
  );

/** CPF (11 dígitos) ou CNPJ (14 dígitos), aceita máscara na entrada. */
export const cpfCnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .refine((v) => v.length === 11 || v.length === 14, "CPF ou CNPJ inválido")
  );

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

export const businessTypeSchema = z.enum([
  "barbershop",
  "beauty",
  "hair_salon",
  "other",
]);

export const paymentMethodSchema = z.enum(["pix", "cash", "card_in_person"]);
export const paymentPurposeSchema = z.enum(["deposit", "balance", "full_payment"]);

/** Solicitação pública de reserva — o servidor revalida disponibilidade e recalcula valores. */
export const publicBookingSchema = z.object({
  business_slug: slugSchema,
  service_id: uuidSchema,
  professional_id: uuidSchema.nullable(), // null = "qualquer disponível"
  date: dateISOSchema,
  start_time: hhmmSchema, // hora local do negócio
  customer_name: z.string().trim().min(2, "Informe seu nome").max(80),
  customer_phone: phoneSchema,
  customer_email: z.string().trim().email().max(120).nullable(), // opcional: lembrete 24h
  deposit_method: z.enum(["pix"]), // decisão de produto: sinal é sempre via Pix
});
export type PublicBookingInput = z.infer<typeof publicBookingSchema>;

export const availabilityQuerySchema = z.object({
  business_slug: slugSchema,
  service_id: uuidSchema,
  professional_id: uuidSchema.nullable(),
  date: dateISOSchema,
});
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

/** Path de objeto no bucket media ({business_id}/pasta/arquivo). */
export const mediaPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .regex(/^[0-9a-f-]{36}\/[a-z]+\/[A-Za-z0-9._-]+$/);

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).nullable(),
  price_minor: z.number().int().positive().max(100_000_000), // até R$ 1.000.000,00
  duration_minutes: z.number().int().min(5).max(480).multipleOf(5),
  active: z.boolean(),
  image_path: mediaPathSchema.nullable(),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const professionalInputSchema = z.object({
  display_name: z.string().trim().min(2).max(60),
  active: z.boolean(),
  image_path: mediaPathSchema.nullable().optional(),
});
export type ProfessionalInput = z.infer<typeof professionalInputSchema>;

export const shiftInputSchema = z
  .object({
    weekday: weekdaySchema,
    starts_at: hhmmSchema,
    ends_at: hhmmSchema,
  })
  .refine((s) => s.starts_at < s.ends_at, {
    message: "Início deve ser antes do fim",
  });

export const businessHourInputSchema = z
  .object({
    weekday: weekdaySchema,
    opens_at: hhmmSchema,
    closes_at: hhmmSchema,
    is_closed: z.boolean(),
  })
  .refine((h) => h.is_closed || h.opens_at < h.closes_at, {
    message: "Abertura deve ser antes do fechamento",
  });

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  business_type: businessTypeSchema,
  custom_professional_label: z.string().trim().min(2).max(30).nullable(),
  brand_primary: hexColorSchema,
  address: z.string().trim().max(200).nullable(),
  phone: phoneSchema.nullable(),
  whatsapp: phoneSchema.nullable(),
  pix_key: z.string().trim().max(140).nullable(),
  published: z.boolean(),
  logo_path: mediaPathSchema.nullable(),
  cover_path: mediaPathSchema.nullable(),
  cover_position: z.number().int().min(0).max(100),
});
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

/** Registro manual de pagamento pelo painel (sinal ou saldo). */
export const recordPaymentSchema = z.object({
  appointment_id: uuidSchema,
  purpose: paymentPurposeSchema,
  method: paymentMethodSchema,
  amount_minor: z.number().int().positive().max(100_000_000),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
});

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
  business_type: businessTypeSchema,
  timezone: z.string().min(1).max(60), // IANA, validado contra lista no servidor
});
