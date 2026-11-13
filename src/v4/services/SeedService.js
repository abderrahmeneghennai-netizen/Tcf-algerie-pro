/**
 * Données pédagogiques initiales V4.0.
 * Ajout idempotent : ne modifie ni le schéma ni les données déjà présentes.
 */
const GRAMMAR_QUESTIONS = [
  { stableId:'gram-b1-001', level:'B1', chapter:'L’adjectif qualificatif', prompt:'Choisissez la phrase correctement accordée.', options:['Les élèves sont attentif.','Les élèves sont attentifs.','Les élèves est attentifs.'], answer:'Les élèves sont attentifs.', explanation:'Le sujet « les élèves » est masculin pluriel : l’adjectif « attentif » prend -s.' },
  { stableId:'gram-b1-002', level:'B1', chapter:'Les temps du passé', prompt:'Complétez : Hier, nous ___ un film intéressant.', options:['avons regardé','regardons','regarderons'], answer:'avons regardé', explanation:'« Hier » indique une action terminée dans le passé : on emploie ici le passé composé.' },
  { stableId:'gram-b1-003', level:'B1', chapter:'Les pronoms', prompt:'Remplacez « à ses parents » : Elle téléphone à ses parents.', options:['Elle leur téléphone.','Elle les téléphone.','Elle lui téléphone.'], answer:'Elle leur téléphone.', explanation:'Le complément « à ses parents » est indirect et pluriel : le pronom correct est « leur ».' },
  { stableId:'gram-b1-004', level:'B1', chapter:'La cause', prompt:'Choisissez le connecteur qui exprime la cause : Il est absent ___ il est malade.', options:['bien que','parce qu’','pour que'], answer:'parce qu’', explanation:'« Parce que » introduit la cause qui explique son absence.' },
  { stableId:'gram-b1-005', level:'B1', chapter:'Le conditionnel', prompt:'Complétez : Si j’avais plus de temps, je ___ davantage.', options:['voyage','voyagerai','voyagerais'], answer:'voyagerais', explanation:'Dans une hypothèse avec « si » + imparfait, la principale se met au conditionnel présent.' },
  { stableId:'gram-b1-006', level:'B1', chapter:'La négation', prompt:'Quelle phrase exprime correctement « ne… jamais » ?', options:['Je ne mange jamais de viande.','Je mange ne jamais de viande.','Je ne jamais mange de viande.'], answer:'Je ne mange jamais de viande.', explanation:'« Ne » se place avant le verbe conjugué et « jamais » après le verbe.' },
  { stableId:'gram-b1-007', level:'B1', chapter:'Les pronoms relatifs', prompt:'Complétez : Voici le livre ___ je t’ai parlé.', options:['qui','dont','où'], answer:'dont', explanation:'On dit « parler de quelque chose » : le pronom relatif correspondant est « dont ».' },
  { stableId:'gram-b1-008', level:'B1', chapter:'L’expression de l’opposition', prompt:'Complétez : ___ la pluie, ils sont sortis.', options:['Malgré','Puisque','Grâce à'], answer:'Malgré', explanation:'« Malgré » introduit un fait qui aurait pu empêcher l’action : il exprime l’opposition.' }
];

const CE_SUPPORTS = [
  {
    code:'ce-b1-annonce-bibliotheque', title:'Une bibliothèque près de chez vous', level:'B1',
    text:'À partir du 1er décembre, la bibliothèque municipale élargira ses horaires. Elle sera désormais ouverte du mardi au samedi, de 9 h à 18 h 30, sans interruption à midi. Les étudiants pourront réserver une salle de travail gratuitement, à condition de présenter leur carte d’adhérent. Les inscriptions restent gratuites pour les moins de 18 ans. Pour les adultes, l’abonnement annuel coûte 1 200 dinars. La bibliothèque sera fermée le dimanche et le lundi.'
  },
  {
    code:'ce-b1-courriel-formation', title:'Un courriel concernant une formation', level:'B1',
    text:'Bonjour Samir,\n\nJe te confirme que la formation de bureautique commencera lundi prochain à 8 h 30, dans la salle 4 du centre culturel. Comme plusieurs participants viennent de loin, le responsable a accepté de décaler la pause de midi à 13 h. N’oublie pas d’apporter ton ordinateur portable : quelques appareils seront disponibles sur place, mais ils sont réservés aux personnes qui en ont fait la demande. La formation se terminera vendredi à 16 h.\n\nÀ bientôt,\nNadia'
  },
  {
    code:'ce-b2-article-mobilite', title:'Le développement des transports collectifs', level:'B2',
    text:'Dans de nombreuses villes, les transports collectifs connaissent une transformation importante. L’objectif n’est pas seulement de réduire les embouteillages : il s’agit également de rendre les déplacements accessibles à davantage d’habitants. Certaines municipalités ont donc augmenté la fréquence des bus aux heures de pointe et créé des voies réservées. Ces mesures donnent des résultats encourageants, mais elles ne suffisent pas partout. Lorsque les quartiers périphériques restent mal desservis, les habitants continuent souvent de dépendre de leur voiture. Les spécialistes rappellent ainsi que l’efficacité d’un réseau repose autant sur sa régularité que sur la qualité de sa couverture géographique.'
  },
  {
    code:'ce-b2-article-teletravail', title:'Le télétravail : une organisation à équilibrer', level:'B2',
    text:'Le télétravail est parfois présenté comme une solution qui permettrait de concilier automatiquement vie professionnelle et vie personnelle. La réalité est plus nuancée. La suppression des trajets quotidiens représente un gain de temps appréciable, mais la frontière entre les horaires de travail et les moments de repos peut devenir moins nette. Pour éviter cette confusion, certaines entreprises définissent des plages de disponibilité communes et encouragent leurs équipes à respecter le droit à la déconnexion. Le télétravail fonctionne donc mieux lorsqu’il s’accompagne de règles partagées plutôt que lorsqu’il repose uniquement sur la capacité de chacun à s’organiser.'
  }
];

const CE_QUESTIONS = [
  { stableId:'ce-b1-001', support:'ce-b1-annonce-bibliotheque', level:'B1', chapter:'Repérer une information précise', prompt:'À quelle condition un étudiant peut-il réserver une salle de travail ?', options:['En payant un supplément.','En présentant sa carte d’adhérent.','En venant le dimanche.','En s’inscrivant à une formation.'], answer:'En présentant sa carte d’adhérent.', explanation:'Le texte précise que la réservation est gratuite à condition de présenter une carte d’adhérent.' },
  { stableId:'ce-b1-002', support:'ce-b1-annonce-bibliotheque', level:'B1', chapter:'Comprendre les horaires', prompt:'Quels jours la bibliothèque est-elle fermée ?', options:['Le mardi et le mercredi.','Le samedi et le dimanche.','Le dimanche et le lundi.','Le lundi et le mardi.'], answer:'Le dimanche et le lundi.', explanation:'La dernière phrase indique que la bibliothèque sera fermée le dimanche et le lundi.' },
  { stableId:'ce-b1-003', support:'ce-b1-courriel-formation', level:'B1', chapter:'Comprendre un courriel', prompt:'Pourquoi la pause de midi a-t-elle été décalée ?', options:['Parce que la salle est occupée.','Parce que des participants habitent loin.','Parce que la formation finit plus tôt.','Parce que Nadia est absente.'], answer:'Parce que des participants habitent loin.', explanation:'Le responsable a accepté ce changement parce que plusieurs participants viennent de loin.' },
  { stableId:'ce-b1-004', support:'ce-b1-courriel-formation', level:'B1', chapter:'Identifier une consigne', prompt:'Que doit apporter Samir ?', options:['Une carte d’adhérent.','Un repas.','Un ordinateur portable.','Un document administratif.'], answer:'Un ordinateur portable.', explanation:'Nadia lui demande explicitement d’apporter son ordinateur portable.' },
  { stableId:'ce-b2-001', support:'ce-b2-article-mobilite', level:'B2', chapter:'Comprendre l’idée principale', prompt:'Selon le texte, quel est l’objectif des transports collectifs ?', options:['Supprimer tous les déplacements en voiture.','Réduire les embouteillages et élargir l’accès aux déplacements.','Remplacer les quartiers périphériques.','Diminuer le nombre de lignes de bus.'], answer:'Réduire les embouteillages et élargir l’accès aux déplacements.', explanation:'Le texte présente deux objectifs complémentaires : limiter les embouteillages et rendre les déplacements accessibles à plus d’habitants.' },
  { stableId:'ce-b2-002', support:'ce-b2-article-mobilite', level:'B2', chapter:'Déduire une information', prompt:'Pourquoi certains habitants continuent-ils à utiliser leur voiture ?', options:['Les bus sont toujours gratuits.','Les voies réservées sont interdites.','Les quartiers périphériques sont parfois mal desservis.','Les municipalités ont supprimé les bus.'], answer:'Les quartiers périphériques sont parfois mal desservis.', explanation:'Le texte explique que l’insuffisance de la desserte des quartiers périphériques maintient la dépendance à la voiture.' },
  { stableId:'ce-b2-003', support:'ce-b2-article-teletravail', level:'B2', chapter:'Interpréter une nuance', prompt:'Quelle idée le texte défend-il à propos du télétravail ?', options:['Il améliore toujours automatiquement la vie personnelle.','Il doit être accompagné de règles partagées.','Il rend les horaires inutiles.','Il supprime le besoin de communication.'], answer:'Il doit être accompagné de règles partagées.', explanation:'La conclusion souligne que le télétravail fonctionne mieux avec des règles communes, notamment sur les horaires et la déconnexion.' },
  { stableId:'ce-b2-004', support:'ce-b2-article-teletravail', level:'B2', chapter:'Comprendre une conséquence', prompt:'Quel risque peut apparaître lorsque l’on travaille à domicile ?', options:['La frontière entre travail et repos devient moins claire.','Les trajets quotidiens deviennent plus longs.','Les équipes ne peuvent plus communiquer.','Les entreprises ferment leurs bureaux immédiatement.'], answer:'La frontière entre travail et repos devient moins claire.', explanation:'Le texte précise que les horaires professionnels et les moments de repos peuvent se confondre.' }
];


const CO_AUDIOS = [
  {
    code:'co-b1-dialogue-gare', level:'B1', title:'À la gare : acheter un billet', duration:35,
    transcript:'Bonjour, je voudrais un billet pour Constantine, s’il vous plaît. Pour quel jour ? Pour demain matin. Il y a un train à sept heures vingt et un autre à neuf heures dix. Je préfère celui de neuf heures dix. Très bien. Le départ se fera voie trois. N’oubliez pas que les billets peuvent être échangés jusqu’à la veille du départ. Merci beaucoup. Je peux payer par carte ? Bien sûr.'
  },
  {
    code:'co-b1-message-centre-sportif', level:'B1', title:'Message du centre sportif', duration:35,
    transcript:'Bonjour à toutes et à tous. Le centre sportif vous informe que la piscine sera fermée exceptionnellement mercredi matin pour des travaux d’entretien. Les cours de natation prévus à neuf heures et à dix heures sont reportés à vendredi, aux mêmes horaires. La salle de musculation et les terrains resteront accessibles normalement. Pour toute question, adressez-vous à l’accueil. Merci de votre compréhension.'
  },
  {
    code:'co-b2-interview-teletravail', level:'B2', title:'Interview : organiser le télétravail', duration:55,
    transcript:'Journaliste : Depuis quelques années, le télétravail s’est installé dans de nombreuses entreprises. Est-ce forcément un avantage pour les salariés ? Experte : Pas automatiquement. Il réduit les déplacements et offre davantage de souplesse, mais il peut aussi isoler certains employés. Tout dépend de l’organisation collective. Les équipes ont besoin de moments d’échange réguliers et de règles claires concernant les horaires. Journaliste : Les entreprises doivent-elles donc imposer des jours au bureau ? Experte : Il n’existe pas de modèle unique. Certaines équipes gagnent à se retrouver deux jours par semaine, tandis que d’autres ont besoin de plus de présence. L’essentiel est de choisir les modalités avec les salariés et d’évaluer les résultats plutôt que de mesurer uniquement le temps passé au bureau.'
  },
  {
    code:'co-b2-reportage-mobilite', level:'B2', title:'Reportage : un nouveau plan de mobilité', duration:45,
    transcript:'Dans le centre-ville, la municipalité vient de présenter un nouveau plan de mobilité. Il prévoit la création de pistes cyclables continues, l’augmentation de la fréquence des bus et la transformation de deux rues commerçantes en zones piétonnes à certaines heures. Les commerçants redoutent une baisse de fréquentation pendant les travaux, mais la mairie promet des livraisons organisées tôt le matin et une période d’évaluation de six mois. Les associations d’usagers saluent l’initiative, tout en rappelant que ces mesures ne seront efficaces que si les quartiers périphériques bénéficient eux aussi de transports réguliers.'
  }
];

const CO_QUESTIONS = [
  { stableId:'co-b1-001', audio:'co-b1-dialogue-gare', level:'B1', chapter:'Repérer une information précise', prompt:'À quelle heure part le train choisi par le voyageur ?', options:['À 7 h 20.','À 8 h 30.','À 9 h 10.','À 10 h 15.'], answer:'À 9 h 10.', explanation:'Le voyageur choisit le train de neuf heures dix.' },
  { stableId:'co-b1-002', audio:'co-b1-dialogue-gare', level:'B1', chapter:'Comprendre une condition', prompt:'Jusqu’à quand le billet peut-il être échangé ?', options:['Jusqu’au jour du départ.','Jusqu’à la veille du départ.','Pendant une semaine après le départ.','Uniquement dans l’heure qui suit l’achat.'], answer:'Jusqu’à la veille du départ.', explanation:'L’agent précise que l’échange est possible jusqu’à la veille du départ.' },
  { stableId:'co-b1-003', audio:'co-b1-message-centre-sportif', level:'B1', chapter:'Comprendre un message d’information', prompt:'Pourquoi la piscine sera-t-elle fermée ?', options:['À cause d’une compétition.','Pour des travaux d’entretien.','En raison d’une panne générale.','Pour une réunion du personnel.'], answer:'Pour des travaux d’entretien.', explanation:'Le message annonce une fermeture exceptionnelle pour des travaux d’entretien.' },
  { stableId:'co-b1-004', audio:'co-b1-message-centre-sportif', level:'B1', chapter:'Identifier un changement d’horaire', prompt:'Quand les cours de natation auront-ils lieu ?', options:['Mardi matin.','Mercredi après-midi.','Jeudi matin.','Vendredi aux mêmes horaires.'], answer:'Vendredi aux mêmes horaires.', explanation:'Les cours prévus mercredi sont reportés à vendredi, sans changement d’horaire.' },
  { stableId:'co-b2-001', audio:'co-b2-interview-teletravail', level:'B2', chapter:'Comprendre le point de vue', prompt:'Quelle réserve l’experte exprime-t-elle au sujet du télétravail ?', options:['Il entraîne toujours une baisse de productivité.','Il peut isoler certains employés.','Il empêche toute souplesse des horaires.','Il rend les échanges entre collègues inutiles.'], answer:'Il peut isoler certains employés.', explanation:'L’experte reconnaît les avantages du télétravail, mais souligne le risque d’isolement.' },
  { stableId:'co-b2-002', audio:'co-b2-interview-teletravail', level:'B2', chapter:'Saisir une recommandation', prompt:'Selon l’experte, sur quoi faut-il surtout fonder le choix des modalités ?', options:['Sur le nombre d’heures passées au bureau.','Sur une règle identique pour toutes les entreprises.','Sur un accord avec les salariés et l’évaluation des résultats.','Sur la suppression des réunions à distance.'], answer:'Sur un accord avec les salariés et l’évaluation des résultats.', explanation:'Elle recommande de choisir les modalités avec les salariés et d’évaluer les résultats.' },
  { stableId:'co-b2-003', audio:'co-b2-reportage-mobilite', level:'B2', chapter:'Identifier les mesures annoncées', prompt:'Quelle mesure ne fait PAS partie du nouveau plan ?', options:['Créer des pistes cyclables continues.','Augmenter la fréquence des bus.','Rendre certaines rues piétonnes à certaines heures.','Supprimer toutes les lignes de bus périphériques.'], answer:'Supprimer toutes les lignes de bus périphériques.', explanation:'Le reportage annonce trois mesures, mais aucune suppression de lignes de bus.' },
  { stableId:'co-b2-004', audio:'co-b2-reportage-mobilite', level:'B2', chapter:'Comprendre une condition', prompt:'À quelle condition les associations jugent-elles les mesures efficaces ?', options:['Si les commerces ferment pendant les travaux.','Si les quartiers périphériques disposent aussi de transports réguliers.','Si les livraisons sont interdites toute la journée.','Si la période d’évaluation est supprimée.'], answer:'Si les quartiers périphériques disposent aussi de transports réguliers.', explanation:'Les associations rappellent que les quartiers périphériques doivent également être bien desservis.' }
];

export class SeedService {
  constructor(database) { this.database = database; }

  async ensureInitialContent() {
    await this.database.transaction(async (db) => {
      await db.run("INSERT OR IGNORE INTO modules (code, name, is_active) VALUES (?, ?, 1)", ['GRAM', 'Grammaire']);
      await db.run("INSERT OR IGNORE INTO modules (code, name, is_active) VALUES (?, ?, 1)", ['CE', 'Compréhension écrite']);
      await db.run("INSERT OR IGNORE INTO modules (code, name, is_active) VALUES (?, ?, 1)", ['CO', 'Compréhension orale']);
      await db.run(
        "INSERT OR IGNORE INTO packs (code, name, is_premium, description) VALUES (?, ?, 0, ?)",
        ['pack_free_discovery', 'Pack gratuit — Découverte B1-B2', 'Premiers exercices gratuits de grammaire et de compréhension écrite']
      );

      const moduleRows = await db.query("SELECT id, code FROM modules WHERE code IN ('GRAM', 'CE', 'CO')");
      const packResult = await db.query("SELECT id FROM packs WHERE code = ? LIMIT 1", ['pack_free_discovery']);
      const moduleIds = Object.fromEntries((moduleRows.values ?? []).map(row => [row.code, row.id]));
      const packId = packResult.values?.[0]?.id;
      if (!moduleIds.GRAM || !moduleIds.CE || !packId) {
        throw new Error('Impossible de préparer les modules gratuits.');
      }

      await db.run(
        "INSERT OR IGNORE INTO pack_versions (pack_id, version_number, checksum) VALUES (?, 1, ?)",
        [packId, 'builtin-gram-b1-v1']
      );
      await db.run(
        "INSERT OR IGNORE INTO pack_versions (pack_id, version_number, checksum) VALUES (?, 2, ?)",
        [packId, 'builtin-ce-b1-b2-v1']
      );
      await db.run(
        "INSERT OR IGNORE INTO pack_versions (pack_id, version_number, checksum) VALUES (?, 3, ?)",
        [packId, 'builtin-co-b1-b2-v1']
      );

      for (let index = 0; index < GRAMMAR_QUESTIONS.length; index += 1) {
        const q = GRAMMAR_QUESTIONS[index];
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id, pack_id, module_id, chapitre, niveau, difficulte, shuffle_key,
             enonce, options_json, bonne_reponse, explication, is_archived)
           VALUES (?, ?, ?, ?, ?, 2, ?, ?, ?, ?, ?, 0)`,
          [q.stableId, packId, moduleIds.GRAM, q.chapter, q.level, (index + 1) * 100,
            q.prompt, JSON.stringify(q.options), q.answer, q.explanation]
        );
      }

      for (const support of CE_SUPPORTS) {
        await db.run(
          `INSERT OR IGNORE INTO supports_ecrits
            (pack_id, stable_code, titre, texte_contenu, source, is_archived)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [packId, support.code, support.title, support.text, 'Texte pédagogique original — TCF ALGÉRIE PRO']
        );
      }

      const supportRows = await db.query(
        "SELECT id, stable_code FROM supports_ecrits WHERE pack_id = ? AND stable_code LIKE 'ce-%'",
        [packId]
      );
      const supportIds = Object.fromEntries((supportRows.values ?? []).map(row => [row.stable_code, row.id]));
      for (let index = 0; index < CE_QUESTIONS.length; index += 1) {
        const q = CE_QUESTIONS[index];
        const supportId = supportIds[q.support];
        if (!supportId) throw new Error('Support de lecture introuvable : ' + q.support);
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id, pack_id, module_id, support_ecrit_id, chapitre, niveau,
             difficulte, shuffle_key, enonce, options_json, bonne_reponse, explication, is_archived)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [q.stableId, packId, moduleIds.CE, supportId, q.chapter, q.level,
            q.level === 'B2' ? 4 : 2, (index + 1) * 100, q.prompt,
            JSON.stringify(q.options), q.answer, q.explanation]
        );
      }

      for (const audio of CO_AUDIOS) {
        await db.run(
          `INSERT OR IGNORE INTO fichiers_audio
            (pack_id, stable_code, chemin_fichier, duree_secondes, transcription, is_archived)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [packId, audio.code, 'tts://fr-FR/' + audio.code, audio.duration, audio.transcript]
        );
      }

      const audioRows = await db.query(
        "SELECT id, stable_code FROM fichiers_audio WHERE pack_id = ? AND stable_code LIKE 'co-%'",
        [packId]
      );
      const audioIds = Object.fromEntries((audioRows.values ?? []).map(row => [row.stable_code, row.id]));
      for (let index = 0; index < CO_QUESTIONS.length; index += 1) {
        const q = CO_QUESTIONS[index];
        const audioId = audioIds[q.audio];
        if (!audioId) throw new Error('Audio de compréhension orale introuvable : ' + q.audio);
        await db.run(
          `INSERT OR IGNORE INTO exercices
            (stable_id, pack_id, module_id, audio_id, chapitre, niveau,
             difficulte, shuffle_key, enonce, options_json, bonne_reponse, explication, is_archived)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [q.stableId, packId, moduleIds.CO, audioId, q.chapter, q.level,
            q.level === 'B2' ? 4 : 2, (index + 1) * 100, q.prompt,
            JSON.stringify(q.options), q.answer, q.explanation]
        );
      }
    });
  }
}
