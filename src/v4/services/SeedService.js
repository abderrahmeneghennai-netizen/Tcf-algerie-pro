/**
 * Données pédagogiques initiales V4.0.
 * Ajout idempotent : ne modifie ni le schéma ni les données déjà présentes.
 */
const GRAMMAR_QUESTIONS = [
  {
    stableId: 'gram-b1-001',
    level: 'B1',
    chapter: 'L’adjectif qualificatif',
    prompt: 'Choisissez la phrase correctement accordée.',
    options: ['Les élèves sont attentif.', 'Les élèves sont attentifs.', 'Les élèves est attentifs.'],
    answer: 'Les élèves sont attentifs.',
    explanation: 'Le sujet « les élèves » est masculin pluriel : l’adjectif « attentif » prend -s.'
  },
  {
    stableId: 'gram-b1-002',
    level: 'B1',
    chapter: 'Les temps du passé',
    prompt: 'Complétez : Hier, nous ___ un film intéressant.',
    options: ['avons regardé', 'regardons', 'regarderons'],
    answer: 'avons regardé',
    explanation: '« Hier » indique une action terminée dans le passé : on emploie ici le passé composé.'
  },
  {
    stableId: 'gram-b1-003',
    level: 'B1',
    chapter: 'Les pronoms',
    prompt: 'Remplacez « à ses parents » : Elle téléphone à ses parents.',
    options: ['Elle leur téléphone.', 'Elle les téléphone.', 'Elle lui téléphone.'],
    answer: 'Elle leur téléphone.',
    explanation: 'Le complément « à ses parents » est indirect et pluriel : le pronom correct est « leur ».'
  },
  {
    stableId: 'gram-b1-004',
    level: 'B1',
    chapter: 'La cause',
    prompt: 'Choisissez le connecteur qui exprime la cause : Il est absent ___ il est malade.',
    options: ['bien que', 'parce qu’', 'pour que'],
    answer: 'parce qu’',
    explanation: '« Parce que » introduit la cause qui explique son absence.'
  },
  {
    stableId: 'gram-b1-005',
    level: 'B1',
    chapter: 'Le conditionnel',
    prompt: 'Complétez : Si j’avais plus de temps, je ___ davantage.',
    options: ['voyage', 'voyagerai', 'voyagerais'],
    answer: 'voyagerais',
    explanation: 'Dans une hypothèse avec « si » + imparfait, la principale se met au conditionnel présent.'
  },
  {
    stableId: 'gram-b1-006',
    level: 'B1',
    chapter: 'La négation',
    prompt: 'Quelle phrase exprime correctement « ne… jamais » ?',
    options: ['Je ne mange jamais de viande.', 'Je mange ne jamais de viande.', 'Je ne jamais mange de viande.'],
    answer: 'Je ne mange jamais de viande.',
    explanation: '« Ne » se place avant le verbe conjugué et « jamais » après le verbe.'
  },
  {
    stableId: 'gram-b1-007',
    level: 'B1',
    chapter: 'Les pronoms relatifs',
    prompt: 'Complétez : Voici le livre ___ je t’ai parlé.',
    options: ['qui', 'dont', 'où'],
    answer: 'dont',
    explanation: 'On dit « parler de quelque chose » : le pronom relatif correspondant est « dont ».'
  },
  {
    stableId: 'gram-b1-008',
    level: 'B1',
    chapter: 'L’expression de l’opposition',
    prompt: 'Complétez : ___ la pluie, ils sont sortis.',
    options: ['Malgré', 'Puisque', 'Grâce à'],
    answer: 'Malgré',
    explanation: '« Malgré » introduit un fait qui aurait pu empêcher l’action : il exprime l’opposition.'
  }
];

export class SeedService {
  constructor(database) {
    this.database = database;
  }

  async ensureInitialContent() {
    await this.database.transaction(async (db) => {
      await db.run(
        "INSERT OR IGNORE INTO modules (code, name, is_active) VALUES (?, ?, 1)",
        ['GRAM', 'Grammaire']
      );
      await db.run(
        "INSERT OR IGNORE INTO packs (code, name, is_premium, description) VALUES (?, ?, 0, ?)",
        ['pack_free_discovery', 'Pack gratuit — Grammaire B1', 'Première série de questions de démonstration']
      );

      const moduleResult = await db.query(
        "SELECT id FROM modules WHERE code = ? LIMIT 1", ['GRAM']
      );
      const packResult = await db.query(
        "SELECT id FROM packs WHERE code = ? LIMIT 1", ['pack_free_discovery']
      );
      const moduleId = moduleResult.values?.[0]?.id;
      const packId = packResult.values?.[0]?.id;
      if (!moduleId || !packId) {
        throw new Error('Impossible de préparer le module Grammaire et son pack gratuit.');
      }

      await db.run(
        "INSERT OR IGNORE INTO pack_versions (pack_id, version_number, checksum) VALUES (?, 1, ?)",
        [packId, 'builtin-gram-b1-v1']
      );

      for (let index = 0; index < GRAMMAR_QUESTIONS.length; index += 1) {
        const question = GRAMMAR_QUESTIONS[index];
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id, pack_id, module_id, chapitre, niveau, difficulte,
             shuffle_key, enonce, options_json, bonne_reponse, explication, is_archived)
           VALUES (?, ?, ?, ?, ?, 2, ?, ?, ?, ?, ?, 0)`,
          [
            question.stableId,
            packId,
            moduleId,
            question.chapter,
            question.level,
            (index + 1) * 100,
            question.prompt,
            JSON.stringify(question.options),
            question.answer,
            question.explanation
          ]
        );
      }
    });
  }
}
