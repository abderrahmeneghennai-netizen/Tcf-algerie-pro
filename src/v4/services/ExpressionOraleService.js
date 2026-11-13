/**
 * TCF ALGÉRIE PRO V4.0 — Sujets et productions d'expression orale.
 * Utilise exclusivement les tables et colonnes du schéma SQLite validé.
 */
export class ExpressionOraleService {
  constructor(database) {
    this.database = database;
  }

  async listSubjects(level = 'B1') {
    if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
      throw new TypeError('Niveau invalide.');
    }
    const result = await this.database.query(
      `SELECT s.id, s.stable_code, s.niveau, s.consigne, s.duree_minutes,
              s.nb_mots_attendu, s.grille_evaluation_json
       FROM sujets_expression s
       INNER JOIN packs p ON p.id = s.pack_id
       INNER JOIN modules m ON m.id = s.module_id
       WHERE m.code = 'EO' AND s.niveau = ?
         AND s.is_archived = 0 AND p.is_premium = 0
       ORDER BY s.stable_code COLLATE NOCASE ASC`,
      [level]
    );
    return result.values ?? [];
  }

  async saveProduction({ subject, transcript, selfAssessment = '' }) {
    if (!subject?.id || !subject?.stable_code || !subject?.consigne) {
      throw new TypeError('Le sujet oral sélectionné est invalide.');
    }
    const text = String(transcript ?? '').trim();
    if (!text) throw new Error('Ajoutez une transcription ou quelques notes avant de sauvegarder.');
    await this.database.run(
      `INSERT INTO user_productions
        (sujet_id, sujet_code, consigne_originale, module_code, niveau,
         contenu_texte, audio_path, autoevaluation_note)
       VALUES (?, ?, ?, 'EO', ?, ?, NULL, ?)`,
      [subject.id, subject.stable_code, subject.consigne, subject.niveau, text, String(selfAssessment)]
    );
    return true;
  }
}
