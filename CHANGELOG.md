# Changelog

Tutte le modifiche rilevanti al progetto RS Hospitality sono documentate in questo file.

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
