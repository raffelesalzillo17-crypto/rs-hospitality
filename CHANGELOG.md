# Changelog — RS Hospitality

## [2026-03-17 ora 18:00] — Prima pagina alloggio reale: Il Tulipano

### Nuovo
- **`app/alloggi/il-tulipano/page.tsx`** — Pagina dedicata all'alloggio Il Tulipano (RS Comfort):
  - Hero fullscreen con foto `dettaglio letto.png` e overlay tabacco, titolo "Il Tulipano" sovrapposto
  - Galleria interattiva: immagine principale + thumbnails cliccabili + frecce prev/next + counter
  - Sezione logo (`Logo.png`) + intestazione con categoria, nome e indirizzo
  - Descrizione editoriale nel tono RS (calmo, preciso, discreto)
  - Griglia dotazioni (10 voci) con icone SVG stroke-based in palette cammello
  - Box prezzo "da €55 / notte" con nota tariffa dinamica (max €80) e lettino aggiuntivo (+€20)
  - CTA Booking.com (`https://www.booking.com/Share-KLD1dK0`) e Airbnb (`https://www.airbnb.it/rooms/1151100346729188269`)
  - CTA secondario "Contattaci direttamente" → `tel:+393661033691`
  - Sezione assistenza Lella → `tel:+393394304429`
  - Placeholder mappa con link a Google Maps (Via Clanio 60, Marcianise CE)
  - Navbar e footer identici all'homepage; link navbar → `/#alloggi`, `/#proprietari`, `/#footer`

### `app/globals.css`
- Aggiunta classe `.rs-dotazioni-grid`: 3 colonne desktop, 2 colonne mobile
- Aggiunta classe `.rs-prezzo-layout`: 2 colonne desktop, 1 colonna mobile

### `app/page.tsx`
- Card "Il Tulipano" nella sezione alloggi: sostituita foto placeholder con immagine reale `dettaglio letto.png`
- Dati aggiornati: nome "Il Tulipano", categoria RS Comfort, prezzo "da €55 / notte"
- Descrizione card aggiornata con contenuto reale
- Link CTA della card → `/alloggi/il-tulipano`

---

## [2026-03-17] — Redesign completo: focus ospiti

### Strategia
Cambio di obiettivo principale: da acquisizione proprietari a vendita soggiorni.

### `app/globals.css`
- Semplificato: rimossi `.rs-steps-grid`, `.rs-step`, `.rs-contact-details` (sezioni rimosse)
- Aggiunto `.rs-alloggi-grid`: 2 colonne su desktop, 1 su mobile
- Fix navbar: `gap: 3rem` sui link desktop per spaziatura leggibile
- Hamburger: `padding: 8px` per area di tocco più ampia

### `app/page.tsx`
- **Navbar**: `z-index: 300` (sopra l'overlay a 250) — hamburger non si sovrappone più al testo dell'overlay; link desktop a `0.78rem` senza lettera-spaziatura eccessiva
- **Hero**: nuovo copy "Soggiorna a Marcianise." con sottotitolo orientato all'ospite
- **Sezione alloggi**: griglia 2 card placeholder (RS Comfort €65/notte, RS Superior €95/notte) con foto-placeholder in gradient, prezzo, CTA "Scopri →"
- **Sezione proprietari**: banner discreto in fondo "Hai un immobile? Gestiamolo noi." con link a `/proprietari`
- **Rimosso**: sezione "Come funziona", sezione "Chi siamo" standalone, sezione "Contatti" standalone
- **Rimosso**: hook `useInView` per Come Funziona e Contatti; mantenuti per Alloggi e Proprietari

---

## [2026-03-17] — Numero di telefono reale

### `app/page.tsx`
- Sostituito placeholder `+39 000 000 0000` con `+39 366 103 3691` in tutti i punti (overlay mobile, sezione contatti, footer)

---

## [2026-03-17] — Miglioramenti landing page

### `app/globals.css`
- Aggiunte classi responsive: `.rs-nav-links`, `.rs-hamburger`, `.rs-steps-grid`, `.rs-step`, `.rs-categories-grid`, `.rs-footer-top`, `.rs-footer-bottom`, `.rs-contact-details`
- Media query `@media (max-width: 768px)` con layout a colonna singola per steps, categorie e footer
- Bordi separatori degli step: verticali su desktop, orizzontali su mobile

### `app/page.tsx`
- **Navbar trasparente su hero**: diventa tabacco solido dopo 60px di scroll (`scrolled` state + `window.scroll` listener)
- **Hamburger menu mobile**: 3 linee animate in croce all'apertura; overlay full-screen tabacco con link e contatti; body scroll bloccato mentre aperto
- **Hook `useInView`**: IntersectionObserver che triggera il fade-in una volta sola al primo ingresso nella viewport
- **Fade-in on scroll**: ogni sezione (Chi siamo, Come funziona, Categorie, Contatti) entra con `opacity 0→1` + `translateY 24px→0` con delay scaglionati
- **Sezione "Come funziona"**: 3 step numerati (01–03) con titolo, descrizione e linea decorativa; griglia 3 col / 1 col mobile
- **Contatti potenziati**: telefono `+39 000 000 0000` e email `info@rshospitality.it` visibili come link cliccabili
- **Padding responsive**: `clamp()` su tutte le sezioni per padding fluido desktop→mobile
- **Footer**: telefono aggiunto; layout a colonna su mobile

---

## [2026-03-17] — Prima build

### Costruito da zero — Landing page completa

**`app/layout.tsx`**
- Rimossi i font Geist (default Next.js)
- Aggiornati i metadata: titolo e descrizione RS Hospitality
- Lingua impostata su `it`

**`app/globals.css`**
- Reset base (`margin`, `padding`, `box-sizing`)
- Variabili CSS per la palette: `--tabacco`, `--lino`, `--cammello`, `--sabbia`
- Font globale: `Helvetica Neue, Helvetica, Arial, sans-serif`
- Scroll behavior smooth

**`app/page.tsx`**
- Direttiva `"use client"` (richiesta dagli event handler onMouseEnter/onMouseLeave)
- **Navbar** sticky su sfondo tabacco `#2C2416`, logo `RS Hospitality` in lino, link a sezioni interne
- **Hero** full-screen su tabacco, tagline *"Ogni soggiorno porta la nostra firma."* peso 300, eyebrow con città, CTA con bordo cammello
- **Chi siamo** — sfondo lino, paragrafo editoriale con storia del fondatore Raffaele Salzillo
- **Categorie** — griglia a due colonne: RS Comfort (lino) e RS Superior (tabacco), con descrizioni e feature list
- **Contatti** — sezione conversione per proprietari con CTA email
- **Footer** — sfondo tabacco, dominio `rshospitality.it`, email, copyright con nome fondatore
- Palette rigorosa: Tabacco `#2C2416`, Lino `#F0EBE0`, Cammello `#8B7355`, Sabbia `#D4C9B5`
- Stile minimalista, tutto inline-style, nessuna dipendenza aggiuntiva

---
