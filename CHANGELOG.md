# Changelog

Tutte le modifiche rilevanti al progetto RS Hospitality sono documentate in questo file.

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
