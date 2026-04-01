import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Carica contesto alloggio da Supabase ───────────────────────────────────────
async function getContesto(bookingId: string) {
  const supabase = createServerClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("check_in, check_out, property_id, guests(full_name)")
    .eq("id", bookingId)
    .single();

  if (!booking?.property_id) return null;

  const { data: property } = await supabase
    .from("properties")
    .select("name, address, city, checkin_time, checkout_time, wifi_name, wifi_password, istruzioni_accesso, contact_onsite_name, contact_onsite_phone")
    .eq("id", booking.property_id)
    .single();

  if (!property) return null;

  function fmt(d: string) {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  return { booking, property, fmt };
}

// ── POST /api/chat ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages, bookingId, language } = await req.json();

  if (!bookingId || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  const contesto = await getContesto(bookingId);

  // System prompt
  const propertyName = contesto?.property.name ?? "RS Hospitality";
  const address      = [contesto?.property.address, contesto?.property.city].filter(Boolean).join(", ") || "Marcianise (CE)";
  const checkin_date = contesto?.booking.check_in ? contesto.fmt(contesto.booking.check_in) : "—";
  const checkout_date = contesto?.booking.check_out ? contesto.fmt(contesto.booking.check_out) : "—";
  const checkin_time  = contesto?.property.checkin_time  ?? "15:00";
  const checkout_time = contesto?.property.checkout_time ?? "11:00";
  const wifi_nome     = contesto?.property.wifi_name     ?? "non disponibile";
  const wifi_pass     = contesto?.property.wifi_password ?? "non disponibile";
  const istruzioni    = contesto?.property.istruzioni_accesso ?? "Le istruzioni verranno inviate prima del check-in.";
  const ref_nome      = contesto?.property.contact_onsite_name  ?? "il referente";
  const ref_tel       = contesto?.property.contact_onsite_phone ?? "+39 366 103 3691";

  const systemPrompt = `Sei l'assistente digitale di RS Hospitality per l'alloggio "${propertyName}".
Rispondi SEMPRE nella lingua dell'ospite (lingua browser: ${language ?? "it"}).
Sei cordiale ma discreto, mai eccessivo. Risposte brevi e concrete.
Non usare emoji nel testo.

Dettagli dell'alloggio:
- Indirizzo: ${address}
- Check-in: ${checkin_date} dalle ${checkin_time}
- Check-out: ${checkout_date} entro le ${checkout_time}
- Wi-Fi: rete "${wifi_nome}", password "${wifi_pass}"
- Istruzioni accesso: ${istruzioni}
- Referente locale: ${ref_nome}, tel. ${ref_tel}
- RS Hospitality (Raffaele): +39 366 103 3691

Per domande su ristoranti, attrazioni e trasporti a Marcianise e Caserta, aiuta l'ospite con informazioni generali.
Non inventare informazioni sull'alloggio che non hai.`;

  // Filtra solo messaggi user/assistant (ignora system dal client)
  const msgPerAPI = (messages as { role: string; content: string }[])
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Streaming SSE
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const stream = await client.messages.stream({
          model:      "claude-haiku-4-5-20251001",
          max_tokens: 512,
          system:     systemPrompt,
          messages:   msgPerAPI,
        });

        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Errore";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
