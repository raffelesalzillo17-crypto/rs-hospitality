# Changelog

Tutte le modifiche rilevanti al progetto RS Hospitality sono documentate in questo file.

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
