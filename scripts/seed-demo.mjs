/**
 * Conta demo permanente di Agenda Easy.
 *
 * Crea (o resetta) l'utente DEMO_EMAIL con la password DEMO_PASSWORD e
 * l'attività "studio-anna" già compilata: servizi, prodotti, piani, orari,
 * clienti e prenotazioni. L'attività è `comped`: niente prova che scade e
 * niente blocco Stripe.
 *
 * La password resta solo nell'ambiente. Non va nel codice né nel browser.
 *
 *   DEMO_EMAIL=demo@agendaeasy.it DEMO_PASSWORD='…' node scripts/seed-demo.mjs
 *
 * Rilanciare lo script ricrea i dati di esempio e reimposta la password.
 * Legge .env.local se le variabili non sono già nell'ambiente.
 */

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(".env.local");
loadEnv(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = (process.env.DEMO_EMAIL || "demo@agendaeasy.it").trim().toLowerCase();
const password = process.env.DEMO_PASSWORD;

if (!url || !secret) {
  console.error("Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY.");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Imposta DEMO_PASSWORD (minimo 8 caratteri) nell'ambiente. Non committarla.");
  process.exit(1);
}

const BID = "d1111111-1111-4111-8111-111111111111";
const SERVICES = {
  cut: "d2222222-2222-4222-8222-222222222201",
  colour: "d2222222-2222-4222-8222-222222222202",
  nails: "d2222222-2222-4222-8222-222222222203",
  oil: "d2222222-2222-4222-8222-222222222204",
};
const PROS = {
  anna: "d3333333-3333-4333-8333-333333333301",
  giulia: "d3333333-3333-4333-8333-333333333302",
};
const CUSTOMERS = {
  sara: "d4444444-4444-4444-8444-444444444401",
  luca: "d4444444-4444-4444-8444-444444444402",
  elena: "d4444444-4444-4444-8444-444444444403",
  giulia: "d4444444-4444-4444-8444-444444444404",
  marco: "d4444444-4444-4444-8444-444444444405",
};

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function todayInRome() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

/** Converte una data e un orario di Europe/Rome in un istante UTC. */
function romeToUtc(isoDate, hhmm) {
  const [y, mo, d] = isoDate.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Rome",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(guess)
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );
  return new Date(guess.getTime() - (asUtc - guess.getTime())).toISOString();
}

async function findUserId() {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser() {
  const existing = await findUserId();
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    return existing;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Demo Agenda Easy" },
  });
  if (error) throw error;
  return data.user.id;
}

function must(error, step) {
  if (error) {
    console.error(step, error.message);
    process.exit(1);
  }
}

const userId = await ensureUser();

must(
  (
    await supabase.from("businesses").upsert(
      {
        id: BID,
        slug: "studio-anna",
        name: "Studio Anna",
        business_type: "hair_salon",
        brand_primary: "#7c3aed",
        address: "Via Roma 18, Milano",
        phone: "0212345678",
        whatsapp: "3331001001",
        timezone: "Europe/Rome",
        country_code: "IT",
        published: true,
        comped: true,
      },
      { onConflict: "id" },
    )
  ).error,
  "business",
);

must(
  (
    await supabase.from("business_members").upsert(
      {
        business_id: BID,
        user_id: userId,
        role: "owner",
        invite_status: "accepted",
      },
      { onConflict: "business_id,user_id" },
    )
  ).error,
  "member",
);

// Reset dei dati di esempio. Le tabelle figlie vanno prima.
for (const table of [
  "payments",
  "appointments",
  "customers",
  "plans",
  "breaks",
  "professional_shifts",
  "professionals",
  "business_hours",
  "services",
]) {
  must((await supabase.from(table).delete().eq("business_id", BID)).error, `delete ${table}`);
}

must(
  (
    await supabase.from("services").insert([
      {
        id: SERVICES.cut,
        business_id: BID,
        item_type: "service",
        name: "Taglio + piega",
        description: "Taglio su misura e piega.",
        price_minor: 4500,
        currency: "EUR",
        duration_minutes: 60,
      },
      {
        id: SERVICES.colour,
        business_id: BID,
        item_type: "service",
        name: "Colore",
        description: "Colore completo, dalla diagnosi al risciacquo.",
        price_minor: 9000,
        currency: "EUR",
        duration_minutes: 120,
      },
      {
        id: SERVICES.nails,
        business_id: BID,
        item_type: "service",
        name: "Manicure",
        description: "Manicure curativa.",
        price_minor: 2500,
        currency: "EUR",
        duration_minutes: 45,
      },
      {
        id: SERVICES.oil,
        business_id: BID,
        item_type: "product",
        name: "Olio capelli",
        description: "Flacone da 50 ml, in vetrina.",
        price_minor: 1800,
        currency: "EUR",
        duration_minutes: 5,
      },
    ])
  ).error,
  "services",
);

must(
  (
    await supabase.from("plans").insert([
      {
        business_id: BID,
        title: "Abbonamento mensile",
        description: "Un taglio al mese, prenoti quando vuoi.",
        price_minor: 3900,
        price_suffix: "/mese",
        badge: "Più scelto",
        sort_order: 0,
      },
      {
        business_id: BID,
        title: "Porta un'amica",
        description: "Martedì e mercoledì, −10% sul colore se venite in due.",
        price_suffix: "−10%",
        badge: "Promo",
        sort_order: 1,
      },
    ])
  ).error,
  "plans",
);

must(
  (
    await supabase.from("professionals").insert([
      { id: PROS.anna, business_id: BID, display_name: "Anna" },
      { id: PROS.giulia, business_id: BID, display_name: "Giulia" },
    ])
  ).error,
  "professionals",
);

must(
  (
    await supabase.from("business_hours").insert(
      [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        business_id: BID,
        weekday,
        opens_at: "09:00",
        closes_at: "19:00",
        is_closed: weekday === 0,
      })),
    )
  ).error,
  "hours",
);

const shiftRows = [];
for (const professionalId of Object.values(PROS)) {
  for (let weekday = 1; weekday <= 6; weekday += 1) {
    shiftRows.push({
      business_id: BID,
      professional_id: professionalId,
      weekday,
      starts_at: "09:00",
      ends_at: "18:00",
    });
  }
}
must((await supabase.from("professional_shifts").insert(shiftRows)).error, "shifts");

must(
  (
    await supabase.from("breaks").insert(
      [1, 2, 3, 4, 5, 6].map((weekday) => ({
        business_id: BID,
        professional_id: null,
        weekday,
        starts_at: "13:00",
        ends_at: "14:00",
      })),
    )
  ).error,
  "breaks",
);

must(
  (
    await supabase.from("customers").insert([
      { id: CUSTOMERS.sara, business_id: BID, name: "Sara Bianchi", phone: "3331001002", email: "sara.bianchi@example.com" },
      { id: CUSTOMERS.luca, business_id: BID, name: "Luca Moretti", phone: "3331001003", email: "luca.moretti@example.com" },
      { id: CUSTOMERS.elena, business_id: BID, name: "Elena Galli", phone: "3331001004" },
      { id: CUSTOMERS.giulia, business_id: BID, name: "Giulia Conti", phone: "3331001005", email: "giulia.conti@example.com" },
      { id: CUSTOMERS.marco, business_id: BID, name: "Marco Riva", phone: "3331001006" },
    ])
  ).error,
  "customers",
);

const today = todayInRome();
function slot(dayOffset, time, minutes) {
  const date = addDays(today, dayOffset);
  const [h, m] = time.split(":").map(Number);
  const endMin = h * 60 + m + minutes;
  const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
  return { starts_at: romeToUtc(date, time), ends_at: romeToUtc(date, end) };
}

const bookings = [
  { ...slot(-3, "10:00", 60), customer_id: CUSTOMERS.sara, professional_id: PROS.anna, service_id: SERVICES.cut, status: "completed", service_price_minor: 4500 },
  { ...slot(-2, "11:00", 120), customer_id: CUSTOMERS.luca, professional_id: PROS.giulia, service_id: SERVICES.colour, status: "completed", service_price_minor: 9000 },
  { ...slot(-1, "15:00", 45), customer_id: CUSTOMERS.marco, professional_id: PROS.anna, service_id: SERVICES.nails, status: "no_show", service_price_minor: 2500 },
  { ...slot(-1, "16:00", 60), customer_id: CUSTOMERS.elena, professional_id: PROS.giulia, service_id: SERVICES.cut, status: "cancelled", service_price_minor: 4500 },
  { ...slot(0, "09:30", 60), customer_id: CUSTOMERS.sara, professional_id: PROS.anna, service_id: SERVICES.cut, status: "confirmed", service_price_minor: 4500 },
  { ...slot(0, "11:00", 120), customer_id: CUSTOMERS.luca, professional_id: PROS.giulia, service_id: SERVICES.colour, status: "confirmed", service_price_minor: 9000 },
  { ...slot(0, "15:00", 45), customer_id: CUSTOMERS.elena, professional_id: PROS.anna, service_id: SERVICES.nails, status: "confirmed", service_price_minor: 2500 },
  { ...slot(1, "10:30", 60), customer_id: CUSTOMERS.giulia, professional_id: PROS.anna, service_id: SERVICES.cut, status: "confirmed", service_price_minor: 4500 },
  { ...slot(1, "16:00", 45), customer_id: CUSTOMERS.marco, professional_id: PROS.giulia, service_id: SERVICES.nails, status: "confirmed", service_price_minor: 2500 },
  { ...slot(3, "09:00", 120), customer_id: CUSTOMERS.sara, professional_id: PROS.giulia, service_id: SERVICES.colour, status: "confirmed", service_price_minor: 9000 },
].map((row) => ({ ...row, business_id: BID, lang: "it" }));

must((await supabase.from("appointments").insert(bookings)).error, "appointments");

console.log(`Demo pronta: ${email}`);
console.log("Attività: Studio Anna · /studio-anna · comped, senza scadenza.");
console.log("Per resettare, rilancia questo script.");
