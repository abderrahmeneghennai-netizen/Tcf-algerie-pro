# Audit technique préalable — Banque de 100 000 activités

Branche : `v4-development`  
Périmètre : audit en lecture seule des fichiers existants.  
Aucune modification du schéma SQLite ni de la branche `main`.

## Constat vérifié

- Le schéma SQLite existant comporte 14 tables. Il doit rester inchangé.
- Le démarrage de `src/v4/app/main.js` ouvre SQLite, initialise les données, puis importe successivement les lots 001, 002 et 003 avant d'afficher l'application.
- `ExercisePackImportService.js` importe directement les trois fichiers de lots et effectue les insertions dans des transactions.
- Les trois lots représentent 30 + 500 + 500 = 1 030 lignes d'exercices attendues.
- Le lot 002 construit 500 questions à partir de 50 supports et de 10 champs factuels récurrents. Les formulations varient, mais la structure pédagogique est fortement répétitive.
- Le lot 003 contient 50 questions de base (25 grammaire et 25 vocabulaire) répétées avec 10 préambules différents. Il contient bien 500 entrées, mais pas 500 questions substantiellement distinctes.

## Risque principal pour 100 000

Importer toute la banque au démarrage, avec tous les fichiers de contenu statiquement importés dans le JavaScript, risque d'allonger le démarrage, d'augmenter la mémoire utilisée et de rendre les mises à jour lourdes. Le volume de 100 000 lignes ne doit pas être ajouté sous la forme d'un seul gros fichier ou d'une seule transaction massive.

## Architecture recommandée, sans changer SQLite

1. Conserver les tables et colonnes existantes à l'identique.
2. Organiser les contenus en paquets de données versionnés et séparés par compétence/niveau.
3. Charger/importer les paquets de manière contrôlée, avec transactions de taille limitée et reprise idempotente.
4. Ne pas importer les 100 000 activités au premier écran : préparer un mécanisme d'installation initiale ou de chargement progressif, puis charger uniquement les contenus nécessaires.
5. Contrôler les identifiants stables, les doublons de textes/énoncés, les réponses et explications, les références vers supports et sujets, ainsi que le nombre réel de lignes insérées.
6. Mesurer le démarrage, la mémoire, la taille APK et la fluidité sur le Samsung de test avant d'augmenter le volume.

## Règle de qualité éditoriale

Un changement de préambule, de prénom ou d'ordre des choix ne constitue pas une nouvelle activité. Chaque activité doit apporter un contenu, un contexte, une compétence ou un raisonnement réellement distinct. Les tâches EE/EO doivent rester des sujets ouverts avec leurs grilles, et non être transformées artificiellement en QCM.

## Prochaine étape

Créer un prototype d'importation par paquets sur `v4-development`, après inspection complète de `SQLiteDatabase.js`, `SeedService.js`, `ExerciseService.js` et des services de contenu. Ajouter des tests de comptage et de reprise. Ne modifier aucun fichier avant d'avoir vérifié ces contrats applicatifs.
