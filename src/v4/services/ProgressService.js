/**
 * TCF ALGÉRIE PRO V4.0 — Historique, statistiques et favoris.
 */
export class ProgressService {
  constructor(database) {
    this.database = database;
  }

  async recordAnswer({
    exercise,
    questionSnapshot,
    answer,
    isCorrect,
    elapsedSeconds = 0,
    nextReviewAt = null
  }) {
    if (!exercise || !Number.isInteger(exercise.id) || !Number.isInteger(exercise.module_id)) {
      throw new TypeError('Un exercice valide est requis.');
    }
    if (typeof questionSnapshot !== 'object' || questionSnapshot === null) {
      throw new TypeError('Le snapshot de la question est obligatoire.');
    }
    if (!Number.isInteger(elapsedSeconds) || elapsedSeconds < 0) {
      throw new RangeError('Le temps passé doit être un entier positif ou nul.');
    }

    const correct = isCorrect ? 1 : 0;
    const snapshotJson = JSON.stringify(questionSnapshot);

    return this.database.transaction(async (db) => {
      await db.run(
        `INSERT INTO user_history
          (exercice_id, question_snapshot_json, reponse_donnee, est_correct, temps_passe_secondes)
         VALUES (?, ?, ?, ?, ?)`,
        [exercise.id, snapshotJson, answer ?? null, correct, elapsedSeconds]
      );

      await db.run(
        `INSERT INTO user_exercise_stats
          (exercice_id, derniere_vue, nombre_essais, nombre_succes,
           consecutive_succes, prochaine_revision)
         VALUES (?, datetime('now'), 1, ?, ?, ?)
         ON CONFLICT(exercice_id) DO UPDATE SET
           derniere_vue = datetime('now'),
           nombre_essais = user_exercise_stats.nombre_essais + 1,
           nombre_succes = user_exercise_stats.nombre_succes + excluded.nombre_succes,
           consecutive_succes = CASE
             WHEN ? = 1 THEN user_exercise_stats.consecutive_succes + 1
             ELSE 0
           END,
           prochaine_revision = excluded.prochaine_revision`,
        [exercise.id, correct, correct, nextReviewAt, correct]
      );

      await db.run(
        `INSERT INTO user_global_stats
          (module_id, total_tentees, total_reussies)
         VALUES (?, 1, ?)
         ON CONFLICT(module_id) DO UPDATE SET
           total_tentees = user_global_stats.total_tentees + 1,
           total_reussies = user_global_stats.total_reussies + excluded.total_reussies`,
        [exercise.module_id, correct]
      );
    });
  }

  async listHistory({ limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const result = await this.database.query(
      `SELECT h.*, e.stable_id, e.module_id, e.niveau
       FROM user_history h
       INNER JOIN exercices e ON e.id = h.exercice_id
       ORDER BY h.id DESC
       LIMIT ? OFFSET ?`,
      [safeLimit, safeOffset]
    );
    return result.values ?? [];
  }

  async getModuleStats(moduleId) {
    const result = await this.database.query(
      `SELECT module_id, total_tentees, total_reussies, niveau_estime
       FROM user_global_stats WHERE module_id = ? LIMIT 1`,
      [moduleId]
    );
    return result.values?.[0] ?? null;
  }

  async setFavorite(exerciseId) {
    return this.database.run(
      `INSERT OR IGNORE INTO favoris (exercice_id) VALUES (?)`,
      [exerciseId]
    );
  }

  async removeFavorite(exerciseId) {
    return this.database.run(
      `DELETE FROM favoris WHERE exercice_id = ?`,
      [exerciseId]
    );
  }

  async listFavorites() {
    const result = await this.database.query(
      `SELECT e.*, f.date_ajout
       FROM favoris f
       INNER JOIN exercices e ON e.id = f.exercice_id
       WHERE e.is_archived = 0
       ORDER BY f.date_ajout DESC`
    );
    return result.values ?? [];
  }
}
