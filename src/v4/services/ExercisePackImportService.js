/**
 * Import idempotent d'un lot pédagogique versionné.
 * N'ajoute aucune table et ne modifie jamais le schéma SQLite.
 */
import { BATCH_001 } from '../data/batch-001.js';
import { BATCH_002 } from '../data/batch-002.js';
import { BATCH_003 } from '../data/batch-003.js';
import { BATCH_004_EDITORIAL_60 } from '../data/batch-004-editorial-60.js';
import { BATCH_004_EDITORIAL } from '../data/batch-004-editorial.js';

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


  async importThirdBatch() {
    const data = BATCH_003;
    if (data.exercises.length !== 500) {
      throw new Error('Le lot 003 doit contenir exactement 500 exercices.');
    }
    const ids = new Set();
    for (const item of data.exercises) {
      if (ids.has(item.id)) throw new Error('Identifiant dupliqué dans le lot 003 : ' + item.id);
      ids.add(item.id);
      if (item.module !== 'GRAM' || !['B1', 'B2'].includes(item.level) ||
          !Array.isArray(item.options) || item.options.length !== 4 ||
          new Set(item.options).size !== 4 || !item.options.includes(item.answer) ||
          !item.prompt || !item.explanation) {
        throw new Error('Exercice invalide dans le lot 003 : ' + item.id);
      }
    }
    const moduleResult = await this.database.query(
      "SELECT id FROM modules WHERE code='GRAM' LIMIT 1"
    );
    const moduleId = moduleResult.values?.[0]?.id;
    if (!moduleId) throw new Error('Le module Grammaire doit être initialisé avant le lot 003.');

    await this.database.transaction(async db => {
      await db.run(
        "INSERT OR IGNORE INTO packs (code,name,is_premium,description) VALUES (?,?,0,?)",
        [data.code, data.name, data.description]
      );
      const packResult = await db.query("SELECT id FROM packs WHERE code=? LIMIT 1", [data.code]);
      const packId = packResult.values?.[0]?.id;
      if (!packId) throw new Error('Impossible de créer le pack du lot 003.');
      await db.run(
        "INSERT OR IGNORE INTO pack_versions (pack_id,version_number,checksum) VALUES (?,?,?)",
        [packId, 1, 'tcf-v4-lot-003-500-gram-vocab']
      );
      let ordinal = 0;
      for (const item of data.exercises) {
        ordinal += 1;
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id,pack_id,module_id,support_ecrit_id,chapitre,niveau,difficulte,shuffle_key,
             enonce,options_json,bonne_reponse,explication,is_archived)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
          [item.id, packId, moduleId, null, item.chapter, item.level, item.difficulty,
            300000 + ordinal, item.prompt, JSON.stringify(item.options), item.answer, item.explanation]
        );
      }
    });

    const count = await this.database.query(
      "SELECT COUNT(*) AS total FROM exercices WHERE pack_id=(SELECT id FROM packs WHERE code=?)",
      [data.code]
    );
    const actual = Number(count.values?.[0]?.total ?? 0);
    if (actual !== 500) {
      throw new Error('Le contrôle du lot 003 a échoué : ' + actual + '/500 exercices présents.');
    }
    return { code: data.code, imported: actual, expected: 500 };
  }


  async importFourthBatch() {
    const data = BATCH_004_EDITORIAL_60;
    const expected = { ce: 20, co: 20, ee: 10, eo: 10, gram: 40 };
    for (const [kind, count] of Object.entries(expected)) {
      if (!Array.isArray(data[kind]) || data[kind].length !== count) {
        throw new Error('Lot 004 invalide : ' + kind + ' doit contenir ' + count + ' activités.');
      }
    }
    const allIds = [
      ...data.ce.map((x, i) => 'l004-ce-' + String(i + 1).padStart(3, '0')),
      ...data.co.map((x, i) => 'l004-co-' + String(i + 1).padStart(3, '0')),
      ...data.ee.map(x => x.id), ...data.eo.map(x => x.id), ...BATCH_004_EDITORIAL.exercises.map(x => x.id)
    ];
    if (new Set(allIds).size !== 100) throw new Error('Identifiants dupliqués dans le lot 004.');

    for (const [kind, rows] of Object.entries({ ce: data.ce, co: data.co })) {
      for (const [index, item] of rows.entries()) {
        if (!['B1', 'B2'].includes(item.level) ||
            !Array.isArray(item.options) || item.options.length !== 4 ||
            new Set(item.options).size !== 4 ||
            !Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3 ||
            !item.prompt || !item.explanation ||
            (kind === 'ce' ? !item.support : !item.transcript)) {
          throw new Error('Question invalide dans le lot 004 (' + kind + ', ' + (index + 1) + ').');
        }
      }
    }
    for (const item of BATCH_004_EDITORIAL.exercises) {
      if (item.module !== 'GRAM' || !['B1','B2'].includes(item.level) || !item.prompt ||
          !item.explanation || !Array.isArray(item.options) || item.options.length !== 4 ||
          new Set(item.options).size !== 4 || !item.options.includes(item.answer)) {
        throw new Error('QCM grammaire/vocabulaire invalide dans le lot 004 : ' + item.id);
      }
    }
    for (const [kind, rows] of Object.entries({ ee: data.ee, eo: data.eo })) {
      for (const item of rows) {
        if (!['B1', 'B2'].includes(item.level) || !item.task ||
            !Array.isArray(item.criteria) || item.criteria.length < 3 ||
            (kind === 'ee' && !(item.minWords > 0 && item.maxWords >= item.minWords)) ||
            (kind === 'eo' && !(item.durationMinutes > 0))) {
          throw new Error('Sujet ouvert invalide dans le lot 004 : ' + item.id);
        }
      }
    }

    const modules = await this.database.query(
      "SELECT id, code FROM modules WHERE code IN ('GRAM','CE','CO','EE','EO') AND is_active=1"
    );
    const moduleIds = Object.fromEntries((modules.values ?? []).map(row => [row.code, row.id]));
    for (const code of ['GRAM','CE','CO','EE','EO']) {
      if (!moduleIds[code]) throw new Error('Module ' + code + ' non initialisé avant le lot 004.');
    }

    const packCode = 'pack_v4_lot_004';
    await this.database.transaction(async db => {
      await db.run(
        "INSERT OR IGNORE INTO packs (code,name,is_premium,description) VALUES (?,?,0,?)",
        [packCode, 'Lot 004 — 100 activités éditoriales', '40 QCM de grammaire/vocabulaire, 20 CE, 20 CO, 10 EE et 10 EO.']
      );
      const packResult = await db.query("SELECT id FROM packs WHERE code=? LIMIT 1", [packCode]);
      const packId = packResult.values?.[0]?.id;
      if (!packId) throw new Error('Impossible de créer le pack du lot 004.');
      await db.run(
        "INSERT OR IGNORE INTO pack_versions (pack_id,version_number,checksum) VALUES (?,?,?)",
        [packId, 1, 'tcf-v4-lot-004-100-editorial-items']
      );

      const supportIds = {};
      for (let i = 0; i < data.ce.length; i++) {
        const item = data.ce[i];
        const code = 'l004-ce-' + String(i + 1).padStart(3, '0');
        await db.run(
          "INSERT OR IGNORE INTO supports_ecrits (pack_id,stable_code,titre,texte_contenu,source,is_archived) VALUES (?,?,?,?,?,0)",
          [packId, code, 'Document CE ' + (i + 1) + ' — ' + item.genre, item.support, 'Texte original — TCF ALGÉRIE PRO']
        );
        const result = await db.query(
          "SELECT id FROM supports_ecrits WHERE pack_id=? AND stable_code=? LIMIT 1",
          [packId, code]
        );
        supportIds[code] = result.values?.[0]?.id;
        if (!supportIds[code]) throw new Error('Support CE introuvable : ' + code);
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id,pack_id,module_id,support_ecrit_id,chapitre,niveau,difficulte,shuffle_key,
             enonce,options_json,bonne_reponse,explication,is_archived)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
          [code, packId, moduleIds.CE, supportIds[code], 'Compréhension écrite — ' + item.genre,
            item.level, item.level === 'B2' ? 4 : 2, 400000 + i + 1, item.prompt,
            JSON.stringify(item.options), item.options[item.answer], item.explanation]
        );
      }

      for (let i = 0; i < data.co.length; i++) {
        const item = data.co[i];
        const code = 'l004-co-' + String(i + 1).padStart(3, '0');
        const duration = Math.max(20, Math.ceil(item.transcript.trim().split(/\\s+/).length / 2.2));
        await db.run(
          "INSERT OR IGNORE INTO fichiers_audio (pack_id,stable_code,chemin_fichier,duree_secondes,transcription,is_archived) VALUES (?,?,?,?,?,0)",
          [packId, code, 'tts://fr-FR/' + code, duration, item.transcript]
        );
        const audioResult = await db.query(
          "SELECT id FROM fichiers_audio WHERE pack_id=? AND stable_code=? LIMIT 1",
          [packId, code]
        );
        const audioId = audioResult.values?.[0]?.id;
        if (!audioId) throw new Error('Support CO introuvable : ' + code);
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id,pack_id,module_id,audio_id,chapitre,niveau,difficulte,shuffle_key,
             enonce,options_json,bonne_reponse,explication,is_archived)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
          [code, packId, moduleIds.CO, audioId, 'Compréhension orale — ' + item.genre,
            item.level, item.level === 'B2' ? 4 : 2, 410000 + i + 1, item.prompt,
            JSON.stringify(item.options), item.options[item.answer], item.explanation]
        );
      }

      for (let i = 0; i < BATCH_004_EDITORIAL.exercises.length; i++) {
        const item = BATCH_004_EDITORIAL.exercises[i];
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id,pack_id,module_id,chapitre,niveau,difficulte,shuffle_key,
             enonce,options_json,bonne_reponse,explication,is_archived)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,0)`,
          [item.id, packId, moduleIds.GRAM, item.chapter, item.level, item.difficulty,
            420000 + i + 1, item.prompt, JSON.stringify(item.options), item.answer, item.explanation]
        );
      }

      for (const item of data.ee) {
        await db.run(
          `INSERT OR IGNORE INTO sujets_expression
            (pack_id,stable_code,module_id,niveau,consigne,duree_minutes,nb_mots_attendu,grille_evaluation_json,is_archived)
           VALUES (?,?,?,?,?,?,?,?,0)`,
          [packId, item.id, moduleIds.EE, item.level, item.task, item.timeMinutes,
            item.minWords + '-' + item.maxWords + ' mots', JSON.stringify(item.criteria)]
        );
      }
      for (const item of data.eo) {
        await db.run(
          `INSERT OR IGNORE INTO sujets_expression
            (pack_id,stable_code,module_id,niveau,consigne,duree_minutes,nb_mots_attendu,grille_evaluation_json,is_archived)
           VALUES (?,?,?,?,?,?,?,?,0)`,
          [packId, item.id, moduleIds.EO, item.level, item.task, item.durationMinutes,
            null, JSON.stringify(item.criteria)]
        );
      }
    });

    const verify = await this.database.query(
      `SELECT
        (SELECT COUNT(*) FROM exercices WHERE pack_id=(SELECT id FROM packs WHERE code=?) AND module_id=?) AS ce,
        (SELECT COUNT(*) FROM exercices WHERE pack_id=(SELECT id FROM packs WHERE code=?) AND module_id=?) AS co,
        (SELECT COUNT(*) FROM exercices WHERE pack_id=(SELECT id FROM packs WHERE code=?) AND module_id=?) AS gram,
        (SELECT COUNT(*) FROM sujets_expression WHERE pack_id=(SELECT id FROM packs WHERE code=?) AND module_id=?) AS ee,
        (SELECT COUNT(*) FROM sujets_expression WHERE pack_id=(SELECT id FROM packs WHERE code=?) AND module_id=?) AS eo`,
      [packCode,moduleIds.CE,packCode,moduleIds.CO,packCode,moduleIds.GRAM,packCode,moduleIds.EE,packCode,moduleIds.EO]
    );
    const totals = verify.values?.[0] ?? {};
    if (Number(totals.ce) !== 20 || Number(totals.co) !== 20 || Number(totals.gram) !== 40 ||
        Number(totals.ee) !== 10 || Number(totals.eo) !== 10) {
      throw new Error('Vérification du lot 004 échouée : ' + JSON.stringify(totals));
    }
    return { code: packCode, imported: 100, breakdown: totals };
  }

}
