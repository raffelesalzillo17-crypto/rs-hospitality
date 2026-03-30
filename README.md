# RS Hospitality

Gestionale interno per affitti brevi. Sviluppato da Raffaele Salzillo, Marcianise (CE).

- Sito: [rshospitality.it](https://rshospitality.it)
- Deploy: [rs-hospitality.vercel.app](https://rs-hospitality.vercel.app)
- DB: Supabase (`mjrdjkrqhmxvlmfpbfqf.supabase.co`)

---

## Stack

- **Next.js 16** (App Router) + **TypeScript strict**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + Auth)
- **Vercel** (deploy automatico da GitHub)
- **Cheerio** + **pdf-parse** (parsing email/PDF per import prenotazioni)

---

## Alloggi attivi

| Nome | Indirizzo | Visibile sul sito |
|------|-----------|-------------------|
| Il Tulipano | Via Clanio 60, Marcianise | Sì |
| Stanza Rosa | Via Clanio 60, Marcianise | No (`is_private = true`) |

---

## Variabili d'ambiente

Crea un file `.env.local` nella root con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mjrdjkrqhmxvlmfpbfqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
EMAIL_IMPORT_SECRET=<secret_per_make_com>
```

---

## Avvio in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

Admin disponibile su [http://localhost:3000/admin](http://localhost:3000/admin) (richiede credenziali Supabase Auth).

---

## Struttura principale

```
app/
  page.tsx                    # Homepage pubblica
  admin/page.tsx              # Dashboard privata (auth)
  admin/login/page.tsx        # Login
  alloggi/il-tulipano/        # Pagina pubblica alloggio
  checkin/[id]/               # Mini-app check-in ospiti
  api/email-import/           # Import automatico da Make.com
  api/sync-calendar/          # Sync iCal Airbnb/Booking
  api/import-csv/             # Import CSV manuale
  api/calendar/               # Feed iCal pubblico (usato da pagina Il Tulipano)
lib/
  constants.ts                # Commissioni OTA, cedolare, costanti
  types.ts                    # TypeScript types condivisi
  date-utils.ts               # Parser date e importi
  supabase*.ts                # Client Supabase (browser, server, SSR)
supabase/migrations/          # Schema DB e migrazioni
```

---

## Migrazioni DB

Le migrazioni si trovano in `supabase/migrations/` e vengono eseguite tramite MCP Supabase configurato in `.mcp.json`.
