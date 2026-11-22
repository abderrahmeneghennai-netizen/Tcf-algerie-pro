# Lot pilote 100 — spécification de production et de validation

Branche de travail : `v4-development`  
Statut : cadrage technique validé, contenu non encore intégré à l'application.  
Objectif : produire un premier lot de 100 activités distinctes, puis le tester sur Android.

## Répartition du lot

| Domaine | Nombre | Format attendu |
|---|---:|---|
| Compréhension orale (CO) | 20 | Documents audio/transcriptions distincts + questions de compréhension |
| Compréhension écrite (CE) | 20 | Supports écrits originaux + questions liées au sens du texte |
| Grammaire | 20 | QCM ciblés, avec distracteurs plausibles |
| Vocabulaire | 20 | Sens en contexte, collocations, nuances et familles de mots |
| Expression écrite (EE) | 10 | Sujets ouverts, consignes et critères d'évaluation |
| Expression orale (EO) | 10 | Sujets ouverts, durée et critères d'évaluation |
| **Total** | **100** | **Six domaines couverts** |

## Constat technique important

Le schéma SQLite validé contient les codes de modules `CO`, `CE`, `GRAM`, `EE` et `EO`, mais pas de module `VOC`. Le vocabulaire sera donc classé dans le module existant `GRAM`, avec un chapitre clairement nommé « Vocabulaire — … ». Cela évite toute modification du schéma.

Les formats sont différents selon les compétences :
- CO : utiliser `fichiers_audio` et l'association `audio_id` des exercices. Si le moteur vocal Android lit une transcription, il faut l'indiquer comme synthèse vocale, et non comme enregistrement natif.
- CE : créer des supports uniques dans `supports_ecrits`, puis rattacher les questions au bon support.
- Grammaire/vocabulaire : QCM dans `exercices`, module `GRAM`.
- EE/EO : sujets ouverts dans `sujets_expression`, liés au module correspondant. Ne pas fabriquer de QCM pour ces deux compétences.

## Règles obligatoires de qualité

1. Chaque activité doit avoir un identifiant stable et unique.
2. Changer uniquement le prénom, l'ordre des réponses ou une phrase d'introduction ne crée pas une nouvelle activité.
3. Chaque support CO/CE doit être distinct et apporter une situation, un objectif ou un contenu différent.
4. Chaque QCM doit avoir une seule réponse défendable, des distracteurs plausibles et une explication précise.
5. Les questions de compréhension doivent être résolubles à partir du document associé, sans connaissance extérieure indispensable.
6. Les niveaux B1/B2 doivent correspondre à la longueur, au lexique, à la syntaxe et au raisonnement demandé.
7. Les sujets EE/EO doivent comporter une consigne exploitable et une grille d'évaluation adaptée.
8. Avant import : vérifier les doublons exacts, les ressemblances excessives, les réponses, les niveaux, les références aux supports et les identifiants.
9. Le comptage final distinguera : lignes importées, activités valides, activités distinctes et activités approuvées pédagogiquement.

## Sécurité technique

- Ne pas modifier `main` ni la V3.1.
- Ne pas modifier `database/schema-v4.sql` ni aucune table, colonne, contrainte, relation ou index.
- Conserver les imports idempotents et les transactions bornées.
- Ne pas charger 100 000 activités au démarrage de l'application.
- Le lot pilote doit être importé uniquement après validation de son format et de ses références.
- La validation finale exige un APK construit avec succès puis un test réel sur le Samsung.

## État actuel

Ce document fixe la répartition et les règles du lot pilote. Il ne signifie pas que les 100 activités sont déjà rédigées, importées ou testées. La production du contenu et son intégration seront suivies séparément afin de ne pas annoncer un résultat avant vérification.
