# Sessione di lavoro — 2026-03-20

## Stato attuale del sistema

### Funzionalità completate e deployate

#### Import automatico prenotazioni via email (`/api/email-import`)
- Make.com chiama ogni 15 min con payload `{ from, subject, bodyHtml, bodyText, attachments }`
- Auth: header `X-RS-Secret: rshospitality2026` (env `EMAIL_IMPORT_SECRET`)
- **Parser Airbnb**: cheerio + regex su bodyHtml — estrae nome ospite, date (mesi italiani, anno auto), importo, codice conferma
- **Parser Booking.com**: decodifica PDF base64 allegato con `pdf-parse` (import dinamico per serverless)
- **Match engine**: cerca per `ota_booking_ref` → UPDATE; fallback su `check_in + check_out` → UPDATE; altrimenti INSERT
- **`findOrCreateGuest`**: cerca guest per nome esatto, crea se non esiste, linka `guest_id` su bookings in tutti i path
- Logging su tabella `import_logs`; risponde sempre 200 (evita retry Make che causano duplicati)

#### Import storico CSV (`/api/import-csv`)
- Auth: stesso header `X-RS-Secret`
- Parser flessibile: separatore auto-rilevato (`,` o `;`), date ISO / DD/MM/YYYY / DD Mon YYYY
- Supporta CSV Airbnb IT e Booking.com EN (colonne diverse)
- Se prenotazione trovata per ref o date → UPDATE guest + importi
- Se non trovata → INSERT nuova prenotazione storica con canale auto-rilevato
- Risposta: `{ created, updated, skipped, errors[] }`

#### RS Central (`/admin`)
- **Tab Calendario**: griglia property × giorni, barre colorate (verde=confirmed, grigio=iCal senza guest, grigio scuro=blocco manuale), card prossimo arrivo
- **Tab Prenotazioni**: lista senza blocchi, colonna "Lordo" (`gross_amount`), "Ospite non identificato" per guest_id null, modale bottom sheet con editor prezzo
- **Tab Import Log**: ultimi 10 import email con badge colorati + sezione "Import storico CSV" con file picker
- **Form Blocca date**: crea righe `booking_type = 'block'` (grigio nel calendario, invisibili in lista prenotazioni)
- **Pulsante Sincronizza**: chiama `/api/sync-calendar`, filtra blocchi OTA, aggiorna UI

#### Sync iCal (`/api/sync-calendar`)
- Filtra eventi rumore: durata > 60n, summary "not available/closed/blocked/reserved", vuoto + > 30n
- Match primario per `check_in + check_out + property_id`
- Se booking con `guest_id` → skip (non sovrascrivere dati da email import)
- INSERT con `booking_type: 'booking'`, canali lowercase

#### Schema DB (Supabase)
| Tabella | Colonne aggiunte in sessione |
|---------|------------------------------|
| `bookings` | `ota_booking_ref`, `gross_amount`, `booking_type` |
| `import_logs` | tabella nuova (id, created_at, channel, from_email, subject, action, booking_ref, guest_name, error_message) |

---

## Migrazioni da eseguire in Supabase SQL Editor

Se non ancora eseguite:

```sql
-- 1. Colonne email import
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ota_booking_ref text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gross_amount    numeric;

CREATE TABLE IF NOT EXISTS import_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz DEFAULT now(),
  channel       text, from_email text, subject text,
  action        text, booking_ref text, guest_name text, error_message text
);

-- 2. booking_type
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type text DEFAULT 'booking';
UPDATE bookings SET booking_type = 'booking' WHERE booking_type IS NULL;
```

---

## Bug aperti / da verificare

| # | Descrizione | Priorità |
|---|-------------|----------|
| 1 | **CSV Airbnb IT non confermato**: fix `checkout`/`nome dell` deployato (ce32164) ma non ancora testato end-to-end | Alta |
| 2 | **Booking 91430cdd (HMRNPFZKFY)** ha `guest_id = null`: email test precedente non aveva ancora `findOrCreateGuest`. Basta re-inviare l'email o ri-eseguire il curl | Media |
| 3 | **Parser email Airbnb su email reale**: testato solo su payload mock, non ancora su HTML reale da Make.com | Alta |
| 4 | **Parser Booking.com PDF**: non ancora testato con PDF reale da Pulse | Alta |
| 5 | **Vercel env var `EMAIL_IMPORT_SECRET`**: da verificare sia impostata (se non lo è, ogni chiamata da Make risponde 401) | Alta |
| 6 | **Make.com header X-RS-Secret**: da aggiungere manualmente nell'HTTP module di Make | Alta |

---

## Prossimi step consigliati

### Immediati (test e configurazione)
1. Aggiungere `X-RS-Secret: rshospitality2026` nell'HTTP module di Make.com
2. Verificare env var `EMAIL_IMPORT_SECRET` su Vercel dashboard
3. Testare il flusso end-to-end con una email reale Airbnb inoltrata a import.rshospitality@gmail.com
4. Testare con un PDF Booking.com reale
5. Caricare i CSV storici Airbnb e Booking per popolare `guest_name` e `gross_amount` sulle 10 prenotazioni esistenti

### Feature future
- **Tab Finanze** in RS Central: totale lordo per mese, commissioni OTA stimate, grafico entrate
- **Modale dettaglio prenotazione**: aggiungere `gross_amount` e `ota_booking_ref` visibili
- **Notifica WhatsApp** al check-in: quando Make riceve email conferma, manda messaggio Raffaele
- **Multi-property**: il sistema è già strutturato per più alloggi (property_id), pronto per espansione
- **Alloggiati Web export**: CSV da `/checkin/[id]` per la registrazione ospiti in questura

---

## File chiave

```
app/
  admin/page.tsx              ← RS Central (calendario, prenotazioni, import log)
  api/
    email-import/route.ts     ← Import automatico da Make.com
    import-csv/route.ts       ← Import storico CSV
    sync-calendar/route.ts    ← Sync iCal → Supabase
    calendar/route.ts         ← iCal pubblico per pagina prenotazione
  checkin/[id]/page.tsx       ← Form check-in ospiti
lib/
  supabase.ts                 ← Client Supabase (anon key)
supabase/migrations/          ← SQL da eseguire manualmente
```

## Variabili d'ambiente necessarie

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     ← richiesta da API routes
EMAIL_IMPORT_SECRET=rshospitality2026
```
