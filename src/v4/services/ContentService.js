/**
 * TCF ALGÉRIE PRO V4.0 — Consultation des supports CE, audios CO et sujets EE/EO.
 */
export class ContentService {
  constructor(database) {
    this.database = database;
  }

  async getWrittenSupport(id, { premiumAccess = false } = {}) {
    const result = await this.database.query(
      `SELECT s.id, s.pack_id, s.stable_code, s.titre, s.texte_contenu, s.source
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
      `SELECT a.id, a.pack_id, a.stable_code, a.chemin_fichier,
              a.duree_secondes, a.transcription
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
      `SELECT s.id, s.pack_id, s.stable_code, s.module_id, s.niveau, s.consigne,
              s.duree_minutes, s.nb_mots_attendu, s.grille_evaluation_json
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
