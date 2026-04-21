# Salzillo Hospitality

Gestionale interno per affitti brevi. Sviluppato da Raffaele Salzillo, Marcianise (CE).

- Sito: [rshospitality.it](https://rshospitality.it)
- Deploy: [rs-hospitality.vercel.app](https://rs-hospitality.vercel.app)
- DB: Google Sheets (via Google Sheets API)

---

## Stack

- **Next.js 16** (App Router) + **TypeScript strict**
- **Tailwind CSS 4**
- **Google Sheets** (database principale via Google Sheets API)
- **Vercel** (deploy automatico da GitHub)
- **Cheerio** + **pdf-parse** (parsing email/PDF per import prenotazioni)

---

## Alloggi attivi

| Nome | Indirizzo | Visibile sul sito |
|------|-----------|-------------------|
| Il Tulipano | Via Clanio 60, Marcianise | Si |
| Stanza Rosa | Via Clanio 60, Marcianise | No (privata) |

---

## Variabili d'ambiente

Crea un file `.env.local` nella root con:

```env
EMAIL_IMPORT_SECRET=<secret_per_make_com>
ANTHROPIC_API_KEY=<chiave_anthropic>

GOOGLE_CLIENT_EMAIL=<service_account_email>
GOOGLE_PRIVATE_KEY=<chiave_privata>
GOOGLE_SHEETS_ID=<id_spreadsheet>
GOOGLE_CALENDAR_ID=<id_calendario>
```

---

## Avvio in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

Admin disponibile su [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Struttura principale

```
app/
  page.tsx                    # Homepage pubblica
  admin/page.tsx              # Dashboard privata
  admin/login/page.tsx        # Login
  alloggi/il-tulipano/        # Pagina pubblica alloggio
  checkin/[id]/               # Mini-app check-in ospiti
  api/email-import/           # Import automatico da Make.com
  api/import-csv/             # Import CSV manuale
  api/calendar/               # Feed iCal pubblico
lib/
  constants.ts                # Commissioni OTA, cedolare, costanti
  types.ts                    # TypeScript types condivisi
  date-utils.ts               # Parser date e importi
```
