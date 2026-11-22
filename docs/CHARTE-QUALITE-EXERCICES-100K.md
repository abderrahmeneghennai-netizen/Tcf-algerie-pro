# Charte de qualité pédagogique — Banque de 100 000 activités

**Projet :** TCF ALGÉRIE PRO V4.0  
**Branche de travail :** `v4-development`  
**Statut :** règle éditoriale obligatoire avant toute production de nouveaux lots  
**Périmètre :** contenu pédagogique et méthode d'intégration ; aucune modification du schéma SQLite.

## 1. Objectif

Construire une banque de 100 000 activités réellement différentes, utiles à la préparation au TCF et réparties entre les six domaines suivants :

| Domaine | Objectif |
|---|---:|
| Compréhension orale (CO) | 20 000 |
| Compréhension écrite (CE) | 20 000 |
| Expression orale (EO) | 10 000 |
| Expression écrite (EE) | 10 000 |
| Grammaire | 20 000 |
| Vocabulaire | 20 000 |
| **Total** | **100 000** |

Le total numérique ne constitue jamais, à lui seul, une preuve de qualité ou d'originalité.

## 2. Définition d'une activité inédite

Une activité ne compte comme nouvelle que si elle apporte une différence pédagogique réelle : contexte, document, intention de communication, compétence ciblée, raisonnement attendu ou difficulté linguistique.

Ne constituent PAS de nouvelles activités :
- remplacer uniquement des noms, lieux, dates ou nombres ;
- conserver le même texte et changer l'ordre des réponses ;
- reformuler superficiellement la même question ;
- réutiliser une même structure avec quelques mots synonymes ;
- multiplier artificiellement les entrées à partir d'un petit nombre de modèles.

Deux questions fondées sur le même support peuvent être distinctes si elles évaluent des opérations de compréhension différentes et pertinentes. En revanche, un simple changement de formulation ne suffit pas.

## 3. Exigences par domaine

### Compréhension orale (CO)
Varier les genres : annonces, conversations, messages, entretiens, reportages, échanges de service, débats et exposés. Varier les locuteurs, les intentions, les registres, les accents francophones représentés et les opérations évaluées : information explicite, intention, attitude, implicite, opinion, organisation du discours.

Chaque document doit posséder une transcription cohérente, une durée indicative réaliste et des questions dont les réponses sont justifiées par le document. Si la lecture est produite par synthèse vocale, l'interface doit la présenter comme une lecture TTS et non comme un enregistrement natif.

### Compréhension écrite (CE)
Créer des supports variés et complets : courriels, annonces, règlements, articles, témoignages, récits, notices, extraits argumentatifs et documents pratiques. Éviter de produire des centaines de questions à partir de quelques supports répétitifs.

Chaque question doit être vérifiable dans le support ou découler d'une inférence raisonnable. Les distracteurs doivent être plausibles, distincts et réfutables par le texte.

### Expression orale (EO)
Créer des situations de communication diversifiées : demander un renseignement, expliquer une expérience, défendre un point de vue, comparer des solutions, présenter un projet, argumenter et répondre à une objection.

Chaque sujet doit préciser la situation, le rôle du candidat, l'objectif communicatif, les contraintes éventuelles et les critères d'autoévaluation. Ne pas transformer artificiellement les productions ouvertes en QCM.

### Expression écrite (EE)
Varier les destinataires, les objectifs, les genres et les contraintes : message, courriel, récit, compte rendu, lettre, argumentation et synthèse adaptée au niveau. Chaque consigne doit être autonome, claire et assortie de critères adaptés à la tâche.

### Grammaire
Couvrir progressivement les structures et les difficultés : déterminants, accords, conjugaison, temps et modes, pronoms, prépositions, négation, interrogation, subordination, concordance, discours rapporté et organisation de la phrase. Ne pas décliner un même item en changeant seulement le sujet ou le temps.

### Vocabulaire
Varier les champs lexicaux, collocations, expressions, registres, dérivations, polysémie, synonymie en contexte, antonymie, faux amis et nuances de sens. Une réponse ne doit pas être correcte hors contexte si la consigne exige une interprétation contextuelle.

## 4. Fiche minimale de chaque activité

Chaque entrée doit avoir, selon le domaine :
- un identifiant stable et unique ;
- un domaine et un niveau CECRL cohérents (A1 à C2) ;
- une compétence ou sous-compétence ciblée ;
- une consigne claire et autonome ;
- un contenu ou support original lorsque nécessaire ;
- une difficulté estimée et justifiable ;
- un corrigé et une explication pour les QCM ;
- des distracteurs plausibles, sans ambiguïté ;
- des critères d'évaluation pour les productions ouvertes ;
- une provenance éditoriale interne et une version de lot.

## 5. Contrôles obligatoires avant validation

Un lot ne peut être déclaré validé que si les contrôles suivants sont satisfaits :

1. **Structure :** champs requis, identifiants uniques, niveau et domaine valides.
2. **Doublons exacts :** détection des identifiants, consignes, supports et questions identiques.
3. **Similarité :** repérage des formulations très proches pour revue humaine ; un contrôle automatique ne remplace pas cette revue.
4. **Correction :** réponse correcte vérifiée dans le contexte ; aucune seconde réponse défendable dans un QCM.
5. **Distracteurs :** quatre choix distincts lorsqu'un QCM à quatre choix est prévu, sans réponse absurde ou ambiguë.
6. **Niveau :** vocabulaire, syntaxe, longueur et raisonnement adaptés au niveau annoncé.
7. **Pédagogie :** diversité réelle des formats et des compétences évaluées.
8. **Non-répétition :** comparaison avec les lots déjà acceptés.
9. **Tests applicatifs :** import, affichage, navigation et sauvegarde vérifiés sur Android.

Les contrôles automatiques peuvent bloquer les doublons exacts et signaler les ressemblances. La validation pédagogique des cas signalés reste humaine.

## 6. Règle de comptage

Les rapports doivent distinguer :
- le nombre d'entrées présentes en base ;
- le nombre d'entrées structurellement valides ;
- le nombre de doublons exacts ;
- le nombre d'entrées signalées comme trop similaires ;
- le nombre d'activités réellement validées pédagogiquement.

Ne jamais annoncer « 100 000 exercices inédits » sur la seule base d'un comptage SQL.

Les lots 001, 002 et 003 déjà présents restent des données historiques de la V4.0. Leur nombre d'entrées ne doit pas être confondu avec une certification d'originalité ; ils devront être audités et améliorés au besoin, sans suppression précipitée des données installées.

## 7. Intégration technique — contraintes de sécurité

- Travailler exclusivement sur `v4-development`.
- Préserver intégralement la branche `main` et la V3.1.
- Ne modifier aucune table, colonne, contrainte, relation, index, curseur ou instruction DDL du schéma SQLite validé.
- Préparer des lots versionnés, avec identifiants stables et import idempotent.
- Éviter d'embarquer et d'importer les 100 000 activités en une seule opération au démarrage.
- Étudier un chargement par lots bornés et progressif, compatible avec les services et les tables existants.
- Tester les temps de démarrage, la mémoire, les performances de recherche et la taille de l'APK sur l'appareil Android de référence.
- Ne publier aucun nouvel APK avant les contrôles automatisés et les tests de non-régression.

Toute évolution technique doit être vérifiée contre le schéma existant avant modification. Cette charte n'autorise pas, à elle seule, une modification du code applicatif.

## 8. Ordre de travail

1. Auditer le format des données et les services actuels.
2. Définir un format de lot compatible avec le schéma existant.
3. Produire un petit lot pilote réellement inédit et équilibré.
4. Faire relire les consignes, réponses et explications.
5. Exécuter les contrôles anti-doublons et les tests Android.
6. Corriger le processus, puis augmenter progressivement la taille des lots.
7. Suivre la qualité et la diversité à chaque étape jusqu'à l'objectif de 100 000.

**Règle finale : mieux vaut un lot plus petit, exact et réellement inédit qu'un grand lot artificiellement gonflé.**
