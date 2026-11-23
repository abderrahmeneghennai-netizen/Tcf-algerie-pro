/**
 * Audit statique des banques pédagogiques V4.
 * À exécuter depuis la racine : node scripts/audit-exercise-banks.mjs
 * Ce contrôle ne modifie ni les banques ni le schéma SQLite.
 */
import { BATCH_001 } from '../src/v4/data/batch-001.js';
import { BATCH_002 } from '../src/v4/data/batch-002.js';
import { BATCH_003 } from '../src/v4/data/batch-003.js';
import { BATCH_004_EDITORIAL_60 } from '../src/v4/data/batch-004-editorial-60.js';
import { BATCH_004_EDITORIAL } from '../src/v4/data/batch-004-editorial.js';
import { BATCH_005 } from '../src/v4/data/batch-005.js';

const normalize = value => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

const stripLot003Wrapper = value => normalize(value).replace(
  /^(choisissez la bonne reponse|completez correctement|dans cette question selectionnez la reponse juste|quelle reponse convient|retenez la formulation correcte|pour respecter le sens et la grammaire choisissez|quelle proposition complete correctement l enonce|identifiez la reponse attendue|choisissez l option qui convient le mieux|quelle est la bonne solution)\s+/,
  ''
);

const countUnique = values => new Set(values.map(normalize)).size;
const duplicates = values => {
  const seen = new Set();
  let count = 0;
  for (const value of values) {
    const key = normalize(value);
    if (seen.has(key)) count++;
    else seen.add(key);
  }
  return count;
};

const qcm001 = BATCH_001.exercises;
const qcm002 = BATCH_002.exercises;
const qcm003 = BATCH_003.exercises;
const ce004 = BATCH_004_EDITORIAL_60.ce;
const co004 = BATCH_004_EDITORIAL_60.co;
const open004 = [...BATCH_004_EDITORIAL_60.ee, ...BATCH_004_EDITORIAL_60.eo];
const editorial004 = BATCH_004_EDITORIAL.exercises;
const qcm005 = BATCH_005.editorial;
const closed005 = [...BATCH_005.ce, ...BATCH_005.co];
const open005 = [...BATCH_005.ee, ...BATCH_005.eo];

const validQcm = item =>
  Boolean(item.id && item.prompt && item.explanation &&
  Array.isArray(item.options) && item.options.length === 4 &&
  new Set(item.options.map(normalize)).size === 4 &&
  (typeof item.answer === 'number'
    ? Number.isInteger(item.answer) && item.answer >= 0 && item.answer < 4
    : item.options.some(option => normalize(option) === normalize(item.answer))) &&
  ['B1','B2'].includes(item.level));

const issues = [];
for (const [name, rows] of Object.entries({
  'lot-001': qcm001, 'lot-002': qcm002, 'lot-003': qcm003, 'lot-004-gram-vocab': editorial004
})) {
  rows.forEach((item, index) => {
    if (!validQcm(item)) issues.push(name + ' : enregistrement invalide à la position ' + (index + 1) + ' (' + (item.id ?? 'sans ID') + ')');
  });
}
for (const [name, rows] of Object.entries({ 'lot-004-CE': ce004, 'lot-004-CO': co004 })) {
  rows.forEach((item, index) => {
    if (!item.prompt || !item.explanation || !Array.isArray(item.options) ||
        item.options.length !== 4 || new Set(item.options.map(normalize)).size !== 4 ||
        !Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3 ||
        !['B1','B2'].includes(item.level) ||
        (name.endsWith('CE') ? !item.support : !item.transcript)) {
      issues.push(name + ' : enregistrement invalide à la position ' + (index + 1));
    }
  });
}
open004.forEach(item => {
  if (!item.id || !item.task || !['B1','B2'].includes(item.level) ||
      !Array.isArray(item.criteria) || item.criteria.length < 3) {
    issues.push('Lot 004 ouvert : sujet incomplet (' + (item.id ?? 'sans ID') + ')');
  }
});

closed005.forEach((item, index) => {
  if (!item.id || !item.prompt || !item.explanation || !Array.isArray(item.options) ||
      item.options.length !== 4 || new Set(item.options.map(normalize)).size !== 4 ||
      !Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3 ||
      !['A1','A2','B1','B2','C1','C2'].includes(item.level) ||
      (item.support !== undefined && !item.support) ||
      (item.transcript !== undefined && !item.transcript)) {
    issues.push('Lot 005 fermé : enregistrement invalide (' + (item.id ?? index) + ')');
  }
});
qcm005.forEach((item, index) => {
  if (!item.id || item.module !== 'GRAM' || !item.prompt || !item.explanation ||
      !Array.isArray(item.options) || item.options.length !== 4 ||
      new Set(item.options.map(normalize)).size !== 4 ||
      !item.options.some(option => normalize(option) === normalize(item.answer)) ||
      !['A1','A2','B1','B2','C1','C2'].includes(item.level)) {
    issues.push('Lot 005 grammaire/vocabulaire : enregistrement invalide (' + (item.id ?? index) + ')');
  }
});
open005.forEach(item => {
  if (!item.id || !item.task || !['A1','A2','B1','B2','C1','C2'].includes(item.level) ||
      !Array.isArray(item.criteria) || item.criteria.length !== 5 ||
      item.criteria.reduce((sum, c) => sum + Number(c.points || 0), 0) !== 20) {
    issues.push('Lot 005 ouvert : sujet incomplet (' + (item.id ?? 'sans ID') + ')');
  }
});

const lot003BasePrompts = qcm003.map(item => stripLot003Wrapper(item.prompt));
const lot002SupportTexts = BATCH_002.supports.map(item => item.text);
const lot002QuestionTypes = qcm002.map(item => item.chapter);
const report = {
  generatedAt: new Date().toISOString(),
  disclaimer: 'Un enregistrement n’équivaut pas nécessairement à une question originale distincte.',
  counts: {
    lot001Qcm: qcm001.length,
    lot002Qcm: qcm002.length,
    lot002Supports: BATCH_002.supports.length,
    lot003Qcm: qcm003.length,
    lot004: { grammaireVocabulaire: editorial004.length, ce: ce004.length, co: co004.length, ee: BATCH_004_EDITORIAL_60.ee.length, eo: BATCH_004_EDITORIAL_60.eo.length },
    lot005: { grammaireVocabulaire: qcm005.length, ce: BATCH_005.ce.length, co: BATCH_005.co.length, ee: BATCH_005.ee.length, eo: BATCH_005.eo.length },
    totalImportedByCurrentImporter: qcm001.length + qcm002.length + qcm003.length + ce004.length + co004.length + open004.length + editorial004.length + closed005.length + open005.length + qcm005.length
  },
  diversity: {
    lot001UniquePrompts: countUnique(qcm001.map(x => x.prompt)),
    lot002UniqueSupportTexts: countUnique(lot002SupportTexts),
    lot002UniqueQuestionStems: countUnique(qcm002.map(x => x.prompt)),
    lot002QuestionFamilies: [...new Set(lot002QuestionTypes)],
    lot003UniquePromptsAfterRemovingKnownWrappers: new Set(lot003BasePrompts).size,
    lot003ExactDuplicateBasePrompts: duplicates(lot003BasePrompts),
    lot004UniqueClosedQuestionStems: countUnique([...ce004, ...co004].map(x => x.prompt)),
    lot004UniqueOpenTasks: countUnique(open004.map(x => x.task)),
    lot004EditorialUniquePrompts: countUnique(editorial004.map(x => x.prompt))
  },
  validation: {
    invalidRecords: issues.length,
    details: issues
  },
  integratedPacks: {
    lot004: { file: 'src/v4/data/batch-004-editorial.js', qcm: 40, activities: 100 },
    lot005: { file: 'src/v4/data/batch-005.js', activities: 100, competences: { CE: 25, CO: 25, EE: 13, EO: 13, grammaireVocabulaire: 24 } }
  }
};

console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
