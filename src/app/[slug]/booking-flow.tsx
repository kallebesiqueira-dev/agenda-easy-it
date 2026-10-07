"use client";

/**
 * Fluxo público de reserva em etapas. Mobile-first — o link será aberto
 * majoritariamente pelo WhatsApp/Instagram do negócio.
 *
 * O servidor é a autoridade: esta UI só coleta escolhas; disponibilidade e
 * valores são sempre recalculados em /api/public/*.
 */

import { useMemo, useState } from "react";
import type {
  AvailableSlot,
  BookingHoldResult,
  PublicBusinessProfile,
  PublicService,
} from "@/types/database";
import { formatDateTimeInTz, formatTimeInTz, todayInTz } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { mediaUrl } from "@/lib/storage";

/** Janela máxima de agendamento futuro. Decisão de produto: 30 dias. */
const MAX_ADVANCE_DAYS = 30;

type Step = "service" | "professional" | "datetime" | "details" | "done";

interface DayOption {
  dateISO: string; // AAAA-MM-DD no fuso do negócio
  weekdayLabel: string; // "seg."
  dayLabel: string; // "14/10"
}

function buildDayOptions(timezone: string): DayOption[] {
  const todayISO = todayInTz(timezone);
  const [y, m, d] = todayISO.split("-").map(Number);
  const days: DayOption[] = [];
  for (let i = 0; i < MAX_ADVANCE_DAYS; i++) {
    const date = new Date(Date.UTC(y, m - 1, d + i, 12));
    const dateISO = date.toISOString().slice(0, 10);
    days.push({
      dateISO,
      weekdayLabel: new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        timeZone: "UTC",
      }).format(date),
      dayLabel: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }).format(date),
    });
  }
  return days;
}

const ERROR_MESSAGES: Record<string, string> = {
  slot_unavailable: "Esse horário acabou de ser ocupado. Escolha outro.",
  slot_taken: "Esse horário acabou de ser ocupado. Escolha outro.",
  slot_in_past: "Esse horário já passou. Escolha outro.",
  invalid_input: "Confira seu nome e telefone e tente novamente.",
};

export function BookingFlow({ profile }: { profile: PublicBusinessProfile }) {
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<PublicService | null>(null);
  /** undefined = ainda não escolhido; null = "qualquer disponível" */
  const [professionalId, setProfessionalId] = useState<string | null | undefined>();
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  // Decisão de produto: o sinal de 50% é sempre via Pix; o restante o
  // cliente paga no local (dinheiro ou cartão).
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingHoldResult | null>(null);

  const dayOptions = useMemo(() => buildDayOptions(profile.timezone), [profile.timezone]);

  /** Chamado em handlers (clique no dia / retry), nunca em efeitos. */
  async function loadSlots(date: string, forProfessionalId = professionalId) {
    if (!service) return;
    setSlotsLoading(true);
    setSlots(null);
    setSelectedSlot(null);
    try {
      const params = new URLSearchParams({
        business_slug: profile.slug,
        service_id: service.id,
        date,
      });
      if (forProfessionalId) params.set("professional_id", forProfessionalId);
      const res = await fetch(`/api/public/availability?${params}`);
      const json = await res.json();
      setSlots(res.ok ? json.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  /** Reset ao trocar serviço/profissional: slots antigos ficam inválidos. */
  function resetDateSelection() {
    setDateISO(null);
    setSlots(null);
    setSelectedSlot(null);
  }

  // Slots deduplicados por horário (vários profissionais livres no mesmo
  // horário viram uma opção só quando "qualquer disponível").
  const timeOptions = useMemo(() => {
    if (!slots) return [];
    const seen = new Map<string, AvailableSlot>();
    for (const s of slots) {
      if (!seen.has(s.starts_at)) seen.set(s.starts_at, s);
    }
    return [...seen.values()];
  }, [slots]);

  async function submit() {
    if (!service || !dateISO || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_slug: profile.slug,
          service_id: service.id,
          professional_id: professionalId ?? null,
          date: dateISO,
          start_time: formatTimeInTz(selectedSlot.starts_at, profile.timezone),
          customer_name: name,
          customer_phone: phone,
          customer_email: email.trim() || null,
          deposit_method: "pix",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const message =
          ERROR_MESSAGES[json.error] ?? "Não foi possível concluir. Tente novamente.";
        setError(message);
        if (json.error === "slot_unavailable" || json.error === "slot_taken") {
          setStep("datetime");
          if (dateISO) loadSlots(dateISO);
        }
        return;
      }
      setResult(json.booking);
      setStep("done");
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const brandStyle = { "--brand": profile.brand_primary } as React.CSSProperties;

  return (
    <div style={brandStyle} className="min-h-dvh bg-zinc-100 text-zinc-900">
      <header className="relative overflow-hidden bg-[var(--brand)] px-4 pb-20 pt-10 text-white sm:pt-14">
        {profile.cover_path ? (
          <>
            {/* capa do negócio + véu escuro para o texto continuar legível */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(profile.cover_path)!}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full object-cover"
              style={{ objectPosition: `50% ${profile.cover_position}%` }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/20"
            />
          </>
        ) : (
          // brilho decorativo sobre a cor da marca
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 120% at 85% -20%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(40% 80% at 0% 100%, rgba(0,0,0,0.18), transparent 60%)",
            }}
          />
        )}
        <div className="relative mx-auto flex w-full max-w-md items-center gap-4 sm:max-w-lg lg:max-w-xl">
          {profile.logo_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(profile.logo_path)!}
              alt={profile.name}
              className="size-14 shrink-0 rounded-2xl object-cover ring-1 ring-white/25 sm:size-16"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold ring-1 ring-white/25 backdrop-blur-sm sm:size-16">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs/none uppercase tracking-[0.14em] opacity-80">
              Agendamento online
            </p>
            <h1 className="mt-1.5 truncate text-2xl font-bold sm:text-3xl">
              {profile.name}
            </h1>
            {profile.address && (
              <p className="mt-1 truncate text-sm opacity-80">{profile.address}</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-16 sm:max-w-lg lg:max-w-xl">
        <div className="relative -mt-12 rounded-3xl bg-white p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/5 sm:p-7">
          {step === "service" && (
            <StepShell title="Escolha o serviço">
              <ul className="space-y-2.5">
                {profile.services.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setService(s);
                        resetDateSelection();
                        setStep(
                          profile.professionals.length > 1 ? "professional" : "datetime"
                        );
                        if (profile.professionals.length === 1) {
                          setProfessionalId(profile.professionals[0].id);
                        }
                      }}
                      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-md"
                    >
                      {s.image_path && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(s.image_path)!}
                          alt=""
                          className="size-14 shrink-0 rounded-xl object-cover"
                        />
                      )}
                      <span className="flex-1">
                        <span className="block font-medium">{s.name}</span>
                        <span className="block text-sm text-zinc-500">
                          {s.duration_minutes} min
                          {s.description ? ` · ${s.description}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold transition-colors group-hover:bg-[var(--brand)] group-hover:text-white">
                        {formatBRL(s.price_minor)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {profile.services.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  Nenhum serviço disponível no momento.
                </p>
              )}
            </StepShell>
          )}

          {step === "professional" && service && (
            <StepShell
              title={`Escolha o ${profile.professional_label.toLowerCase()}`}
              onBack={() => setStep("service")}
            >
              <ul className="space-y-2">
                <li>
                  <ChoiceButton
                    label="Qualquer disponível"
                    sublabel="Mais horários livres"
                    onClick={() => {
                      setProfessionalId(null);
                      resetDateSelection();
                      setStep("datetime");
                    }}
                  />
                </li>
                {profile.professionals.map((p) => (
                  <li key={p.id}>
                    <ChoiceButton
                      label={p.display_name}
                      imageUrl={mediaUrl(p.image_path)}
                      onClick={() => {
                        setProfessionalId(p.id);
                        resetDateSelection();
                        setStep("datetime");
                      }}
                    />
                  </li>
                ))}
              </ul>
            </StepShell>
          )}

          {step === "datetime" && service && (
            <StepShell
              title="Escolha data e horário"
              onBack={() =>
                setStep(profile.professionals.length > 1 ? "professional" : "service")
              }
            >
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {dayOptions.map((d) => (
                  <button
                    key={d.dateISO}
                    type="button"
                    onClick={() => {
                      setDateISO(d.dateISO);
                      loadSlots(d.dateISO);
                    }}
                    className={`flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2.5 text-sm transition-all sm:w-16 ${
                      dateISO === d.dateISO
                        ? "border-transparent bg-[var(--brand)] text-white shadow-md"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-[var(--brand)]"
                    }`}
                  >
                    <span className="capitalize">{d.weekdayLabel.replace(".", "")}</span>
                    <span className="font-semibold">{d.dayLabel}</span>
                  </button>
                ))}
              </div>

              {!dateISO && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  Selecione um dia para ver os horários.
                </p>
              )}
              {dateISO && slotsLoading && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  Buscando horários…
                </p>
              )}
              {dateISO && !slotsLoading && slots && timeOptions.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  Sem horários livres nesse dia. Tente outra data.
                </p>
              )}
              {dateISO && !slotsLoading && timeOptions.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2 sm:grid-cols-5 lg:grid-cols-6">
                  {timeOptions.map((slot) => (
                    <button
                      key={slot.starts_at}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep("details");
                      }}
                      className="rounded-xl border border-zinc-200 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] hover:shadow-sm"
                    >
                      {formatTimeInTz(slot.starts_at, profile.timezone)}
                    </button>
                  ))}
                </div>
              )}
            </StepShell>
          )}

          {step === "details" && service && selectedSlot && (
            <StepShell title="Seus dados" onBack={() => setStep("datetime")}>
              <Summary
                serviceName={service.name}
                when={formatDateTimeInTz(selectedSlot.starts_at, profile.timezone)}
                priceMinor={service.price_minor}
              />
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Nome</span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-[var(--brand)]"
                    placeholder="Seu nome"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    WhatsApp / celular
                  </span>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-[var(--brand)]"
                    placeholder="(11) 99999-9999"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    E-mail <span className="text-zinc-400">(opcional)</span>
                  </span>
                  <input
                    type="email"
                    maxLength={120}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-[var(--brand)]"
                    placeholder="Para receber lembrete do horário"
                  />
                </label>

                <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600">
                  O sinal de 50% é pago por <strong>Pix</strong> para
                  confirmar a reserva. O restante você paga no local, em
                  dinheiro ou cartão.
                </p>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[var(--brand)] py-3 font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Reservando…" : "Reservar horário"}
                </button>
              </form>
            </StepShell>
          )}

          {step === "done" && service && result && (
            <div className="py-2 text-center">
              <p className="text-3xl">⏳</p>
              <h2 className="mt-2 text-lg font-bold">Horário reservado!</h2>
              <p className="mt-1 text-sm text-zinc-600">
                {service.name} ·{" "}
                {formatDateTimeInTz(result.starts_at, profile.timezone)}
              </p>

              <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-left text-sm">
                <p className="font-semibold">
                  Confirme pagando o sinal de {formatBRL(result.deposit_due_minor)}
                </p>
                <p className="mt-1 text-zinc-600">
                  Prazo: até{" "}
                  {formatDateTimeInTz(result.hold_expires_at, profile.timezone)}.
                  Após o prazo, a reserva é liberada para outros clientes.
                </p>
                {result.pix_key ? (
                  <div className="mt-3">
                    <p className="text-zinc-600">Chave Pix:</p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 truncate rounded-lg bg-white px-3 py-2">
                        {result.pix_key}
                      </code>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(result.pix_key!)}
                        className="shrink-0 rounded-lg bg-[var(--brand)] px-3 py-2 font-medium text-white"
                      >
                        Copiar
                      </button>
                    </div>
                    <p className="mt-2 text-zinc-600">
                      Envie o comprovante pelo WhatsApp para confirmar mais rápido.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-zinc-600">
                    Combine o Pix do sinal diretamente com o estabelecimento
                    pelo WhatsApp.
                  </p>
                )}
              </div>

              {profile.whatsapp && (
                <a
                  href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Olá! Sou ${name}. Acabei de reservar ${service.name} para ${formatDateTimeInTz(
                      result.starts_at,
                      profile.timezone
                    )}.` +
                      (result.pix_key
                        ? ` Vou enviar o comprovante do sinal de ${formatBRL(result.deposit_due_minor)}.`
                        : ` Como pago o Pix do sinal de ${formatBRL(result.deposit_due_minor)}?`)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full rounded-xl bg-[#25D366] py-3 font-semibold text-white"
                >
                  {result.pix_key
                    ? "Enviar comprovante no WhatsApp"
                    : "Combinar o Pix no WhatsApp"}
                </a>
              )}

              {result.cancel_token && (
                <p className="mt-4 text-xs text-zinc-400">
                  Imprevisto?{" "}
                  <a
                    href={`/cancelar/${result.appointment_id}?t=${result.cancel_token}`}
                    className="underline"
                  >
                    Cancelar esta reserva
                  </a>{" "}
                  (até 2h antes do horário).
                </p>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Agendamento por Agenda Easy
        </p>
      </main>
    </div>
  );
}

function StepShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100"
          >
            ←
          </button>
        )}
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ChoiceButton({
  label,
  sublabel,
  imageUrl,
  onClick,
}: {
  label: string;
  sublabel?: string;
  imageUrl?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-md"
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="size-11 shrink-0 rounded-full object-cover"
        />
      )}
      <span>
        <span className="block font-medium">{label}</span>
        {sublabel && (
          <span className="block text-sm text-zinc-500">{sublabel}</span>
        )}
      </span>
    </button>
  );
}

function Summary({
  serviceName,
  when,
  priceMinor,
}: {
  serviceName: string;
  when: string;
  priceMinor: number;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3 text-sm">
      <p className="font-medium">{serviceName}</p>
      <p className="text-zinc-600">{when}</p>
      <p className="mt-1 text-zinc-600">
        Total: <strong>{formatBRL(priceMinor)}</strong> · Sinal de 50% para
        confirmar
      </p>
    </div>
  );
}
