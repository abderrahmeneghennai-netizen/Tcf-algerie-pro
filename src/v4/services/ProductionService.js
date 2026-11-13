/**
 * TCF ALGÉRIE PRO V4.0 — Sauvegarde des productions EE et EO.
 * Le snapshot est conservé même si le sujet est mis à jour ultérieurement.
 */
export class ProductionService {
  constructor(database) {
    this.database = database;
  }

  async save({
    subjectId,
    subjectCode,
    originalInstruction,
    moduleCode,
    level,
    text = null,
    audioPath = null,
    selfAssessment = null
  }) {
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      throw new TypeError('subjectId doit être un entier positif.');
    }
    if (!subjectCode || !originalInstruction || !moduleCode || !level) {
      throw new TypeError('Les informations du sujet sont incomplètes.');
    }

    return this.database.run(
      `INSERT INTO user_productions
        (sujet_id, sujet_code, consigne_originale, module_code, niveau,
         contenu_texte, audio_path, autoevaluation_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [subjectId, subjectCode, originalInstruction, moduleCode, level,
        text, audioPath, selfAssessment]
    );
  }

  async list({ moduleCode = null, limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const result = moduleCode
      ? await this.database.query(
          `SELECT * FROM user_productions WHERE module_code = ?
           ORDER BY id DESC LIMIT ? OFFSET ?`,
          [moduleCode, safeLimit, safeOffset]
        )
      : await this.database.query(
          `SELECT * FROM user_productions
           ORDER BY id DESC LIMIT ? OFFSET ?`,
          [safeLimit, safeOffset]
        );
    return result.values ?? [];
  }
}
