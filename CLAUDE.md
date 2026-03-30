# RS Hospitality — Contesto progetto

## Chi siamo
RS Hospitality è una società di gestione affitti brevi fondata da Raffaele Salzillo, Marcianise (CE).
- WhatsApp: +39 366 103 3691
- Referente Il Tulipano: Lella, +39 339 430 4429
- Dominio: rshospitality.it
- Repo: github.com/raffelesalzillo17-crypto/rs-hospitality
- Deploy: Vercel — rs-hospitality.vercel.app
- DB: Supabase (mjrdjkrqhmxvlmfpbfqf.supabase.co)

## Stack
Next.js 16, TypeScript strict, Tailwind CSS, Supabase PostgreSQL, Vercel

## Palette
Tabacco #2C2416 · Lino #F0EBE0 · Cammello #8B7355 · Sabbia #D4C9B5
Font: Helvetica Neue. Tono: calmo, preciso, mai emoji.

## Alloggi attivi
- Il Tulipano — Via Clanio 60, Marcianise. is_private = false.
- Stanza Rosa — privata, contanti. is_private = true. Mai visibile sul sito pubblico.

## Logica finanziaria
- Airbnb: commissione 18.91%, cedolare 21%
- Booking: commissione 20.15%, cedolare 21%
- Diretto: commissione 0%, cedolare 21%
- No Tax: commissione 0%, cedolare 0%
- Pulizie: €20 fisso per prenotazione
- Utile reale = netto_ricevuto - pulizie

## Struttura URL
- / → sito pubblico
- /admin → dashboard privata (auth Supabase)
- /admin/login → pagina login
- /checkin/[id] → mini-app ospite
- /api/email-import → import automatico da Make.com
- /api/sync-calendar → sync iCal → Supabase

## Regole di sviluppo
1. Codice in italiano — variabili, funzioni, commenti
2. Mai <img> nudo — sempre next/image
3. Mobile-first su tutto /admin
4. Ogni modifica aggiorna CHANGELOG.md
5. Mai lavorare su main — sempre branch dedicato
6. Mai cancellare dati reali dal DB senza conferma
7. La Stanza Rosa non appare mai sul sito pubblico (filtro is_private)
8. Test automatici su funzioni DB critiche e route API

## Agenti disponibili
Leggi .claude/agents/ per i ruoli di ogni agente.
