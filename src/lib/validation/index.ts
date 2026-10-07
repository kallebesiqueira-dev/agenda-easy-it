/**
 * Schemi di validazione condivisi. OGNI mutazione viene validata sul server con questi schemi.
 * Mai fidarsi di prezzo, durata, tenant o stato provenienti dal browser.
 */

import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const slugSchema = z
  .string()
  .min(3, "Minimo 3 caratteri")
  .max(40, "Massimo 40 caratteri")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa lettere minuscole, numeri e trattini");

export const hhmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Orario non valido (HH:MM)");

export const dateISOSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida (AAAA-MM-GG)");

export const weekdaySchema = z.number().int().min(0).max(6);

/** Telefono IT: 8–12 cifre (fisso o mobile), accetta formattazione in input. */
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .min(8, "Telefono incompleto")
      .max(12, "Telefono non valido")
  );

/** Codice Fiscale (16 caratteri alfanumerici) o Partita IVA (11 cifre), accetta formattazione in input. */
export const cpfCnpjSchema = z
  .string()
  .transform((v) => v.replace(/[\s.-]/g, "").toUpperCase())
  .pipe(
    z
      .string()
      .refine(
        (v) => /^\d{11}$/.test(v) || /^[A-Z0-9]{16}$/.test(v),
        "Codice Fiscale o Partita IVA non validi"
      )
  );

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Colore non valido");

export const businessTypeSchema = z.enum([
  "barbershop",
  "beauty",
  "hair_salon",
  "other",
]);

export const paymentMethodSchema = z.enum(["pix", "cash", "card_in_person"]);
export const paymentPurposeSchema = z.enum(["deposit", "balance", "full_payment"]);

/** Richiesta pubblica di prenotazione — il server riconvalida la disponibilità e ricalcola gli importi. */
export const publicBookingSchema = z.object({
  business_slug: slugSchema,
  service_id: uuidSchema,
  professional_id: uuidSchema.nullable(), // null = "qualsiasi disponibile"
  date: dateISOSchema,
  start_time: hhmmSchema, // ora locale dell'attività
  customer_name: z.string().trim().min(2, "Inserisci il tuo nome").max(80),
  customer_phone: phoneSchema,
  customer_email: z.string().trim().email().max(120).nullable(), // opzionale: promemoria 24h
  deposit_method: z.enum(["pix"]), // valore interno storico: acconto tramite bonifico istantaneo
});
export type PublicBookingInput = z.infer<typeof publicBookingSchema>;

export const availabilityQuerySchema = z.object({
  business_slug: slugSchema,
  service_id: uuidSchema,
  professional_id: uuidSchema.nullable(),
  date: dateISOSchema,
});
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

/** Percorso dell'oggetto nel bucket media ({business_id}/cartella/file). */
export const mediaPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .regex(/^[0-9a-f-]{36}\/[a-z]+\/[A-Za-z0-9._-]+$/);

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).nullable(),
  price_minor: z.number().int().positive().max(100_000_000), // fino a € 1.000.000,00
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
    message: "L'inizio deve essere prima della fine",
  });

export const businessHourInputSchema = z
  .object({
    weekday: weekdaySchema,
    opens_at: hhmmSchema,
    closes_at: hhmmSchema,
    is_closed: z.boolean(),
  })
  .refine((h) => h.is_closed || h.opens_at < h.closes_at, {
    message: "L'apertura deve essere prima della chiusura",
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

/** Registrazione manuale di un pagamento dal pannello (acconto o saldo). */
export const recordPaymentSchema = z.object({
  appointment_id: uuidSchema,
  purpose: paymentPurposeSchema,
  method: paymentMethodSchema,
  amount_minor: z.number().int().positive().max(100_000_000),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const signInSchema = z.object({
  email: z.string().email("E-mail non valido"),
  password: z.string().min(8, "Minimo 8 caratteri").max(72),
});

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
  business_type: businessTypeSchema,
  timezone: z.string().min(1).max(60), // IANA, validato contro una lista sul server
});
