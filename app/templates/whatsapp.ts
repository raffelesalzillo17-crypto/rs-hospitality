/**
 * RS Hospitality — Template WhatsApp ufficiali
 * Tono: calmo, preciso, personale. Max 5 righe per messaggio.
 * Variabili: [nomeOspite] [dataArrivo] [dataPartenza] [nomeAlloggio]
 */

export type TemplateVars = {
  nomeOspite: string;
  dataArrivo: string;
  dataPartenza: string;
  nomeAlloggio: string;
};

function fill(template: string, vars: TemplateVars): string {
  return template
    .replace(/\[nomeOspite\]/g, vars.nomeOspite)
    .replace(/\[dataArrivo\]/g, vars.dataArrivo)
    .replace(/\[dataPartenza\]/g, vars.dataPartenza)
    .replace(/\[nomeAlloggio\]/g, vars.nomeAlloggio);
}

/** Inviato subito dopo la conferma della prenotazione */
export const confirmationTemplate = (vars: TemplateVars) =>
  fill(
    `Ciao [nomeOspite], la tua prenotazione per [nomeAlloggio] è confermata.\n` +
    `Arrivo: [dataArrivo] · Partenza: [dataPartenza]\n` +
    `Per qualsiasi cosa sono qui — basta scrivere.\n` +
    `A presto, Raffaele — RS Hospitality`,
    vars
  );

/** Inviato 48 ore prima dell'arrivo */
export const preArrivalTemplate = (vars: TemplateVars) =>
  fill(
    `Ciao [nomeOspite], ti aspettiamo dopodomani a [nomeAlloggio].\n` +
    `Fammi sapere a che ora prevedi di arrivare così organizziamo il check-in.\n` +
    `Indirizzo: Via Clanio 60, Marcianise (CE) — ti mando il pin su Maps se preferisci.\n` +
    `Raffaele — RS Hospitality`,
    vars
  );

/** Inviato la mattina del giorno di arrivo */
export const checkInTemplate = (vars: TemplateVars) =>
  fill(
    `Buongiorno [nomeOspite], oggi è il tuo giorno di arrivo a [nomeAlloggio].\n` +
    `Lella è disponibile in loco per il check-in: +39 339 430 4429\n` +
    `Se hai bisogno di me sono raggiungibile su questo numero.\n` +
    `Benvenuto, Raffaele — RS Hospitality`,
    vars
  );

/** Inviato il secondo giorno di soggiorno */
export const midStayTemplate = (vars: TemplateVars) =>
  fill(
    `Ciao [nomeOspite], come stai trovando [nomeAlloggio]?\n` +
    `Se c'è qualcosa che non va o che posso migliorare, dimmelo adesso.\n` +
    `Raffaele — RS Hospitality`,
    vars
  );

/** Inviato la mattina del giorno di partenza */
export const checkOutTemplate = (vars: TemplateVars) =>
  fill(
    `Buongiorno [nomeOspite], oggi è il tuo ultimo giorno a [nomeAlloggio].\n` +
    `Check-out entro le 11:00 — lascia le chiavi sul tavolo.\n` +
    `È stato un piacere averti qui. Buon viaggio, Raffaele — RS Hospitality`,
    vars
  );

/** Inviato 24 ore dopo il checkout */
export const reviewTemplate = (vars: TemplateVars) =>
  fill(
    `Ciao [nomeOspite], spero il soggiorno a [nomeAlloggio] sia stato di tuo gradimento.\n` +
    `Se hai un minuto, una recensione su Booking o Airbnb ci aiuta molto.\n` +
    `Grazie, Raffaele — RS Hospitality`,
    vars
  );
