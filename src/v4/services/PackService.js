/**
 * TCF ALGÉRIE PRO V4.0 — Accès aux packs et à leurs versions.
 * Les règles de licence restent séparées de ce service.
 */
export class PackService {
  constructor(database) {
    this.database = database;
  }

  async listAvailable({ premiumAccess = false } = {}) {
    const sql = premiumAccess
      ? `SELECT id, code, name, is_premium, description
         FROM packs ORDER BY is_premium ASC, name COLLATE NOCASE ASC`
      : `SELECT id, code, name, is_premium, description
         FROM packs WHERE is_premium = 0
         ORDER BY name COLLATE NOCASE ASC`;
    const result = await this.database.query(sql);
    return result.values ?? [];
  }

  async getVersion(packId) {
    const result = await this.database.query(
      `SELECT id, pack_id, version_number, checksum, date_maj
       FROM pack_versions
       WHERE pack_id = ?
       ORDER BY version_number DESC
       LIMIT 1`,
      [packId]
    );
    return result.values?.[0] ?? null;
  }

  async listVersions(packId) {
    const result = await this.database.query(
      `SELECT id, pack_id, version_number, checksum, date_maj
       FROM pack_versions
       WHERE pack_id = ?
       ORDER BY version_number DESC`,
      [packId]
    );
    return result.values ?? [];
  }
}
