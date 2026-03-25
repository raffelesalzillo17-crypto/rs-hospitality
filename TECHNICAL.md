# RS Hospitality — Documento Tecnico

> Aggiornato: 2026-03-25

---

## 1. Overview

RS Hospitality è una piattaforma web per la **gestione di affitti brevi** costruita per Raffaele Salzillo. Automatizza l'importazione delle prenotazioni da Airbnb e Booking.com, centralizza la gestione nel pannello **RS Central** e offre un flusso di check-in digitale per gli ospiti.

**Proprietà attive**: Il Tulipano — Via Clanio 60, Marcianise (CE) 81025
**Deploy**: Vercel — `rs-hospitality.vercel.app`
**Database**: Supabase PostgreSQL — `mjrdjkrqhmxvlmfpbfqf.supabase.co`

---

## 2. Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.7 |
| UI | React | 19.2.3 |
| Linguaggio | TypeScript (strict) | 5.x |
| Stili | Tailwind CSS | 4.x |
| Database | Supabase (PostgreSQL) | @supabase/supabase-js 2.99.3 |
| Parser HTML | Cheerio | 1.2.0 |
| Parser PDF | pdf-parse | 2.4.5 |
| Deploy | Vercel | — |

---

## 3. Struttura del Progetto

```
rs-hospitality/
├── app/
│   ├── layout.tsx                    # Root layout: metadata SEO, WhatsApp button
│   ├── page.tsx                      # Homepage pubblica
│   ├── admin/
│   │   └── page.tsx                  # RS Central — pannello admin (Client Component)
│   ├── alloggi/il-tulipano/
│   │   └── page.tsx                  # Pagina dettaglio alloggio
│   ├── chi-siamo/
│   │   └── page.tsx                  # Biografia fondatore
│   ├── proprietari/
│   │   └── page.tsx                  # Landing per proprietari (non pubblica)
│   ├── checkin/[id]/
│   │   ├── page.tsx                  # Form check-in ospiti
│   │   └── benvenuto/page.tsx        # Pagina post check-in
│   ├── api/
│   │   ├── email-import/route.ts     # Import automatico da Make.com
│   │   ├── import-csv/route.ts       # Import storico CSV
│   │   ├── sync-calendar/route.ts    # Sync iCal → Supabase
│   │   └── calendar/route.ts         # Feed iCal pubblico
│   ├── templates/whatsapp.ts         # Template messaggi WhatsApp
│   └── globals.css                   # Tailwind + stili globali
├── lib/
│   ├── supabase.ts                   # Client Supabase (anon key, per Client Components)
│   ├── supabase-server.ts            # Client Supabase (service role, per API routes)
│   ├── types.ts                      # Tipi TypeScript condivisi
│   ├── date-utils.ts                 # Utility date e importi (MESI, parseDate, etc.)
│   └── constants.ts                  # Costanti app (IDs, labels, palette, feed URLs)
├── supabase/migrations/              # SQL migrations
├── public/images/                    # Immagini statiche
├── TECHNICAL.md                      # ← questo documento
├── CHANGELOG.md                      # Storia modifiche
└── SESSIONE.md                       # Stato sessione di lavoro corrente
```

### Organizzazione `lib/`

| File | Contenuto |
|------|-----------|
| `supabase.ts` | `export const supabase` — client anon, per Client Components |
| `supabase-server.ts` | `createServerClient()` — factory con service role key, per API routes |
| `types.ts` | `Booking`, `Guest`, `Property`, `ImportLog`, `ParsedBooking`, `EmailPayload`, `VEvent` |
| `date-utils.ts` | `MESI`, `MONTHS_EN`, `parseItalianShortDate`, `parseItalianLongDate`, `parseDate`, `parseAmount` |
| `constants.ts` | `TULIPANO_ID`, `ICAL_FEEDS`, `CHANNELS`, `STATUSES`, `STATUS_STYLE`, `STATUS_LABEL`, `CHANNEL_LABEL`, `MONTH_IT`, `PALETTE`, `ICAL_NOISE_PATTERNS`, `ICAL_NOISE_LABELS` |

---

## 4. Schema Database (Supabase)

### `properties`
```sql
id               uuid PK
name             text          -- "Il Tulipano"
category         text          -- "RS Comfort"
address, city    text
price_min, price_max  numeric
airbnb_url, booking_url  text
ical_airbnb, ical_booking  text  -- URL feed iCal
contact_onsite_name  text    -- "Lella"
contact_onsite_phone text    -- "+39 339 430 4429"
wifi_name, wifi_password  text
active           boolean DEFAULT true
created_at       timestamptz
```

### `guests`
```sql
id               uuid PK
full_name        text NOT NULL
phone, email     text
document_type    text  -- "Carta d'identità" | "Passaporto" | "Patente"
document_number  text
document_place   text
nationality      text
created_at       timestamptz
```

### `bookings`
```sql
id               uuid PK
property_id      uuid FK → properties (ON DELETE SET NULL)
guest_id         uuid FK → guests (ON DELETE SET NULL)
check_in         date
check_out        date
num_guests       integer DEFAULT 1
channel          text  -- "airbnb" | "booking" | "diretto" | "whatsapp"
status           text  -- "pending" | "confirmed" | "cancelled"
booking_type     text  -- "booking" | "block"
total_price      numeric
gross_amount     numeric  -- importo lordo OTA
ota_booking_ref  text     -- codice prenotazione OTA
uid_ical         text     -- UID da feed iCal
notes            text
created_at       timestamptz
```

### `import_logs`
```sql
id               uuid PK
created_at       timestamptz DEFAULT now()
channel          text  -- "airbnb" | "booking"
from_email       text
subject          text
action           text  -- "created" | "updated" | "skipped" | "error"
booking_ref      text
guest_name       text
error_message    text
```

### Tabelle ausiliarie (strutturate, non ancora popolate)
- **`messages`** — conversazioni whatsapp/email inbound/outbound
- **`payments`** — pagamenti con metodo (stripe/contanti/bonifico) e stato
- **`guest_companions`** — accompagnatori da form check-in

---

## 5. API Routes

### `POST /api/email-import`

Endpoint chiamato da **Make.com** ogni 15 minuti con email di conferma prenotazione.

**Auth**: Header `X-RS-Secret` = env `EMAIL_IMPORT_SECRET`

**Body**:
```json
{
  "from": "automated@airbnb.com",
  "subject": "Nuova prenotazione confermata",
  "bodyHtml": "<html>...",
  "bodyText": "...",
  "attachments": [{ "filename": "booking.pdf", "content": "<base64>" }]
}
```

**Flusso**:
1. Determina canale da `from` (airbnb.com / booking.com) o presenza PDF allegato
2. Parser Airbnb: cheerio su HTML → estrae codice conferma, nome ospite, date (mesi IT), importo
3. Parser Booking: pdf-parse su allegato base64 → regex su testo estratto
4. Match engine:
   - Cerca per `ota_booking_ref` → UPDATE
   - Fallback: cerca per `check_in + check_out` → UPDATE
   - Non trovata → INSERT (con property attiva)
5. `findOrCreateGuest()` — cerca per nome esatto, crea se non esiste
6. Logga su `import_logs`, risponde sempre **HTTP 200** (evita retry Make)

---

### `POST /api/import-csv`

Import manuale di storico prenotazioni da file CSV (Airbnb IT/EN, Booking.com EN).

**Auth**: Header `X-RS-Secret`

**Body**: `{ "csv": "<contenuto CSV come stringa>" }`

**Flusso**:
1. Auto-rileva separatore (`;` vs `,`)
2. Mappa colonne flessibile (case-insensitive, parziale match)
3. Rileva canale da nome header: `reservation number` → `booking`, `numero di riferimento` → `airbnb`
4. Per ogni riga: cerca prenotazione per ref poi per date
   - Trovata → UPDATE (ref, gross_amount, guest_name)
   - Non trovata → INSERT prenotazione storica

**Response**: `{ created, updated, skipped, errors[] }`

---

### `GET /api/sync-calendar`

Sincronizza i feed iCal di Airbnb e Booking.com su Supabase.

**Flusso**:
1. Fetch dei 2 feed iCal (URL in `lib/constants.ts`)
2. Parse VEVENT: UID, DTSTART, DTEND, SUMMARY
3. Filtra rumore: eventi > 60 notti, summary `not available/closed/blocked/reserved`, vuoto + > 30 notti
4. Per ogni evento valido:
   - Match per `check_in + check_out + property_id` (esclude blocchi manuali)
   - Se trovato con `guest_id` → skip (non sovrascrivere dati da email import)
   - Fallback: match per `uid_ical`
   - Non trovato → INSERT con `booking_type: "booking"`

**Response**: `{ sincronizzati, skippati, errori[] }`

---

### `GET /api/calendar?property=il-tulipano`

Feed iCal pubblico per plugin di prenotazione esterni (es. Lodgify, Smoobu).

Legge gli URL iCal da `properties.ical_airbnb` e `properties.ical_booking`, aggrega gli eventi e restituisce JSON `{ events: [{ start, end }] }`.

Cache: `s-maxage=3600, stale-while-revalidate=86400`

---

## 6. Pannello Admin (RS Central) — `/admin`

Client Component React con 3 tab.

### Tab Calendario
- Griglia **property × 31 giorni** del mese corrente
- Barre colorate per ogni prenotazione:
  - `#2d6a4f` verde — confermata con ospite identificato
  - `#c9963a` marrone — in attesa
  - `#aaa` grigio — proveniente da iCal senza guest (solo sync)
  - `#555` grigio scuro — blocco manuale (`booking_type = "block"`)
- Card **Prossimo arrivo** con ospite, date, notti, canale
- Navigazione mesi (`< >`)

### Tab Prenotazioni
- Tabella completa (esclude blocchi manuali)
- Colonne: Ospite, Alloggio, Arrivo, Partenza, Notti, Canale, Lordo, Stato, Check-in
- Click su riga → bottom sheet con dettaglio
- Edit inline importo pagamento
- Bottone "Link" → copia URL `/checkin/[id]` per l'ospite

### Tab Import Log
- Ultimi 10 import email con badge azione colorati
- Sezione **Import storico CSV**: file picker `.csv` → POST `/api/import-csv`
- Bottone **Sincronizza** → GET `/api/sync-calendar`

### Form Aggiungi prenotazione
- Collassabile, crea prenotazione con guest manuale

### Form Blocca date
- Crea riga con `booking_type = "block"` (visibile solo nel calendario, non in lista prenotazioni)

---

## 7. Check-in Ospiti — `/checkin/[id]`

Form compilabile dall'ospite prima dell'arrivo. URL generato dall'admin (bottone "Link").

**Dati raccolti**:
- Ospite principale: nome, cognome, nazionalità, luogo/data nascita, genere, documento
- Tipo: ospite singolo / capo famiglia / capogruppo
- Accompagnatori aggiuntivi (schema identico, dynamic add)

Dati salvati in Supabase, poi disponibili per export (futuro: Alloggiati Web per questura).

---

## 8. Sito Pubblico

### `/` — Homepage
- Hero + CTA prenotazione
- Showcase alloggio Il Tulipano
- Social proof: 9.2/10 Booking, 4.9★ Airbnb
- Schema.org `LocalBusiness` JSON-LD

### `/alloggi/il-tulipano`
- Gallery 8 foto
- Dotazioni (Wi-Fi, cucina, TV, bagno esclusivo, etc.)
- Prezzi: €55–80/notte
- Link diretti Airbnb e Booking
- Schema.org `LodgingBusiness`

### `/chi-siamo`
- Biografia Raffaele Salzillo

---

## 9. Variabili d'Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://mjrdjkrqhmxvlmfpbfqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...    # lato client (sicura da esporre)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...        # lato server (da aggiungere su Vercel)

# API security
EMAIL_IMPORT_SECRET=rshospitality2026
```

> **Attenzione**: `SUPABASE_SERVICE_ROLE_KEY` deve essere impostata su Vercel Dashboard. Senza di essa le API routes usano la anon key in fallback (funziona se RLS non è attivo).

---

## 10. Integrazioni Esterne

### Make.com (automazione email)
- Trigger: nuova email su `import.rshospitality@gmail.com`
- HTTP Module → `POST /api/email-import`
- Header richiesto: `X-RS-Secret: rshospitality2026`
- Frequenza: ogni 15 minuti

### Feed iCal OTA (definiti in `lib/constants.ts`)
- Airbnb: `airbnb.it/calendar/ical/1151100346729188269.ics?t=...`
- Booking.com: `ical.booking.com/v1/export/t/28033739-...ics`

---

## 11. Flusso Dati — Fonte di Verità

```
Make.com (email)          →  POST /api/email-import  ─┐
Admin CSV file picker     →  POST /api/import-csv    ─┤──→ bookings (Supabase)
Admin "Sincronizza"       →  GET  /api/sync-calendar ─┘

Priorità match (in ordine):
  1. ota_booking_ref        (email import / CSV)
  2. check_in + check_out   (sync iCal + fallback)
  3. uid_ical               (sync iCal fallback)

Gerarchia dati:
  email-import > CSV > iCal sync
  (se guest_id è già presente → sync iCal non sovrascrive)
```

---

## 12. Bug Aperti (al 2026-03-25)

| # | Descrizione | Priorità |
|---|-------------|---------|
| 1 | CSV Airbnb IT: fix `checkout`/`nome dell` deployato ma non testato end-to-end | Alta |
| 2 | Parser email Airbnb: testato solo su payload mock, non su HTML reale da Make | Alta |
| 3 | Parser Booking PDF: non testato con PDF reale da Pulse | Alta |
| 4 | Vercel env `EMAIL_IMPORT_SECRET`: verificare sia impostata (401 altrimenti) | Alta |
| 5 | Make.com header `X-RS-Secret`: da aggiungere nel modulo HTTP di Make | Alta |
| 6 | Booking `91430cdd` ha `guest_id = null`: re-inviare email o ri-eseguire curl | Media |
| 7 | `/admin` senza autenticazione: security risk (implementare prima del go-live) | Media |

---

## 13. Prossimi Step

### Immediati (test e configurazione)
1. Aggiungere `X-RS-Secret: rshospitality2026` nel modulo HTTP di Make.com
2. Verificare env `EMAIL_IMPORT_SECRET` su Vercel Dashboard
3. Testare flusso end-to-end con email reale Airbnb inoltrata a Make
4. Testare con PDF Booking.com reale
5. Caricare CSV storici per popolare `guest_name` + `gross_amount` sulle prenotazioni esistenti

### Feature future
- **Tab Finanze** in RS Central: totale lordo/mese, commissioni OTA stimate, grafico entrate
- **Modale dettaglio** prenotazione: `gross_amount` + `ota_booking_ref` visibili
- **Notifica WhatsApp** al check-in (Make + Twilio)
- **Multi-property**: sistema già strutturato con `property_id`, pronto per espansione
- **Alloggiati Web export**: CSV da `/checkin/[id]` per la questura

---

## 14. Contatti Operativi

| Ruolo | Nome | Contatto |
|-------|------|---------|
| Proprietario / Gestore | Raffaele Salzillo | +39 366 103 3691 |
| Assistenza on-site | Lella | +39 339 430 4429 |
