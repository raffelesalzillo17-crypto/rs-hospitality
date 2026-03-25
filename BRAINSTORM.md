# RS Hospitality — Contesto per brainstorming AI

> Documento di riferimento rapido. Aggiornato: 2026-03-25.

---

## Chi siamo

**RS Hospitality** — gestione affitti brevi a Marcianise (CE), fondato da Raffaele Salzillo.
- Telefono / WhatsApp: +39 366 103 3691
- Referente in loco (Il Tulipano): Lella, +39 339 430 4429
- Dominio: rshospitality.it
- Deploy: Vercel — rs-hospitality.vercel.app
- DB: Supabase PostgreSQL (mjrdjkrqhmxvlmfpbfqf.supabase.co)

**Proprietà attive**: 1 — **Il Tulipano**, Via Clanio 60, Marcianise (CE) 81025.

---

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript strict |
| Stili | Tailwind CSS 4, stili inline, `globals.css` |
| DB | Supabase (PostgreSQL) + @supabase/supabase-js |
| Parser | cheerio (HTML), pdf-parse (PDF) |
| Automazione | Make.com (polling email ogni 15 min) |
| Deploy | Vercel |

**Palette design**: tabacco `#2C2416`, lino `#F0EBE0`, cammello `#8B7355`, sabbia `#D4C9B5`.
**Font**: Helvetica Neue. Tono calmo e preciso.

---

## Struttura progetto

```
app/
  page.tsx                    Homepage pubblica
  admin/page.tsx              RS Central (pannello gestionale)
  alloggi/il-tulipano/        Pagina dettaglio alloggio
  chi-siamo/                  Biografia fondatore
  proprietari/                Landing per proprietari
  checkin/[id]/               Form check-in ospiti + pagina benvenuto
  api/
    email-import/route.ts     Import automatico da Make.com
    import-csv/route.ts       Import storico CSV manuale
    sync-calendar/route.ts    Sync iCal Airbnb+Booking → Supabase
    calendar/route.ts         Feed iCal pubblico aggregato
  templates/whatsapp.ts       Template messaggi WhatsApp
lib/
  supabase.ts                 Client anon (Client Components)
  supabase-server.ts          Client service role (API routes)
  types.ts                    Tipi: Booking, Guest, Property, ImportLog...
  date-utils.ts               parseDate, parseAmount, MESI, MONTHS_EN
  constants.ts                TULIPANO_ID, ICAL_FEEDS, CHANNELS, STATUSES, PALETTE
supabase/migrations/          SQL migrations
```

---

## Database

### `properties`
Dati alloggio: nome, indirizzo, prezzi min/max, URL Airbnb/Booking, feed iCal, contatto onsite, WiFi, stato active.

### `guests`
Ospite: nome, telefono, email, documento (tipo/numero/luogo), nazionalità.
Colonne Alloggiati Web: `first_name`, `last_name`, `birth_date`, `birth_place`, `gender`, `citizenship`, `guest_type`.

### `bookings`
| Colonna | Tipo | Note |
|---------|------|------|
| check_in / check_out | date | |
| channel | text | `airbnb` \| `booking` \| `diretto` \| `whatsapp` |
| status | text | `pending` \| `confirmed` \| `cancelled` |
| booking_type | text | `booking` \| `block` |
| total_price | numeric | prezzo pagato |
| gross_amount | numeric | importo lordo OTA |
| ota_booking_ref | text | codice OTA |
| uid_ical | text | UID feed iCal |

### `import_logs`
Log ogni chiamata email-import: canale, mittente, azione (created/updated/skipped/error), ref, nome ospite, errore.

### Tabelle strutturate ma non ancora popolate
- `messages` — conversazioni WhatsApp/email
- `payments` — pagamenti (stripe/contanti/bonifico)
- `guest_companions` — accompagnatori da form check-in

---

## Funzionalità implementate

### 1. Sito pubblico
- **Homepage**: hero → card alloggi → chi siamo → sezione proprietari → footer
- **Il Tulipano**: hero foto, galleria, descrizione, dotazioni, prezzo/prenotazione, calendario disponibilità, mappa
- **Chi siamo**: biografia Raffaele
- **Bottone WhatsApp** fisso in basso a destra su tutte le pagine
- **SEO**: og:title, og:image configurati in `layout.tsx` (manca `metadataBase` / og:url)

### 2. Calendario pubblico
- `GET /api/calendar?property=il-tulipano` — aggrega feed iCal Airbnb + Booking, cache 1h
- Usato dalla pagina alloggio per mostrare date occupate

### 3. Check-in digitale (`/checkin/[id]`)
- Form ospite: nome, documento, accompagnatori
- Pagina `/benvenuto`: codice WiFi, info utili, referente Lella
- Integrato con tabella `guests` e `guest_companions`

### 4. RS Central (`/admin`) — pannello gestionale
**Tab Calendario**
- Griglia property × 31 giorni con barre colorate per prenotazione
- Card "Prossimo arrivo" con ospite, date, canale
- Navigazione mese ← →

**Tab Prenotazioni**
- Lista ordinata (future prima, passate al 50% opacità)
- Colonne: Ospite, Alloggio, Arrivo, Partenza, Notti, Canale, Lordo, Stato, link Check-in
- Click riga → bottom sheet con dettagli, edit importo, note, elimina
- Blocchi manuali (`booking_type = 'block'`) esclusi dalla lista, visibili in calendario (grigio scuro)

**Tab Import Log**
- Ultimi 10 import da email: data/ora, canale, ospite, ref, azione con badge colorato

**Form aggiunta prenotazione manuale** (collassabile, include `total_price`, select alloggio)
**Form blocca date** (collassabile)
**Pulsante Sincronizza** → chiama `/api/sync-calendar`
**Import CSV** → file picker, esito con contatore create/aggiornate/saltate/errori

### 5. Import automatico via email (Make.com)
- `POST /api/email-import` — autenticato con `X-RS-Secret`
- Make.com interroga la casella ogni 15 min, manda corpo email + allegati PDF
- Parser Airbnb: cheerio su HTML
- Parser Booking: pdf-parse su allegato base64
- Match engine: cerca per `ota_booking_ref` → UPDATE; fallback date → UPDATE; non trovata → INSERT
- `findOrCreateGuest()` — cerca per nome, crea se non esiste
- Risponde sempre HTTP 200 (evita retry Make)

### 6. Import CSV storico
- `POST /api/import-csv` — autenticato con `X-RS-Secret`
- Supporta Airbnb IT/EN e Booking.com EN
- Auto-rileva separatore (`;` vs `,`) e canale da header
- Gestisce date DD/MM/YYYY, ISO 8601, DD Mon YYYY (Booking EN)
- Per ogni riga: cerca per ref → UPDATE; cerca per date → UPDATE; non trovata → INSERT

### 7. Sync iCal → Supabase
- `GET /api/sync-calendar`
- Fetch dei 2 feed iCal, parse VEVENT
- Filtra rumore: eventi > 60 notti, summary `not available/blocked/reserved`
- Match per `check_in + check_out + property_id` (non sovrascrive prenotazioni con guest)
- INSERT nuovi eventi come `booking_type: "booking"`

---

## Bug aperti / cose da fare

- [ ] Parser email/PDF non testati su dati reali Airbnb e Booking.com
- [ ] Make.com: header `X-RS-Secret` da configurare nella automazione
- [ ] `/admin` senza autenticazione (chiunque conosce l'URL può accedere)
- [ ] SEO: manca `metadataBase` → og:url non generato correttamente
- [ ] `messages`, `payments`, `guest_companions` strutturate ma non usate
- [ ] Solo 1 proprietà attiva (Il Tulipano) — sistema pronto per multi-property

---

## Decisioni di progetto

- **Nessuna email pubblica**: `info@rshospitality.it` rimossa da tutto il sito, WhatsApp come canale digitale principale
- **Source of truth**: Supabase è l'unica fonte di verità — iCal e email import aggiornano il DB, l'admin legge solo da lì
- **Stili inline**: preferiti ai CSS modules per velocità di sviluppo
- **Service role in API routes**: `createServerClient()` usa la service role key (mai esposta al client)
- **HTTP 200 sempre per email-import**: evita che Make.com ritenti l'invio in loop

---

## Idee / domande aperte per il brainstorming

_(qui puoi aggiungere spunti per la sessione)_

- Come migliorare il flusso di onboarding per nuove proprietà?
- Aggiungere autenticazione admin (es. magic link Supabase Auth)?
- Dashboard analytics: occupazione %, revenue per mese, confronto canali?
- Notifiche WhatsApp automatiche a Raffaele per ogni nuova prenotazione?
- Generazione automatica report Alloggiati Web (CSV per questura)?
- Pagina proprietari: landing per acquisire nuovi proprietari da gestire?
- Sistema di messaggistica integrato (inbound WhatsApp via Twilio/Meta)?
- Pagamenti online: Stripe per caparra o saldo?
