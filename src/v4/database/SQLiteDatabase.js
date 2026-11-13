/**
 * TCF ALGÉRIE PRO V4.0 — Adaptateur SQLite natif.
 *
 * Compatible avec Capacitor 6 et @capacitor-community/sqlite 6.0.2.
 * Le schéma SQL est fourni à open() depuis le fichier validé :
 * database/schema-v4.sql. Ce module ne crée/modifie aucune colonne.
 */
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const DATABASE_NAME = 'tcf_algerie_pro';
const DATABASE_VERSION = 1;

function assertSqlText(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError('Le schéma SQLite fourni est vide ou invalide.');
  }
}

function removePragmaStatements(sql) {
  return sql.replace(/^\s*PRAGMA\b[^;]*;\s*/gim, '').trim();
}

export class SQLiteDatabase {
  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.connection = null;
    this.opening = null;
  }

  async open(schemaSql) {
    assertSqlText(schemaSql);
    if (this.connection) return this.connection;
    if (this.opening) return this.opening;

    this.opening = this.#openInternal(schemaSql);
    try {
      this.connection = await this.opening;
      return this.connection;
    } finally {
      this.opening = null;
    }
  }

  async #openInternal(schemaSql) {
    const connection = await this.sqlite.createConnection(
      DATABASE_NAME,
      false,
      'no-encryption',
      DATABASE_VERSION,
      false
    );

    try {
      await connection.open();

      // Les PRAGMA sont exécutés hors transaction.
      // foreign_keys doit être activé sur chaque connexion.
      await connection.execute('PRAGMA foreign_keys = ON;', false);
      await connection.execute('PRAGMA synchronous = NORMAL;', false);
      // journal_mode = WAL renvoie une ligne de résultat : utiliser query(),
      // car execute() passe par execSQL() et refuse les requêtes avec résultat.
      await connection.query('PRAGMA journal_mode = WAL;');

      // Le fichier source conserve les PRAGMA d'origine. Ils ont déjà été
      // appliqués ci-dessus; on exécute ici uniquement les CREATE TABLE.
      const tableStatements = removePragmaStatements(schemaSql);
      if (tableStatements.length === 0) {
        throw new Error('Aucune instruction de création de table trouvée.');
      }
      await connection.execute(tableStatements, true);

      const fk = await connection.query('PRAGMA foreign_keys;');
      if (Number(fk.values?.[0]?.foreign_keys) !== 1) {
        throw new Error('La vérification des clés étrangères SQLite a échoué.');
      }

      return connection;
    } catch (error) {
      try {
        await connection.close();
        await this.sqlite.closeConnection(DATABASE_NAME, false);
      } catch {
        // Préserver l'erreur initiale.
      }
      throw error;
    }
  }

  getConnection() {
    if (!this.connection) {
      throw new Error('La base SQLite n’est pas encore ouverte.');
    }
    return this.connection;
  }

  query(statement, values = []) {
    return this.getConnection().query(statement, values);
  }

  run(statement, values = []) {
    return this.getConnection().run(statement, values);
  }

  execute(statement, transaction = true) {
    return this.getConnection().execute(statement, transaction);
  }

  async transaction(callback) {
    const db = this.getConnection();
    await db.beginTransaction();
    try {
      const result = await callback(db);
      await db.commitTransaction();
      return result;
    } catch (error) {
      await db.rollbackTransaction();
      throw error;
    }
  }

  async close() {
    if (!this.connection) return;
    await this.connection.close();
    await this.sqlite.closeConnection(DATABASE_NAME, false);
    this.connection = null;
  }
}

export const sqliteDatabase = new SQLiteDatabase();
