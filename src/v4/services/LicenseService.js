/**
 * TCF ALGÉRIE PRO V4.0 — Stockage et contrôle de validité de licence hors ligne.
 *
 * La vérification cryptographique doit être fournie par l'application avec
 * une clé publique officielle. Aucune clé ni signature n'est inventée ici.
 */
export class LicenseService {
  constructor(database, verifySignature) {
    if (typeof verifySignature !== 'function') {
      throw new TypeError('Une fonction de vérification de signature est obligatoire.');
    }
    this.database = database;
    this.verifySignature = verifySignature;
  }

  async activate({ licenseKeyText, expirationDate, signatureB64 }) {
    if (!licenseKeyText || !expirationDate || !signatureB64) {
      throw new TypeError('Les informations de licence sont incomplètes.');
    }

    const expiration = new Date(expirationDate);
    if (Number.isNaN(expiration.getTime())) {
      throw new TypeError('La date d’expiration de la licence est invalide.');
    }

    const validSignature = await this.verifySignature({
      licenseKeyText,
      expirationDate,
      signatureB64
    });
    if (validSignature !== true) {
      throw new Error('La signature de la licence est invalide.');
    }
    if (expiration.getTime() <= Date.now()) {
      throw new Error('Cette licence est expirée.');
    }

    await this.database.transaction(async (db) => {
      await db.run(
        `UPDATE app_licenses SET is_active = 0 WHERE is_active = 1`
      );

      await db.run(
        `INSERT INTO app_licenses
          (license_key_text, expiration_date, signature_b64, is_active)
         VALUES (?, ?, ?, 1)`,
        [licenseKeyText, expirationDate, signatureB64]
      );
    });

    return this.getActiveLicense();
  }

  async getActiveLicense() {
    const result = await this.database.query(
      `SELECT id, license_key_text, expiration_date, signature_b64,
              is_active, date_activation
       FROM app_licenses
       WHERE is_active = 1
       ORDER BY id DESC
       LIMIT 1`
    );
    const license = result.values?.[0] ?? null;
    if (!license) return null;

    const expiration = new Date(license.expiration_date);
    if (Number.isNaN(expiration.getTime()) || expiration.getTime() <= Date.now()) {
      await this.database.run(
        `UPDATE app_licenses SET is_active = 0 WHERE id = ?`,
        [license.id]
      );
      return null;
    }

    const validSignature = await this.verifySignature({
      licenseKeyText: license.license_key_text,
      expirationDate: license.expiration_date,
      signatureB64: license.signature_b64
    });
    if (validSignature !== true) {
      await this.database.run(
        `UPDATE app_licenses SET is_active = 0 WHERE id = ?`,
        [license.id]
      );
      return null;
    }

    return license;
  }
}
