/**
 * TCF ALGÉRIE PRO V4.0 — Sélection stable et pagination circulaire.
 * Le curseur est persisté dans user_selection_cursor, sans modifier le schéma.
 */
export class ExerciseService {
  constructor(database) {
    this.database = database;
  }

  async getNextBatch({ moduleId, level, limit = 10, premiumAccess = false }) {
    if (!Number.isInteger(moduleId) || moduleId <= 0) {
      throw new TypeError('moduleId doit être un entier positif.');
    }
    if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
      throw new TypeError('Niveau invalide.');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new RangeError('La taille du lot doit être comprise entre 1 et 100.');
    }

    const cursorResult = await this.database.query(
      `SELECT last_shuffle_key, last_id
       FROM user_selection_cursor
       WHERE module_id = ? AND niveau = ?`,
      [moduleId, level]
    );
    const cursor = cursorResult.values?.[0] ?? null;

    const baseSql = `SELECT e.*, p.code AS pack_code, p.is_premium
      FROM exercices e
      INNER JOIN packs p ON p.id = e.pack_id
      WHERE e.module_id = ?
        AND e.niveau = ?
        AND e.is_archived = 0
        AND (? = 1 OR p.is_premium = 0)`;

    let rows = [];
    if (cursor) {
      const next = await this.database.query(
        `${baseSql}
          AND (e.shuffle_key > ? OR (e.shuffle_key = ? AND e.id > ?))
          ORDER BY e.shuffle_key ASC, e.id ASC
          LIMIT ?`,
        [moduleId, level, premiumAccess ? 1 : 0,
          cursor.last_shuffle_key, cursor.last_shuffle_key, cursor.last_id, limit]
      );
      rows = next.values ?? [];
    }

    // Si la fin est atteinte, reprendre au début sans répéter les éléments du lot.
    if (rows.length < limit) {
      const remaining = limit - rows.length;
      const wrapParams = [moduleId, level, premiumAccess ? 1 : 0];
      let wrapCondition = '';
      if (cursor) {
        wrapCondition = ` AND (e.shuffle_key < ? OR (e.shuffle_key = ? AND e.id <= ?))`;
        wrapParams.push(cursor.last_shuffle_key, cursor.last_shuffle_key, cursor.last_id);
      }
      if (rows.length > 0) {
        const ids = rows.map((row) => row.id);
        wrapCondition += ` AND e.id NOT IN (${ids.map(() => '?').join(',')})`;
        wrapParams.push(...ids);
      }
      wrapParams.push(remaining);
      const wrapped = await this.database.query(
        `${baseSql}${wrapCondition}
          ORDER BY e.shuffle_key ASC, e.id ASC
          LIMIT ?`,
        wrapParams
      );
      rows = rows.concat(wrapped.values ?? []);
    }

    if (rows.length > 0) {
      const last = rows[rows.length - 1];
      await this.database.run(
        `INSERT INTO user_selection_cursor
          (module_id, niveau, last_shuffle_key, last_id, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(module_id, niveau) DO UPDATE SET
           last_shuffle_key = excluded.last_shuffle_key,
           last_id = excluded.last_id,
           updated_at = datetime('now')`,
        [moduleId, level, last.shuffle_key, last.id]
      );
    }

    return rows;
  }

  async getById(exerciseId) {
    const result = await this.database.query(
      `SELECT e.*, p.code AS pack_code, p.is_premium,
              m.code AS module_code, m.name AS module_name
       FROM exercices e
       INNER JOIN packs p ON p.id = e.pack_id
       INNER JOIN modules m ON m.id = e.module_id
       WHERE e.id = ? AND e.is_archived = 0
       LIMIT 1`,
      [exerciseId]
    );
    return result.values?.[0] ?? null;
  }
}
