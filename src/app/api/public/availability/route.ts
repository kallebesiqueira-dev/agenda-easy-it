/**
 * GET /api/public/availability?business_slug=...&service_id=...&date=AAAA-MM-DD[&professional_id=...]
 * Retorna os slots livres calculados no servidor. Nunca expõe agendamentos.
 */

import { availabilityQuerySchema } from "@/lib/validation";
import { AvailabilityError, getDayAvailability } from "@/lib/availability/query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = availabilityQuerySchema.safeParse({
    business_slug: searchParams.get("business_slug"),
    service_id: searchParams.get("service_id"),
    professional_id: searchParams.get("professional_id") || null,
    date: searchParams.get("date"),
  });
  if (!parsed.success) {
    return Response.json({ error: "invalid_query" }, { status: 400 });
  }

  try {
    const slots = await getDayAvailability(parsed.data);
    return Response.json({ slots });
  } catch (err) {
    if (err instanceof AvailabilityError) {
      return Response.json({ error: err.code }, { status: 404 });
    }
    console.error("availability error", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
