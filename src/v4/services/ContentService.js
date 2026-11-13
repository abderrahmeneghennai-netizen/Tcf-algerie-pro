/**
 * TCF ALGÉRIE PRO V4.0 — Consultation des supports CE, audios CO et sujets EE/EO.
 */
export class ContentService {
  constructor(database) {
    this.database = database;
  }

  async getWrittenSupport(id, { premiumAccess = false } = {}) {
    const result = await this.database.query(
      `SELECT id, pack_id, stable_code, titre, texte_contenu, source
       FROM supports_ecrits s
       INNER JOIN packs p ON p.id = s.pack_id
       WHERE s.id = ? AND s.is_archived = 0
         AND (? = 1 OR p.is_premium = 0)
       LIMIT 1`,
      [id, premiumAccess ? 1 : 0]
    );
    return result.values?.[0] ?? null;
  }

  async getAudio(id, { premiumAccess = false } = {}) {
    const result = await this.database.query(
      `SELECT id, pack_id, stable_code, chemin_fichier,
              duree_secondes, transcription
       FROM fichiers_audio a
       INNER JOIN packs p ON p.id = a.pack_id
       WHERE a.id = ? AND a.is_archived = 0
         AND (? = 1 OR p.is_premium = 0)
       LIMIT 1`,
      [id, premiumAccess ? 1 : 0]
    );
    return result.values?.[0] ?? null;
  }

  async getExpressionSubject(id, { premiumAccess = false } = {}) {
    const result = await this.database.query(
      `SELECT id, pack_id, stable_code, module_id, niveau, consigne,
              duree_minutes, nb_mots_attendu, grille_evaluation_json
       FROM sujets_expression s
       INNER JOIN packs p ON p.id = s.pack_id
       WHERE s.id = ? AND s.is_archived = 0
         AND (? = 1 OR p.is_premium = 0)
       LIMIT 1`,
      [id, premiumAccess ? 1 : 0]
    );
    return result.values?.[0] ?? null;
  }
}
