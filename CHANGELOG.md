# Changelog

Tutte le modifiche rilevanti al progetto RS Hospitality sono documentate in questo file.

---

## [Unreleased] — 2026-03-31 (aggiornamento 39 — DB: canale Diretto → No Tax per Marzo 2026)

### Modificati
- **Database** (via Supabase MCP): `UPDATE bookings SET channel = 'No Tax' WHERE channel = 'Diretto' AND check_in BETWEEN '2026-03-01' AND '2026-03-31'`
  - 2 prenotazioni aggiornate: 12 mar (€45) e 19 mar (€100)
  - Marzo: nessuna prenotazione "Diretto" rimasta — tutti i canali sono Airbnb / Booking / No Tax
- **Regola definitiva canali RS**: Airbnb (comm 18.91%, ced 21%), Booking (comm 20.15%, ced 21%), No Tax (comm 0%, ced 0%, utile = total_price − €20) — "Diretto" rimosso come canale operativo
- Verifica Marzo post-update: lordo fiscale €844 (Airbnb €543 + Booking €301), utile reale totale €558.43 ✓

---

## [Unreleased] — 2026-03-31 (aggiornamento 38 — No Tax esclusa dal lordo fiscale nel Report)

### Modificati
- `app/admin/page.tsx`:
  - **`calcFin`**: branch speciale per canale "No Tax" — `commissione = 0`, `cedolare = 0`, `netto_ricevuto = total_price`, `utile = total_price − €20 pulizie`; usa `total_price` (non `gross_amount`) come base di calcolo
  - **`sumFin`**: il totale `lordo` non accumula le prenotazioni No Tax (`is_no_tax: true`); l'utile reale le include normalmente
  - Verifica Marzo: lordo fiscale atteso €1.039 (senza No Tax), utile reale totale €558.43 (con No Tax)

---

## [Unreleased] — 2026-03-31 (aggiornamento 37 — 4 fix UX/design /admin)

### Fix
- **FIX 1 — Header**: rimosso label "RS Hospitality" sopra "RS Central"; titolo unico bold su mobile e desktop
- **FIX 2 — WhatsApp button**: estratto in `app/components/WhatsAppButton.tsx` con controllo `usePathname` — non appare su `/admin`
- **FIX 3 — "Nessun importo"**: rimosso dal card mobile prenotazioni; se `gross_amount` è null non mostra nulla
- **FIX 4 — Desktop moderno**:
  - Tab bar: uppercase tracking-widest 11px, underline tabacco 2px su tab attivo, niente sfondo colorato
  - Bottoni header (Sync/Aggiorna/Esci): più piccoli (34px), outline style, Sync senza fill tabacco
  - Report — card utile: sfondo tabacco (non verde), valore in `#C9A96E`
  - Report — tutte le colonne Utile: verde `#1a4d1a` sostituito con `c.tabacco`; rosso `#a03030` mantenuto per valori negativi

---

## [Unreleased] — 2026-03-31 (aggiornamento 36 — cedolare lordo, form in cima, blocca date, copia link mobile)

### Modificati
- `app/admin/page.tsx`:
  - **Cedolare sul lordo**: calcolo allineato al Google Sheet (`cedolare = lordo × aliquota` invece di `netto_dopo_comm × aliquota`)
  - **Form prenotazione + Blocca date**: spostati in cima alla tab Prenotazioni (prima erano in fondo alla pagina)
  - **Copia link check-in**: bottone aggiunto nel card mobile (riga date), non più solo in tabella desktop
  - **Scroll lock**: `document.body.style.overflow = "hidden"` quando il modale dettaglio prenotazione è aperto
  - **Tabella desktop**: semplificato bottone "Copia link" (rimosso stato "Completato" — il link è sempre disponibile)
- `middleware.ts`: auth commentata — `/admin` accessibile senza login (intenzionale)

---

## [Unreleased] — 2026-03-30 (aggiornamento 35 — fix /admin: 4 bug)

### Fix
- **Fix 1 — "Prossimo arrivo" data passata**: `nextArrival` ora filtra `booking_type !== "block"` oltre a `check_in >= oggi`; i blocchi non comparivano mai come prossimo arrivo ma potevano skippare prenotazioni reali
- **Fix 2 — Calendario mobile**: sostituita la vista "prossimi 30 giorni" con lista prenotazioni del mese corrente (sincronizzata al navigatore mese); card con nome ospite/canale, alloggio, date "12 apr → 15 apr (3 notti)", badge canale, badge "In corso" per soggiorni già avviati
- **Fix 3 — Crash CSV upload**: aggiunto strip del BOM UTF-8 (`\uFEFF`) prima del parse; tutti gli accessi a `csvResult.errors` ora usano optional chaining (`?.length ?? 0`) per evitare TypeError su array null
- **Fix 4 — Duplicati calendario**: `fetchBookings` ora deduplica per `uid_ical`: per ogni `uid_ical` non null viene tenuto l'ultimo record nell'array (le prenotazioni senza `uid_ical` vengono sempre mantenute)

---

## [Unreleased] — 2026-03-30 (aggiornamento 34 — /admin mobile-first)

### Modificati
- `app/admin/page.tsx` — layout /admin completamente mobile-first:
  - **Tab Prenotazioni**: card verticali su mobile (nome ospite + badge canale, date + alloggio, lordo + utile reale); tabella desktop invariata
  - **Tab Calendario**: lista verticale prossimi 30 giorni su mobile (solo giorni occupati); griglia orizzontale visibile solo su desktop (md:)
    - Fix: ora include anche prenotazioni già in corso (check_in < oggi), con badge "In corso" visivo
  - **Tab Report**: totali lordo/utile grandi in cima su mobile; lista prenotazioni mese come card compatte sotto
  - **Navigazione**: tab bar nativa in fondo allo schermo su mobile (Calendario / Prenotazioni / Report); tab bar in cima solo su desktop
  - Tutti gli elementi interattivi ≥ 44px di altezza — usabile con una mano

---

## [Unreleased] — 2026-03-30 (aggiornamento 33 — pulizia progetto)

### Eliminati
- `public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` — boilerplate Next.js inutilizzati
- `supabase/.temp/` — cache CLI rigenerata automaticamente
- `run_migration.ps1` — sostituito dal MCP Supabase
- `SESSIONE.md` — note di sessione obsolete
- `app/proprietari/` — pagina non collegata e non raggiungibile
- `app/templates/whatsapp.ts` — file non importato da nessuna parte

### Modificati
- `README.md` — riscritto con contesto RS Hospitality (stack, alloggi, env vars, struttura, avvio locale)

### Nota
- `app/api/calendar/route.ts` — mantenuto: usato da `alloggi/il-tulipano/page.tsx`

---

## [Unreleased] — 2026-03-30 (aggiornamento 32 — CLAUDE.md e agenti AI)

### `CLAUDE.md` (nuovo)
- Contesto progetto completo caricato automaticamente ad ogni sessione Claude Code
- Stack, palette, alloggi, logica finanziaria, struttura URL, regole di sviluppo

### `.claude/agents/` (nuovi)
- `virgil.md` — agente frontend e design
- `atlas.md` — agente database e API
- `hermes.md` — agente comunicazioni
- `lex.md` — agente compliance e fiscale
- `aria.md` — agente automazioni

---

## [Unreleased] — 2026-03-30 (aggiornamento 31 — Stanza Rosa come seconda property)

### `supabase/migrations/20260330_stanza_rosa.sql`
- Aggiunge colonna `is_private boolean DEFAULT false` alla tabella `properties`
- Inserisce **Stanza Rosa** con `is_private = true`

### `lib/types.ts`
- `Property`: aggiunto campo opzionale `is_private?: boolean`

### `app/admin/page.tsx`
- Fetch properties: aggiunto `is_private` alla select query
- Form aggiunta prenotazione: quando si seleziona un alloggio con `is_private = true`, il canale si auto-imposta a **No Tax** (cedolare 0%, nessuna commissione OTA)
- Calendario e Report già multi-property: mostrano Il Tulipano e Stanza Rosa come righe separate

### `app/api/calendar/route.ts`
- Aggiunto filtro `.eq('is_private', false)`: le property private (Stanza Rosa) sono escluse dal calendario pubblico

---

## [Unreleased] — 2026-03-25 (aggiornamento 30 — Canale No Tax + cedolare per canale)

### `lib/constants.ts`
- `CHANNELS`: `'WhatsApp'` → `'No Tax'`
- `CHANNEL_LABEL`: `whatsapp: 'WhatsApp'` → `no_tax: 'No Tax'`
- `OTA_COMMISSION`: `whatsapp` → `no_tax` (commissione 0%)
- `CEDOLARE_BY_CHANNEL` (nuovo): cedolare 21% per Airbnb/Booking/Diretto, **0% per No Tax**
- `CEDOLARE_RATE` mantenuto come fallback di default

### `app/admin/page.tsx`
- `calcFin()`: usa `CEDOLARE_BY_CHANNEL[channel]` al posto del rate fisso — No Tax paga 0% di cedolare; restituisce anche `cedRate` per il display
- Bottom sheet: la riga cedolare mostra la percentuale reale ("Cedolare 0%" per No Tax, "Cedolare 21%" per gli altri)
- Form aggiunta prenotazione: select canale ora mostra `Airbnb / Booking / Diretto / No Tax`
- Tab Report: rimosso pulsante "Esporta CSV" e relativa funzione `exportCsv`

---

## [Unreleased] — 2026-03-25 (aggiornamento 29 — Logica finanziaria dashboard)

### `lib/constants.ts`
- Aggiunte costanti finanziarie: `OTA_COMMISSION` (Airbnb 18.91%, Booking 20.15%, Diretto/WhatsApp 0%), `CEDOLARE_RATE` (21%), `COSTI_PULIZIE` (€20 fisso)

### `app/admin/page.tsx`
- `calcFin(b)` — calcola per ogni prenotazione: commissione OTA, netto OTA, cedolare 21%, netto ricevuto, costi pulizie, utile reale
- `eur(n)` — formattazione importi con simbolo € e 2 decimali
- **Tab Prenotazioni**: aggiunte 6 colonne nella tabella — Comm. OTA, Netto OTA, Cedolare, Netto Ric., Pulizie, Utile (detrazioni in rosso, utile in verde/rosso grassetto)
- **Bottom sheet**: sezione "Riepilogo economico" con tabella Lordo → Comm. → Netto OTA → Cedolare → Netto Ric. → Pulizie → **Utile reale** in grassetto
- **Tab Report** (nuova): selettore mese ← →, tabella riepilogo per property + riga totale generale + dettaglio prenotazioni cliccabili; pulsante **Esporta CSV** scarica file UTF-8 BOM apribile in Excel e Google Sheets

---

## [Unreleased] — 2026-03-25 (aggiornamento 28 — Autenticazione Supabase Auth su /admin)

### Nuovi file
- `middleware.ts` — Next.js middleware che protegge tutte le route `/admin/*`; chi non è autenticato viene rediretto a `/admin/login`; chi è già autenticato viene rediretto da `/admin/login` verso `/admin`
- `lib/supabase-browser.ts` — factory `createSupabaseBrowser()` con `createBrowserClient` da `@supabase/ssr`; gestisce la sessione via cookie in modo coerente con il middleware
- `app/admin/login/page.tsx` — pagina login con form email + password; stile RS (palette tabacco/lino, font Helvetica Neue)

### File aggiornati
- `app/admin/page.tsx` — usa `createSupabaseBrowser()` al posto di `createClient` diretto; aggiunge `useRouter`; aggiunge pulsante "Esci" nell'header (chiama `supabase.auth.signOut()` + redirect a `/admin/login`)

### Dipendenze
- Aggiunto `@supabase/ssr` per la gestione sessione cookie-based (SSR pattern)

### Note operative
- Creare l'utente `raffaele.salzillo02@gmail.com` in Supabase Auth Dashboard (Authentication → Users → Invite/Add user)
- Nessuna variabile d'ambiente aggiuntiva richiesta (usa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` già presenti)

---

## [Unreleased] — 2026-03-25 (aggiornamento 27 — Riorganizzazione lib/ + documento tecnico)

### Nuovi file
- `lib/supabase-server.ts` — factory `createServerClient()` per API routes (service role key)
- `lib/types.ts` — tipi TypeScript condivisi: `Booking`, `Guest`, `Property`, `ImportLog`, `ParsedBooking`, `EmailPayload`, `VEvent`
- `lib/date-utils.ts` — utility condivise: `MESI`, `MONTHS_EN`, `parseItalianShortDate`, `parseItalianLongDate`, `parseDate`, `parseAmount` (unificato)
- `lib/constants.ts` — costanti condivise: `TULIPANO_ID`, `ICAL_FEEDS`, `CHANNELS`, `STATUSES`, `STATUS_STYLE`, `STATUS_LABEL`, `CHANNEL_LABEL`, `MONTH_IT`, `PALETTE`, `ICAL_NOISE_PATTERNS`, `ICAL_NOISE_LABELS`
- `TECHNICAL.md` — documento tecnico riassuntivo completo

### File aggiornati
- `app/api/email-import/route.ts` — importa da `lib/supabase-server`, `lib/date-utils`, `lib/types`
- `app/api/import-csv/route.ts` — importa da `lib/supabase-server`, `lib/date-utils`
- `app/api/sync-calendar/route.ts` — importa da `lib/supabase-server`, `lib/constants`, `lib/types`
- `app/api/calendar/route.ts` — importa da `lib/supabase-server`
- `app/admin/page.tsx` — importa costanti e tipi da `lib/`; rimossa duplicazione di ~60 righe

---

## [Unreleased] — 2026-03-20 (aggiornamento 26 — Import CSV Airbnb IT)

### `/api/import-csv/route.ts`
- iCO: aggiunto `checkout` (senza trattino) per export Airbnb IT
- iName: match su `nome dell` (copre "Nome dellospite" con apostrofo mancante per encoding)
- iRef: aggiunto `numero di riferimento` (Airbnb IT)
- iAmount: `netto` come prima priorità (Airbnb IT, è il netto host)
- Channel detection: `tipologia` o `netto` negli headers → `airbnb`

---

## [Unreleased] — 2026-03-20 (aggiornamento 25 — Import CSV: INSERT prenotazioni storiche)

### `/api/import-csv/route.ts`
- Prenotazione non trovata → INSERT invece di skip (era il caso delle 6 prenotazioni storiche feb 2026)
- Rilevamento automatico canale dal nome header: `reservation number` → `booking`, `confirmation code` → `airbnb`
- Property attiva caricata una sola volta fuori dal loop
- Risposta include `created` (nuove) + `updated` (esistenti aggiornate)

### `app/admin/page.tsx`
- Box risultato CSV mostra separatamente `N create` e `N aggiornate`

---

## [Unreleased] — 2026-03-20 (aggiornamento 24 — Import CSV Booking.com)

### `/api/import-csv/route.ts`
- Aggiunte colonne Booking.com: `arrival`, `departure`, `reservation number`, `booker name`, `original amount`, `final amount`
- `parseDate` gestisce ora anche formato `DD Mon YYYY` (es. "25 Mar 2026") usato da Booking.com export EN

---

## [Unreleased] — 2026-03-20 (aggiornamento 23 — Fix crash import CSV)

### `/api/import-csv/route.ts`
- JSON body parsato in try/catch con messaggio leggibile invece di crash
- Errore 400 restituisce sempre `{ error: "..." }` con dettagli: righe rilevate, headers, separatore

### `app/admin/page.tsx` — `handleCsvImport`
- Wrappato in try/catch: nessun crash della pagina in caso di errore
- Se `res.ok === false` → legge `data.error` e lo mostra nel box risultato
- Eccezioni di rete → messaggio di errore nel box risultato
- `fetchBookings` chiamato solo in caso di successo
- `e.target.value = ""` spostato in `finally` per garantire reset sempre

---

## [Unreleased] — 2026-03-20 (aggiornamento 22 — Source of truth calendario RS Central)

### Fix 2 — `app/api/sync-calendar/route.ts`
- Filtro rumore iCal: scarta eventi > 60 notti, summary noise (not available / closed / blocked / reserved), summary vuoto + durata > 30n
- Match primario per `check_in + check_out + property_id` (non più solo uid_ical)
- Se trovato con `guest_id` → skip (prenotazione già arricchita da email import, non toccare)
- Se trovato senza guest → aggiorna `uid_ical` se mancante, conta come skippato
- Canali normalizzati lowercase (`airbnb`, `booking`)
- Nuove prenotazioni inserite con `booking_type: 'booking'`

### Fix 3 — Admin legge solo da Supabase
- Già verificato: il calendario /admin legge esclusivamente da `bookings` via Supabase
- Il pulsante "Sincronizza" chiama `/api/sync-calendar` → upsert Supabase → UI aggiorna da DB

### Fix 4 — `booking_type` in bookings
- Migrazione: `supabase/migrations/20260320_booking_type.sql` — `ALTER TABLE bookings ADD COLUMN booking_type text DEFAULT 'booking'`
- Blocchi manuali (`booking_type = 'block'`) appaiono grigio scuro nel calendario con label "Blocco"
- Form "Blocca date" collassabile in RS Central (sotto il form prenotazione manuale)
- Blocchi esclusi da tab Prenotazioni e da `sortedBookings`

### Fix 5 — UI lista prenotazioni
- Ospite senza nome → "Ospite non identificato" in grigio italico
- Nuova colonna "Lordo" con `gross_amount` (€ XX o "—")
- Filtro `booking_type !== 'block'` su `sortedBookings`

### Fix 6 — Import storico CSV
- Nuova route `/api/import-csv`: parser CSV flessibile (IT/EN, `,` e `;`, date DD/MM/YYYY e ISO)
- Sezione "Import storico CSV" nel tab Import Log: file picker `.csv`, esito con contatore aggiornate/saltate/errori
- Aggiorna `guest_name` (crea guest se mancante), `ota_booking_ref`, `gross_amount` sulle prenotazioni esistenti

### Database
- Esegui manualmente in Supabase SQL Editor: `supabase/migrations/20260320_booking_type.sql`

---

## [Unreleased] — 2026-03-20 (aggiornamento 21 — Import automatico prenotazioni via email)

### `/api/email-import/route.ts` — Nuovo endpoint
- Autenticazione tramite header `X-RS-Secret` (var `EMAIL_IMPORT_SECRET`)
- Routing per mittente: `airbnb.com` → parser HTML, `booking.com` / PDF allegato → parser PDF
- **Parser Airbnb** (`pdf-parse` + `cheerio`): estrae nome ospite, date (lookup mesi italiani con gestione anno), importo lordo, codice conferma
- **Parser Booking**: decodifica PDF base64 dall'allegato, regex su testo estratto (num. prenotazione, ospite, date, prezzo)
- **Match engine**: cerca per `ota_booking_ref` → UPDATE; fallback su `check_in + check_out` → UPDATE con ref; INSERT nuova prenotazione con guest e property attiva
- Logging ogni chiamata su tabella `import_logs`; risponde sempre 200 per evitare retry Make

### Database — `supabase/migrations/20260320_email_import.sql`
- `ALTER TABLE bookings ADD COLUMN ota_booking_ref text`
- `ALTER TABLE bookings ADD COLUMN gross_amount numeric`
- `CREATE TABLE import_logs` (id, created_at, channel, from_email, subject, action, booking_ref, guest_name, error_message)

### RS Central — Tab "Import Log"
- Terza tab nell'header con refresh on-click
- Tabella ultimi 10 import: data/ora, canale, ospite, ref OTA, azione con badge colorato (verde=created, giallo=updated, grigio=skipped, rosso=error), messaggio errore

### Infrastruttura
- Aggiunte dipendenze: `pdf-parse`, `cheerio`, `@types/pdf-parse`
- `.env.local`: aggiunta `EMAIL_IMPORT_SECRET=rshospitality2026`

---

## [Unreleased] — 2026-03-20 (aggiornamento 20 — RS Central: calendario, lista, modale)

### Admin (`app/admin/page.tsx`) — Riscrittura completa
- **Header "RS Central"**: titolo, pulsanti Sincronizza (→ `/api/sync-calendar`) e Aggiorna
- **Tab Calendario**: card "Prossimo arrivo" (sfondo tabacco), navigazione mese ← →, griglia property-riga × giorno-colonna con barre colorate per prenotazione (verde=confirmed, giallo=pending, grigio=blocco iCal); click su barra apre modale
- **Tab Prenotazioni**: lista ordinata (future prima, passate al 50% opacità), modifica prezzo inline al click, pulsante link check-in, click riga apre modale
- **Modale (bottom sheet)**: dettagli ospite, griglia info prenotazione, badge stato, editor prezzo, note, copia link check-in, elimina con conferma
- **Form collassabile**: toggle +/−, include campo `total_price`, select alloggio dinamico da Supabase

---

## [Unreleased] — 2026-03-20 (aggiornamento 19 — check-in allineato Alloggiati Web)

### Database
- **`guests`**: 8 nuove colonne Alloggiati Web — `first_name`, `last_name`, `birth_date`, `birth_place`, `gender`, `document_place`, `citizenship`, `guest_type`
- **Nuova tabella `guest_companions`**: familiari e componenti gruppo (FK → guests + bookings, ON DELETE CASCADE)
- File: `supabase/migrations/20260320_guests_update.sql`
- ⚠️ Da eseguire in Supabase SQL Editor

### `/checkin/[id]` — Riscrittura completa
- **Step 1 — Dati ospite**: nome, cognome, cittadinanza, nazionalità, luogo/data nascita, sesso, telefono, email, tipo/numero/luogo documento
- **Step 2 — Tipo ospite**: Ospite singolo / Capo famiglia / Capogruppo
- **Step 3 — Accompagnatori** (visibile solo se capo_famiglia o capogruppo): form dinamico con aggiunta/rimozione; campi tipo, nome, cognome, cittadinanza, luogo/data nascita, sesso
- Submit salva in `guests` (con `full_name` per retrocompatibilità), poi in `guest_companions`, poi aggiorna `bookings.guest_id`
- Validazione campi obbligatori con messaggio dettagliato

---

## [Unreleased] — 2026-03-20 (aggiornamento 18 — select Alloggio dinamica nel form admin)

### Admin (`app/admin/page.tsx`)
- **Campo SELECT "Alloggio"** come primo campo del form: carica properties attive da Supabase (`active=true`)
- Default automatico sulla prima property disponibile al caricamento
- `property_id` dal form usato al submit (non più hardcoded `TULIPANO_ID`)

---

## [Unreleased] — 2026-03-20 (aggiornamento 17 — fix note iCal e normalizzazione canale nel pannello admin)

### Admin (`app/admin/page.tsx`)
- **Colonna Note**: filtrate stringhe grezze iCal ("Reserved", "Airbnb (Not available)", "CLOSED - Not available") → mostrate come "—"
- **Colonna Canale**: normalizzazione visualizzazione — "direct"/"diretto"→"Diretto", "airbnb"→"Airbnb", "booking"→"Booking" tramite `fmtChannel()`

---

## [Unreleased] — 2026-03-20 (aggiornamento 16 — unificazione schema: bookings unica fonte di verità)

### Migrazione dati
- 11 record migrati da `prenotazioni` → `bookings` (stessi UUID, property_id Il Tulipano)
- Mapping colonne: data_arrivo→check_in, data_partenza→check_out, canale→channel, stato→status, note→notes, num_ospiti→num_guests
- `bookings` ora ha 13 record totali (11 iCal + 2 test manuali)
- ⚠️ `DROP TABLE prenotazioni` da eseguire manualmente in Supabase SQL Editor

### Admin (`app/admin/page.tsx`)
- Legge da `bookings` invece di `prenotazioni` — adattati tutti i campi al nuovo schema
- `id` ora UUID stringa (non più intero), pulsante Link check-in usa UUID corretto
- Join con `guests(full_name, phone)` e `properties(name)`
- Stato visualizzato in italiano (confirmed→confermata, pending→in attesa, cancelled→cancellata)

### API (`app/api/sync-calendar/route.ts`)
- Sincronizzazione scrive su `bookings` invece di `prenotazioni`
- Campi aggiornati al nuovo schema (channel, status, check_in, check_out, num_guests)

---

## [Unreleased] — 2026-03-20 (aggiornamento 15 — pulsante Link check-in nel pannello admin)

### Admin (`app/admin/page.tsx`)
- **Nuova colonna "Check-in"** nella tabella prenotazioni
- Se ospite non ancora registrato: pulsante **"Link check-in"** (cammello #8B7355) che copia `https://rs-hospitality.vercel.app/checkin/[id]` negli appunti
- Se ospite già presente: testo grigio "Check-in completato"
- Feedback visivo **"Copiato!"** per 2 secondi dopo la copia (stato `copiedId`)

---

## [Unreleased] — 2026-03-20 (aggiornamento 14 — rimozione emoji da pagina benvenuto)

### `/checkin/[id]/benvenuto`
- Rimosse tutte le emoji (orologi, chiave, barre Wi-Fi) dalla pagina benvenuto
- Componente `Row` semplificato: rimosso prop `icon` e relativo `<span>`

---

## [Unreleased] — 2026-03-20 (aggiornamento 13 — pagina benvenuto dinamica da Supabase)

### Database — properties
- **4 nuove colonne**: `contact_onsite_name`, `contact_onsite_phone`, `wifi_name`, `wifi_password`
- **Il Tulipano aggiornato**: Lella (339 430 4429) come referente in loco; wifi null (da aggiungere)
- SQL di migrazione aggiornato in `supabase/migrations/20260320_schema_rs_hospitality.sql`
- ⚠️ **Richiede esecuzione manuale** in Supabase SQL Editor (ALTER TABLE)

### `/checkin/[id]/benvenuto` — refactor completo
- Diventa async server component: legge `bookings.property_id` → `properties`
- **Wi-Fi dinamico**: mostra `wifi_name` / `wifi_password` se presenti, altrimenti "Disponibile all'arrivo"
- **Contatti dinamici** da DB, in ordine:
  1. Referente sul posto (`contact_onsite_name` + `contact_onsite_phone`) — se presente
  2. RS Hospitality — Raffaele +39 366 103 3691 (sempre presente)
- Indirizzo e città letti da `properties.address` / `properties.city`
- Zero valori hardcoded (Raffaele è l'unico fisso per design — è il proprietario)

---

## [Unreleased] — 2026-03-20 (aggiornamento 12 — Mini-App Ospite: check-in digitale)

### Nuove pagine

#### `/checkin/[id]` — Form registrazione ospite
- Legge la prenotazione da `bookings` via ID URL; reindirizza a benvenuto se già completato
- Form campi: nome completo, telefono, email (opzionale), tipo documento (select), numero documento, nazionalità
- Al submit: crea record in `guests`, aggiorna `bookings.guest_id`, redirect a `/checkin/[id]/benvenuto`
- Gestione stati: loading, not found (con link WhatsApp Raffaele), errori Supabase
- Design mobile-first: palette RS, font Helvetica, tono discreto

#### `/checkin/[id]/benvenuto` — Pagina benvenuto ospite
- Headline "La tua dimora è pronta." (server component, noindex)
- Card orari: check-in dalle 15:00 / check-out entro 11:00
- Card indirizzo: Via Clanio 60, Marcianise (CE) con link Google Maps
- Card Wi-Fi: segnaposto "disponibile all'arrivo" (da aggiornare con codice reale)
- Card assistenza: bottone WhatsApp diretto a Raffaele +39 366 103 3691

---

## [Unreleased] — 2026-03-20 (aggiornamento 11 — properties su Supabase + calendar dinamico)

### Database
- **Record "Il Tulipano"** inserito in `properties` (id: `0e16fce0-...`): Via Clanio 60, Marcianise, RS Comfort, 55–80€/notte, URL Airbnb e Booking reali, entrambi i feed iCal

### API (`app/api/calendar/route.ts`)
- **Rimossi URL iCal hardcoded**: gli URL vengono ora letti da `properties.ical_airbnb` e `properties.ical_booking` per tutte le properties attive
- **Parametro opzionale `?property=nome`**: permette di filtrare gli eventi per una property specifica
- **Client Supabase server-side**: usa `SUPABASE_SERVICE_ROLE_KEY` se presente, altrimenti fallback su anon key
- Nessuna modifica al formato risposta `{ events: [{start, end}] }` — retrocompatibile

---

## [Unreleased] — 2026-03-20 (aggiornamento 10 — schema Supabase completo)

### Database — Schema RS Hospitality
- **Tabella `properties`**: alloggi gestiti (name, category, city, price_min/max, ical_airbnb, ical_booking, active)
- **Tabella `guests`**: anagrafica ospiti (full_name, phone, email, document_type/number, nationality)
- **Tabella `bookings`**: prenotazioni in inglese (FK → properties, guests; total_price, notes, channel, status, uid_ical)
- **Tabella `messages`**: log comunicazioni (booking_id FK, channel, direction inbound/outbound, content, sent_at)
- **Tabella `payments`**: pagamenti (booking_id FK, amount, method, status, paid_at)
- **Record test**: "Il Tulipano" inserito in `properties` (RS Comfort, Marcianise, price 60–90€/notte)
- File migrazione: `supabase/migrations/20260320_schema_rs_hospitality.sql`
- Script esecuzione: `scripts/run-migration.mjs` (uso: `DB_PASSWORD=xxx node scripts/run-migration.mjs`)

---

## [Unreleased] — 2026-03-20 (aggiornamento 9 — sync iCal → Supabase)

### API (`app/api/sync-calendar/route.ts`)
- **Nuova route GET `/api/sync-calendar`**: fetcha i feed iCal di Airbnb e Booking.com server-side
- **Parser iCal inline** (nessuna dipendenza esterna): gestisce line folding, parametri DTSTART/DTEND, estrae UID, date, summary
- **Deduplicazione via `uid_ical`**: controlla se l'evento esiste già prima di inserire — zero duplicati
- **Inserimento in `prenotazioni`**: `data_arrivo`, `data_partenza`, `canale` (Airbnb/Booking), `stato: confermata`, `note` (summary iCal), `uid_ical`
- **Risposta JSON**: `{ sincronizzati: N, skippati: N, errori: [] }`
- Usa `SUPABASE_SERVICE_ROLE_KEY` se presente, altrimenti fallback su anon key

### Database
- **Nuova colonna `uid_ical`** nella tabella `prenotazioni` — vedere SQL da eseguire in Supabase Dashboard

### Admin (`app/admin/page.tsx`)
- **Bottone "⟳ Sincronizza calendario"** in header: chiama `/api/sync-calendar`, aggiorna la lista al termine
- **Banner risultato sync**: mostra prenotazioni importate / già presenti / errori con stile coerente alla palette RS

---

## [Unreleased] — 2026-03-20 (aggiornamento 8 — integrazione Supabase + pannello admin)

### Infrastruttura
- **Supabase**: installato `@supabase/supabase-js`; creato `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (escluso da git tramite `.env*` in `.gitignore`)
- **`lib/supabase.ts`**: client Supabase centralizzato, importabile in tutto il progetto

### Admin (`app/admin/page.tsx`)
- **Nuova pagina `/admin`**: pannello interno senza autenticazione (da proteggere in seguito)
- **Lista prenotazioni**: tabella su sfondo lino con join `prenotazioni → ospiti → alloggi`; colonne: ospite, telefono, alloggio, arrivo, partenza, notti, n° ospiti, canale, stato (badge colorato), note; righe zebrate
- **Badge stato**: verde (confermata), giallo (in attesa), rosso (cancellata)
- **Form aggiunta manuale**: su sfondo sabbia, griglia 2 colonne; campi: nome ospite, telefono, data arrivo/partenza, numero ospiti (1–3), canale (Airbnb / Booking / Diretto / WhatsApp), stato, note; inserimento normalizzato — crea ospite in `ospiti` poi `prenotazioni`
- **UX**: feedback inline successo/errore, bottone "↻ Aggiorna" in header

---

## [Unreleased] — 2026-03-19 (aggiornamento 7 — revisione grafica completa)

### Design — Homepage (`app/page.tsx`)
- **Hero — logo**: height aumentato a 72px, margin-bottom 24px (era clamp 48–68px)
- **Hero — H1**: fontSize ridotto a `clamp(36px, 5vw, 52px)` (era clamp 2.2–4.8rem)
- **Hero — padding**: ridotto a 120px top / 100px bottom (era 8rem / 6rem)
- **Card Il Tulipano**: rimosso bottone duplicato "Scopri l'alloggio →" (rimane solo il link testuale "Scopri il prezzo →")
- **Statistiche**: padding ridotto a 56px top/bottom; numeri a 48px; label a 9px / letter-spacing 0.2em
- **Chi siamo**: padding 80px top/bottom; virgolette a 64px; max-width 640px centrato; line-height paragrafi 1.8
- **Footer**: border-top `rgba(240,235,224,0.15)`; padding-top 48px

### Design — Pagina Il Tulipano (`app/alloggi/il-tulipano/page.tsx`)
- **Hero — overlay**: gradient da `0.4/0.72` a `0.3/0.6` (meno pesante)
- **Hero — eyebrow**: color sabbia `#D4C9B5`, text-shadow `0 1px 3px rgba(0,0,0,0.6)`
- **Hero — H1**: aggiunto `text-shadow: 0 2px 8px rgba(0,0,0,0.4)`
- **Galleria**: immagine principale con border-radius 2px; thumbnail gap 6px, border-radius 2px
- **Descrizione + Dotazioni**: padding sezioni a 64px top/bottom
- **Dotazioni**: griglia 2 colonne su desktop (era 3) — aggiornato in `globals.css`
- **Modulo disponibilità — input/select**: border `1px solid #8B7355` (era 0.4 opacity); background `rgba(255,255,255,0.05)`
- **Bottoni Booking/Airbnb/Contattaci**: hover unificato RS — background cammello, color tabacco
- **Mappa**: padding 64px; iframe container con border-radius 4px
- **Footer**: allineato a homepage (border-top e padding)

### Design — Pagina Chi siamo (`app/chi-siamo/page.tsx`)
- **Hero**: padding 80px top / 64px bottom; logo RS aggiunto (height 56px); H1 a 52px italic
- **Sezione testo**: padding 80px; max-width 660px; virgolette 56px / line-height 1 / margin-bottom 8px
- **Primo paragrafo**: 20px, font-weight 400, line-height 1.7
- **Paragrafi successivi**: 15px, color `#5a5040`, line-height 1.85 (rimosso opacity)
- **Firma Raffaele**: border-top `1px solid #D4C9B5`, margin-top 48px, padding-top 32px; nome 16px/500; sottotitolo 12px/0.05em

---

## [Unreleased] — 2026-03-19 (aggiornamento 6 — singolare, posizione, ospiti, date WhatsApp, alternative occupato, calendario rimosso, prezzo homepage, proprietari nascosta)

### Copywriting
- **Il Tulipano — descrizione**: "nel centro di Marcianise" → "a pochi passi dalla stazione ferroviaria di Marcianise"
- **Homepage — hero CTA**: "Vedi gli alloggi" → "Vedi l'alloggio" (singolare, un solo alloggio disponibile)
- **Homepage — card alloggio**: rimosso "nel centro di Marcianise" dalla descrizione, aggiornata posizione coerente con pagina Il Tulipano

### Modulo disponibilità
- **Numero ospiti**: massimo ridotto da 4 a 3 (opzioni: 1 ospite, 2 ospiti, 3 ospiti)
- **Date WhatsApp**: URL precompilato ora usa `toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })` — es. "lunedì 6 aprile 2026"
- **Date alternative se occupato**: quando il periodo è occupato, calcola automaticamente le 3 finestre libere più vicine (stessa durata); mostrate come bottoni cliccabili con formato data esteso; al click aggiorna il form e sblocca il bottone WhatsApp

### Layout
- **Calendario mensile rimosso**: rimossa sezione calendario (giorni rossi/verdi) sotto il modulo disponibilità — rimane solo il modulo di verifica
- **Homepage — prezzo card**: rimosso "da €55 / notte"; sostituito con link "Scopri il prezzo →" che porta a /alloggi/il-tulipano
- **Homepage — sezione proprietari**: commentata con `{/* PROPRIETARI - nascosta temporaneamente */}` — codice intatto, non visualizzato

---

## [Unreleased] — 2026-03-19 (aggiornamento 5 — plurale, dominio, chi siamo, nav, logo, disponibilità)

### Copywriting
- **Homepage — sezione alloggi**: titolo "I nostri alloggi" → "Il Tulipano — RS Comfort" (singolo, specifico)
- **Homepage — sezione chi siamo**: testo sostituito con versione personale estesa di Raffaele (pluriparagrafo)
- **Pagina /chi-siamo**: testo completo sostituito con versione definitiva (9 paragrafi, tono RS)

### Design
- **Homepage — hero**: aggiunto logo (`/images/tulipano/Logo.png`) centrato sopra l'h1, `height: clamp(56px, 8vw, 80px)`, `next/image` con `priority`

### Contatti / Dominio
- **Rimosso `rshospitality.it`** da tutti i footer (homepage, /chi-siamo, /alloggi/il-tulipano, /proprietari)
- **Rimosso `metadataBase`** e `og:url` da `layout.tsx` (nessun dominio hardcoded nei metadata)
- **Rimosso url** dai JSON-LD in layout.tsx e il-tulipano/page.tsx; image URL diventate relative

### Navigazione
- **Fix link "Chi siamo"** in `/alloggi/il-tulipano`: era `/#proprietari`, corretto in `/#chi-siamo`
- **/chi-siamo** e **/proprietari**: link già corretti, verificati

### Disponibilità (modulo)
- **Pagina /alloggi/il-tulipano**: rimossi prezzi fissi (€55/€70/€80) dalla sezione prenotazione e dall'hero
- **Modulo disponibilità**: form con data arrivo (date picker), data partenza, numero ospiti (1–4 select); bottone "Verifica disponibilità"
- **Logica**: al click fetcha `/api/calendar`, confronta date selezionate con eventi iCal; se libero → messaggio verde + bottone WhatsApp sbloccato con URL precompilato (`wa.me/393661033691?text=...`); se occupato → messaggio rosso + suggerimento di modificare le date
- URL WhatsApp precompilato con `[dataArrivo]`, `[dataPartenza]`, `[nOspiti]` reali
- Stile: palette RS, font Helvetica, nessun colore esterno (solo #25D366 per WhatsApp e segnali di stato verde/rosso semantici)

---

## [Unreleased] — 2026-03-18 (aggiornamento 4 — fix visivi e bug)

### Bug fix
- **Menu mobile ripetuto 6 volte**: rimosso tag `<head>` esplicito da `layout.tsx` — in Next.js App Router causa hydration mismatch e rendering multiplo del component tree; lo script JSON-LD spostato come primo child di `<body>`

### Contrasto
- **Hero Il Tulipano**: riga "RS Comfort · Via Clanio 60, Marcianise" — colore cambiato da `cammello` a `lino` + `textShadow: 0 1px 6px rgba(0,0,0,0.65)` per garantire leggibilità su qualsiasi tono della foto di sfondo

### Design
- **Bottoni Booking.com e Airbnb** (sezione tariffe Il Tulipano): rimossi colori brand (#003580 blu, #FF5A5F rosso); uniformati alla palette RS — sfondo trasparente, bordo cammello, testo lino, hover sfondo cammello
- **`/proprietari` — griglia commissioni**: "Gestione full" → "Tutto incluso" (eliminato anglicismo)
- **`/proprietari` — sezione servizi**: label "Cosa è incluso" → "Cosa include" (forma più naturale)

---

## [Unreleased] — 2026-03-18 (aggiornamento 3 — sessione rifinitura)

### Copywriting (TASK 1)
- **Hero homepage**: sottotitolo riscritto — "Camere curate, spazi silenziosi, assistenza presente"
- **Sezione chi siamo homepage**: due paragrafi raffinati in tono RS (63 parole, prima persona Raffaele)
- **Card Il Tulipano (homepage)**: descrizione compatta e più precisa, rimosso "curato"
- **Sezione proprietari homepage**: headline aggiornata a "nelle mani giuste"; seconda riga → "Ci occupiamo di tutto, tu incassi"
- **Pagina Il Tulipano — descrizione**: aggiunta riga "Pulizie incluse"; testo riscritto a ~55 parole, zero superlativi

### SEO (TASK 2)
- **layout.tsx**: title default aggiornato con keyword "Affitti brevi a Marcianise"; descrizione ottimizzata (155 car.); og/twitter title e description aggiornati
- **layout.tsx**: aggiunto JSON-LD `LocalBusiness` con indirizzo, geo, priceRange, sameAs Booking e Airbnb
- **Pagina Il Tulipano**: `document.title` aggiornato con "affitti brevi Marcianise, Caserta"; aggiunto JSON-LD `LodgingBusiness` dinamico (amenityFeature incluse)
- **Pagina Chi siamo**: `document.title` aggiornato con keyword "affitti brevi Marcianise"

### UX (TASK 3)
- **Pagina Il Tulipano — CTA Booking**: aggiunto microcopy "Conferma immediata · Cancellazione gratuita"
- **Pagina Il Tulipano — CTA Airbnb**: aggiunto microcopy "Pagamento sicuro · Assistenza 24/7"
- **Pagina Il Tulipano**: aggiunto `id="footer"` al footer per anchor link funzionante
- **Homepage**: aggiunta sezione social proof (9.2 Booking, 4.9★ Airbnb, 100% tornerebbero) tra sezione alloggi e chi siamo

### Revenue (TASK 4)
- **Pagina Il Tulipano — tariffe**: aggiunta griglia visiva Bassa stagione/Alta stagione/Weekend (€55/€70/€80)
- **Pagina Il Tulipano**: aggiunto CTA "Prenota direttamente su WhatsApp" con subline "Miglior prezzo garantito · risposta entro 1 ora"
- Rimossa riga ridondante "Tariffa dinamica fino a €80 / notte"

### WhatsApp CRM (TASK 5)
- **Nuovo file `app/templates/whatsapp.ts`**: 6 template ufficiali RS — `confirmationTemplate`, `preArrivalTemplate`, `checkInTemplate`, `midStayTemplate`, `checkOutTemplate`, `reviewTemplate`
- Variabili: `[nomeOspite]`, `[dataArrivo]`, `[dataPartenza]`, `[nomeAlloggio]`

### Proprietari B2B (TASK 6)
- **Nuova pagina `app/proprietari/page.tsx`**: hero "Il tuo immobile lavora. Tu no.", sezione come funziona (3 passi), 9 servizi inclusi, griglia commissioni 15–25% con note trasparenti, FAQ accordion (5 domande), CTA finale WhatsApp

---

## [Unreleased] — 2026-03-18 (aggiornamento 2)

### Design
- **Card Il Tulipano (homepage)**: layout orizzontale foto/testo (58%/42%), altezza foto 480px su desktop, 300px su mobile — molto più impattante del precedente formato verticale
- **Sezione Chi siamo**: rimosso layout a due colonne corporate; ora testo centrato con virgolette decorative, firma personale e tono più caldo; sezione con più spazio verticale
- **Pagina `/chi-siamo`**: hero allineato a sinistra con tagline, testo ampliato con tre paragrafi personali, virgolette decorative

### SEO
- `layout.tsx`: aggiunto `metadataBase`, `title.template`, og:title, og:description, og:image (Foto letto ampia.png), og:url, twitter:card
- Pagina `/alloggi/il-tulipano`: `document.title` impostato via `useEffect`
- Pagina `/chi-siamo`: `document.title` impostato via `useEffect`

### Performance
- Sostituiti `<img>` con `<Image>` (next/image) per: hero di Il Tulipano (con `fill` e `priority`), foto card homepage (con `fill` e `priority`), thumbnails galleria (con `width={80}` `height={54}`)
- Logo: `<Image>` con `height={68}` per prevenire layout shift
- Gallery main image: attributi `width={1200}` `height={675}` aggiunti per prevenzione CLS

### Footer e contatti
- Rimossa email `info@rshospitality.it` da footer, overlay mobile e tutte le pagine
- Aggiunto link WhatsApp (`wa.me/393661033691`) in footer e overlay mobile su tutte le pagine
- Mantenuti: dominio `rshospitality.it` e telefono `+39 366 103 3691`

### Mappa
- Altezza iframe mappa aumentata da 380px a 420px
- Aggiunto `backgroundColor: c.sabbia` al container della mappa per evitare flash bianco durante il caricamento

---

## [Unreleased] — 2026-03-18

### Aggiunto
- **WhatsApp button fisso** in `layout.tsx`: pulsante verde (#25D366) posizionato in basso a destra su tutte le pagine, con icona SVG e link diretto a `wa.me/393661033691`.
- **Sezione "Chi siamo"** nella homepage (`app/page.tsx`): testo di presentazione di Raffaele Salzillo tra la sezione Alloggi e la sezione Proprietari.
- **Pagina `/chi-siamo`** (`app/chi-siamo/page.tsx`): pagina standalone con testo completo, navbar, hero e footer in linea con il design system.
- **API route `/api/calendar`** (`app/api/calendar/route.ts`): fetcha i feed iCal di Airbnb e Booking.com server-side, parsa gli eventi e restituisce le date occupate in formato JSON con cache di 1 ora.
- **Calendario disponibilità** in `/alloggi/il-tulipano`: visualizza 2 mesi (corrente e successivo), giorni occupati in rosso, giorni liberi in verde. Dati provenienti da `/api/calendar`.
- **Mappa Google Maps reale** in `/alloggi/il-tulipano`: iframe embed di Google Maps per "Via Clanio 60, Marcianise CE", sostituisce il precedente placeholder testuale.

### Modificato
- `app/alloggi/il-tulipano/page.tsx`: aggiunta funzione `renderMonth`, stati `busyDates`/`calLoading`, ref `calRef`/`calInView`, sezione calendario e sostituzione mappa.
- `app/page.tsx`: aggiunta sezione `#chi-siamo` con layout a due colonne.

---

## [1.0.0] — 2026-03-17

### Aggiunto
- Primo deploy RS Hospitality.
- Homepage con hero, sezione alloggi, sezione proprietari e footer.
- Pagina `/alloggi/il-tulipano` con galleria fotografica, dotazioni, prezzi, assistenza in loco.
- Design system: palette tabacco/lino/cammello/sabbia, tipografia Helvetica Neue, layout responsive mobile-first.
