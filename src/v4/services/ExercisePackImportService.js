/**
 * Import idempotent d'un lot pédagogique versionné.
 * N'ajoute aucune table et ne modifie jamais le schéma SQLite.
 */
import { BATCH_001 } from '../data/batch-001.js';
import { BATCH_002 } from '../data/batch-002.js';

export class ExercisePackImportService {
  constructor(database) {
    this.database = database;
  }

  async importInitialBatch() {
    const data = BATCH_001;
    const moduleRows = await this.database.query(
      "SELECT id, code FROM modules WHERE code IN ('GRAM','CE')"
    );
    const moduleIds = Object.fromEntries((moduleRows.values ?? []).map(row => [row.code, row.id]));
    if (!moduleIds.GRAM || !moduleIds.CE) {
      throw new Error('Les modules Grammaire et Compréhension écrite doivent être initialisés avant le lot 001.');
    }

    await this.database.transaction(async db => {
      await db.run(
        "INSERT OR IGNORE INTO packs (code,name,is_premium,description) VALUES (?,?,0,?)",
        [data.code, data.name, data.description]
      );
      const packResult = await db.query("SELECT id FROM packs WHERE code=? LIMIT 1", [data.code]);
      const packId = packResult.values?.[0]?.id;
      if (!packId) throw new Error('Impossible de créer le pack du lot 001.');

      await db.run(
        "INSERT OR IGNORE INTO pack_versions (pack_id,version_number,checksum) VALUES (?,?,?)",
        [packId, 1, 'tcf-v4-lot-001-30-items']
      );

      const supportIds = {};
      for (const support of data.supports) {
        await db.run(
          "INSERT OR IGNORE INTO supports_ecrits (pack_id,stable_code,titre,texte_contenu,source,is_archived) VALUES (?,?,?,?,?,0)",
          [packId, support.code, support.title, support.text, 'Texte original — TCF ALGÉRIE PRO']
        );
        const result = await db.query(
          "SELECT id FROM supports_ecrits WHERE pack_id=? AND stable_code=? LIMIT 1",
          [packId, support.code]
        );
        supportIds[support.code] = result.values?.[0]?.id;
      }

      let ordinal = 0;
      for (const item of data.exercises) {
        ordinal += 1;
        const moduleId = moduleIds[item.module];
        if (!moduleId) throw new Error('Module inconnu dans le lot 001 : ' + item.module);
        const supportId = item.support ? supportIds[item.support] : null;
        if (item.module === 'CE' && !supportId) throw new Error('Support CE absent pour ' + item.id);
        if (!Array.isArray(item.options) || item.options.length !== 4 || !item.options.includes(item.answer)) {
          throw new Error('Format ou corrigé invalide pour ' + item.id);
        }
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id,pack_id,module_id,support_ecrit_id,chapitre,niveau,difficulte,shuffle_key,enonce,options_json,bonne_reponse,explication,is_archived)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
          [item.id, packId, moduleId, supportId, item.chapter, item.level, item.difficulty,
            100000 + ordinal, item.prompt, JSON.stringify(item.options), item.answer, item.explanation]
        );
      }
    });

    const count = await this.database.query(
      "SELECT COUNT(*) AS total FROM exercices WHERE pack_id=(SELECT id FROM packs WHERE code=?)",
      [data.code]
    );
    const actual = Number(count.values?.[0]?.total ?? 0);
    if (actual !== data.exercises.length) {
      throw new Error('Le contrôle du lot 001 a échoué : ' + actual + '/' + data.exercises.length + ' exercices présents.');
    }
    return { code: data.code, imported: actual, expected: data.exercises.length };
  }
  async importSecondBatch() {
    const data = BATCH_002;
    const moduleResult = await this.database.query(
      "SELECT id FROM modules WHERE code='CE' LIMIT 1"
    );
    const moduleId = moduleResult.values?.[0]?.id;
    if (!moduleId) throw new Error('Le module CE doit être initialisé avant le lot 002.');

    await this.database.transaction(async db => {
      await db.run(
        "INSERT OR IGNORE INTO packs (code,name,is_premium,description) VALUES (?,?,0,?)",
        [data.code, data.name, data.description]
      );
      const packResult = await db.query("SELECT id FROM packs WHERE code=? LIMIT 1", [data.code]);
      const packId = packResult.values?.[0]?.id;
      if (!packId) throw new Error('Impossible de créer le pack du lot 002.');

      await db.run(
        "INSERT OR IGNORE INTO pack_versions (pack_id,version_number,checksum) VALUES (?,?,?)",
        [packId, 1, 'tcf-v4-lot-002-500-ce-items']
      );

      const supportIds = {};
      for (const support of data.supports) {
        await db.run(
          "INSERT OR IGNORE INTO supports_ecrits (pack_id,stable_code,titre,texte_contenu,source,is_archived) VALUES (?,?,?,?,?,0)",
          [packId, support.code, support.title, support.text, 'Support pédagogique original — TCF ALGÉRIE PRO']
        );
        const result = await db.query(
          "SELECT id FROM supports_ecrits WHERE pack_id=? AND stable_code=? LIMIT 1",
          [packId, support.code]
        );
        supportIds[support.code] = result.values?.[0]?.id;
        if (!supportIds[support.code]) throw new Error('Support absent : ' + support.code);
      }

      if (data.exercises.length !== 500) {
        throw new Error('Le lot 002 doit contenir exactement 500 exercices.');
      }
      let ordinal = 0;
      for (const item of data.exercises) {
        ordinal += 1;
        const supportId = supportIds[item.support];
        if (!supportId) throw new Error('Support CE absent pour ' + item.id);
        if (!Array.isArray(item.options) || item.options.length !== 4 ||
            new Set(item.options).size !== 4 || !item.options.includes(item.answer)) {
          throw new Error('Format ou corrigé invalide pour ' + item.id);
        }
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id,pack_id,module_id,support_ecrit_id,chapitre,niveau,difficulte,shuffle_key,
             enonce,options_json,bonne_reponse,explication,is_archived)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
          [item.id, packId, moduleId, supportId, item.chapter, item.level, item.difficulty,
            200000 + ordinal, item.prompt, JSON.stringify(item.options), item.answer, item.explanation]
        );
      }
    });

    const count = await this.database.query(
      "SELECT COUNT(*) AS total FROM exercices WHERE pack_id=(SELECT id FROM packs WHERE code=?)",
      [data.code]
    );
    const actual = Number(count.values?.[0]?.total ?? 0);
    if (actual !== 500) {
      throw new Error('Le contrôle du lot 002 a échoué : ' + actual + '/500 exercices présents.');
    }
    return { code: data.code, imported: actual, expected: 500 };
  }

}
