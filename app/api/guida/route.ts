import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const prompts: Record<string, string> = {
  mangiare:
    "Suggerisci 5 ristoranti o locali reali vicino a Marcianise (CE), con nome, tipo di cucina e distanza approssimativa in minuti a piedi o in auto. " +
    "Formato: **Nome** — Tipo cucina — distanza.",
  luoghi:
    "Suggerisci 5 luoghi da visitare vicino a Marcianise (CE) entro 30 minuti. Includi la Reggia di Caserta. " +
    "Formato: **Nome** — descrizione in una frase — distanza.",
  muoversi:
    "Dai info pratiche per muoversi da Marcianise (CE): stazione ferroviaria più vicina, taxi locali, autostrada più vicina, parcheggi. " +
    "Formato lista: **voce** — dettaglio.",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section    = searchParams.get("section");
  const propertyId = searchParams.get("property_id");

  if (!section || !prompts[section]) {
    return NextResponse.json({ error: "Sezione non valida" }, { status: 400 });
  }

  let propertyInfo = "Marcianise (CE)";
  if (propertyId) {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("properties")
      .select("name, address, city")
      .eq("id", propertyId)
      .single();
    if (data) {
      propertyInfo = `${data.name} — ${data.address ?? ""}, ${data.city ?? "Marcianise"} (CE)`;
    }
  }

  const message = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system:
      "Sei una guida locale esperta di Marcianise (CE) e dintorni. " +
      "Rispondi in italiano. Dai informazioni accurate e pratiche. " +
      "Non inventare indirizzi o numeri di telefono specifici. Sii conciso e diretto. " +
      `La struttura ricettiva si trova a: ${propertyInfo}.`,
    messages: [{ role: "user", content: prompts[section] }],
  });

  const content =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ content });
}
