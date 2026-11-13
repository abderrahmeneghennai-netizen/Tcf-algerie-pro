/**
 * TCF ALGÉRIE PRO V4.0 — Catalogue des modules.
 */
export class ModuleService {
  constructor(database) {
    this.database = database;
  }

  async listActive() {
    const result = await this.database.query(
      `SELECT id, code, name, is_active
       FROM modules
       WHERE is_active = 1
       ORDER BY id ASC`
    );
    return result.values ?? [];
  }

  async getByCode(code) {
    const result = await this.database.query(
      `SELECT id, code, name, is_active
       FROM modules WHERE code = ? LIMIT 1`,
      [code]
    );
    return result.values?.[0] ?? null;
  }
}
