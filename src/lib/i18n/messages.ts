/**
 * Messaggi delle Server Actions nelle due lingue.
 * Le actions leggono la lingua dal cookie (getLang in ./server) e
 * restituiscono errori già localizzati al client.
 */

import type { Lang } from "./index";

export interface ActionMessages {
  invalidData: string;
  sessionExpired: string;
  saveFailed: string;
  imageInvalid: string;
  updateFailed: string;
  // agenda
  confirmFailed: string;
  apptNotFound: string;
  apptNotAwaiting: string;
  statusChanged: string;
  // team / turni
  professionalNotFound: string;
  professionalInvalid: string;
  addShiftFailed: string;
  removeShiftFailed: string;
  addBreakFailed: string;
  removeBreakFailed: string;
  // onboarding
  slugTaken: string;
  createFailed: string;
  // annullamento pubblico
  linkInvalid: string;
  cancelFailed: string;
  cancelDeadline: (hours: number) => string;
  // billing (Stripe)
  alreadyActive: string;
  paymentsNotConfigured: string;
  checkoutFailed: string;
  subSaveError: string;
  stripeComms: string;
  portalFailed: string;
  noSubscription: string;
}

const IT: ActionMessages = {
  invalidData: "Dati non validi.",
  sessionExpired: "Sessione scaduta.",
  saveFailed: "Salvataggio non riuscito. Riprova.",
  imageInvalid: "Immagine non valida.",
  updateFailed: "Aggiornamento non riuscito. Riprova.",
  confirmFailed: "Conferma non riuscita. Riprova.",
  apptNotFound: "Prenotazione non trovata.",
  apptNotAwaiting: "Questa prenotazione non è più in attesa di acconto.",
  statusChanged: "Lo stato di questa prenotazione è cambiato. Ricarica la pagina.",
  professionalNotFound: "Professionista non trovato.",
  professionalInvalid: "Professionista non valido.",
  addShiftFailed: "Aggiunta del turno non riuscita.",
  removeShiftFailed: "Rimozione del turno non riuscita.",
  addBreakFailed: "Aggiunta della pausa non riuscita.",
  removeBreakFailed: "Rimozione della pausa non riuscita.",
  slugTaken: "Questo indirizzo è già in uso. Scegline un altro.",
  createFailed: "Creazione non riuscita. Riprova.",
  linkInvalid: "Link non valido.",
  cancelFailed: "Annullamento non riuscito. Riprova.",
  cancelDeadline: (h) =>
    `Annullamento non riuscito — il limite è fino a ${h}h prima dell'orario (oppure la prenotazione è già stata chiusa).`,
  alreadyActive: "Il tuo abbonamento è già attivo.",
  paymentsNotConfigured: "Pagamenti non ancora configurati (STRIPE_SECRET_KEY).",
  checkoutFailed: "Creazione del checkout non riuscita. Riprova.",
  subSaveError: "Errore nel salvataggio dell'abbonamento. Riprova.",
  stripeComms: "Comunicazione con Stripe non riuscita. Riprova.",
  portalFailed: "Apertura del portale non riuscita. Riprova.",
  noSubscription: "Nessun abbonamento da gestire. Abbonati prima.",
};

const EN: ActionMessages = {
  invalidData: "Invalid data.",
  sessionExpired: "Session expired.",
  saveFailed: "Couldn't save. Please try again.",
  imageInvalid: "Invalid image.",
  updateFailed: "Couldn't update. Please try again.",
  confirmFailed: "Couldn't confirm. Please try again.",
  apptNotFound: "Booking not found.",
  apptNotAwaiting: "This booking is no longer awaiting a deposit.",
  statusChanged: "This booking's status has changed. Reload the page.",
  professionalNotFound: "Professional not found.",
  professionalInvalid: "Invalid professional.",
  addShiftFailed: "Couldn't add the shift.",
  removeShiftFailed: "Couldn't remove the shift.",
  addBreakFailed: "Couldn't add the break.",
  removeBreakFailed: "Couldn't remove the break.",
  slugTaken: "This address is already in use. Pick another one.",
  createFailed: "Couldn't create. Please try again.",
  linkInvalid: "Invalid link.",
  cancelFailed: "Couldn't cancel. Please try again.",
  cancelDeadline: (h) =>
    `Couldn't cancel — the limit is up to ${h}h before the appointment (or the booking has already been closed).`,
  alreadyActive: "Your subscription is already active.",
  paymentsNotConfigured: "Payments not configured yet (STRIPE_SECRET_KEY).",
  checkoutFailed: "Couldn't create the checkout. Please try again.",
  subSaveError: "Error saving the subscription. Please try again.",
  stripeComms: "Couldn't reach Stripe. Please try again.",
  portalFailed: "Couldn't open the portal. Please try again.",
  noSubscription: "No subscription to manage. Subscribe first.",
};

export function actionMessages(lang: Lang): ActionMessages {
  return lang === "en" ? EN : IT;
}
