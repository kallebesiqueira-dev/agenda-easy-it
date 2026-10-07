import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDateTimeInTz } from "@/lib/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CancelPanel } from "./cancel-panel";

export const metadata: Metadata = { title: "Cancelar reserva — Agenda Easy" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function CancelBookingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { t: token } = await searchParams;
  if (!token || !/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f-]{36}$/.test(token)) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, status, cancel_token, business:businesses(name, timezone), service:services(name)"
    )
    .eq("id", id)
    .eq("cancel_token", token) // token validado no banco, não em memória
    .maybeSingle();

  const appt = data as unknown as {
    id: string;
    starts_at: string;
    status: string;
    cancel_token: string;
    business: { name: string; timezone: string } | null;
    service: { name: string } | null;
  } | null;

  if (!appt || appt.cancel_token !== token || !appt.business) notFound();

  const when = formatDateTimeInTz(appt.starts_at, appt.business.timezone);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Cancelar reserva</h1>
        <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm">
          <p className="font-medium">{appt.service?.name}</p>
          <p className="text-zinc-600">{appt.business.name}</p>
          <p className="text-zinc-600">{when}</p>
        </div>
        <CancelPanel
          appointmentId={appt.id}
          token={token}
          alreadyCancelled={appt.status === "cancelled"}
          finished={appt.status === "completed" || appt.status === "no_show"}
        />
      </div>
    </main>
  );
}
