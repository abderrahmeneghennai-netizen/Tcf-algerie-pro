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
      await connection.execute('PRAGMA foreign_keys = ON;', false);
      await connection.execute('PRAGMA synchronous = NORMAL;', false);
      // journal_mode renvoie une ligne : query() est obligatoire.
      await connection.query('PRAGMA journal_mode = WAL;');

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

  // Hors transaction explicite, run() conserve son comportement transactionnel
  // par défaut. Le troisième argument permet de le désactiver dans un lot.
  run(statement, values = [], transaction = true) {
    return this.getConnection().run(statement, values, transaction);
  }

  execute(statement, transaction = true) {
    return this.getConnection().execute(statement, transaction);
  }

  async transaction(callback) {
    const db = this.getConnection();
    await db.beginTransaction();

    // IMPORTANT : run()/execute() sont transactionnels par défaut dans le
    // plugin. À l'intérieur de cette transaction manuelle, ils doivent donc
    // recevoir transaction=false, sinon SQLite tente une transaction imbriquée.
    const transactionDb = {
      query: (statement, values = []) => db.query(statement, values),
      run: (statement, values = []) => db.run(statement, values, false),
      execute: (statement) => db.execute(statement, false)
    };

    try {
      const result = await callback(transactionDb);
      await db.commitTransaction();
      return result;
    } catch (error) {
      try {
        if (await db.isTransactionActive()) {
          await db.rollbackTransaction();
        }
      } catch {
        // Préserver l'erreur initiale si le rollback échoue également.
      }
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
