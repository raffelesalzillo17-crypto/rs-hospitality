# Changelog

Tutte le modifiche rilevanti al progetto RS Hospitality sono documentate in questo file.

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
