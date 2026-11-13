/**
 * TCF ALGÉRIE PRO V4.0 — Consultation des supports CE, audios CO et sujets EE/EO.
 */
export class ContentService {
  constructor(database) {
    this.database = database;
  }

  async getWrittenSupport(id) {
    const result = await this.database.query(
      `SELECT id, pack_id, stable_code, titre, texte_contenu, source
       FROM supports_ecrits
       WHERE id = ? AND is_archived = 0
       LIMIT 1`,
      [id]
    );
    return result.values?.[0] ?? null;
  }

  async getAudio(id) {
    const result = await this.database.query(
      `SELECT id, pack_id, stable_code, chemin_fichier,
              duree_secondes, transcription
       FROM fichiers_audio
       WHERE id = ? AND is_archived = 0
       LIMIT 1`,
      [id]
    );
    return result.values?.[0] ?? null;
  }

  async getExpressionSubject(id) {
    const result = await this.database.query(
      `SELECT id, pack_id, stable_code, module_id, niveau, consigne,
              duree_minutes, nb_mots_attendu, grille_evaluation_json
       FROM sujets_expression
       WHERE id = ? AND is_archived = 0
       LIMIT 1`,
      [id]
    );
    return result.values?.[0] ?? null;
  }
}
