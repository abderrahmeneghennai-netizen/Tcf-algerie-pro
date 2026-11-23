/**
 * Tarification Premium TCF ALGÉRIE PRO V4.0.
 * Un achat débloque un seul parcours d'examen.
 * Ce fichier décrit les offres ; il ne déclenche aucun paiement.
 */
export const PREMIUM_EXAMENS = Object.freeze([
  { id: "TCF_CANADA", label: "TCF Canada" },
  { id: "TCF_QUEBEC", label: "TCF Québec" },
  { id: "TCF_TOUT_PUBLIC", label: "TCF Tout Public – France" },
  { id: "TCF_IRN", label: "TCF IRN" }
]);

export const PREMIUM_DURATIONS = Object.freeze([
  { id: "1_MONTH", months: 1, days: 30, priceDA: 700, label: "1 mois" },
  { id: "3_MONTHS", months: 3, days: 90, priceDA: 1800, label: "3 mois" }
]);

/**
 * Construit les offres disponibles pour un examen donné.
 * L'accès aux autres examens reste indépendant.
 */
export function getPremiumOffers(examId) {
  const exam = PREMIUM_EXAMENS.find(item => item.id === examId);
  if (!exam) return [];

  return PREMIUM_DURATIONS.map(duration => ({
    examId: exam.id,
    examLabel: exam.label,
    durationId: duration.id,
    durationLabel: duration.label,
    months: duration.months,
    durationDays: duration.days,
    priceDA: duration.priceDA,
    accessScope: [exam.id]
  }));
}
