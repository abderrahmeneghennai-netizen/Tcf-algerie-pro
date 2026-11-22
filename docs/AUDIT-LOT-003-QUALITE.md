# Audit éditorial du lot 003 — Grammaire et vocabulaire

**Branche auditée :** `v4-development`  
**Fichier :** `src/v4/data/batch-003.js`  
**Statut :** audit statique du contenu ; aucune donnée installée ni aucun fichier applicatif modifié.

## Constat vérifiable

Le fichier construit 500 entrées à partir de deux tableaux de départ :
- 25 questions modèles de grammaire ;
- 25 questions modèles de vocabulaire ;
- chaque question modèle est réutilisée 10 fois ;
- les dix variantes ne changent que la phrase d'introduction (`wrappers`) placée devant la même question.

Les options, la bonne réponse et l'explication sont copiées à l'identique pour les dix variantes. Les changements de niveau et de difficulté sont calculés à partir de l'index, et ne changent pas la compétence réellement évaluée.

Le lot contient donc **500 lignes importables**, mais seulement **50 noyaux de questions distincts** selon sa construction actuelle. Les 450 variantes restantes ne doivent pas être présentées comme des exercices inédits.

## Problème de classement à corriger

Dans la boucle de génération, les entrées de grammaire comme celles de vocabulaire reçoivent toutes `module: 'GRAM'`. Le tableau de vocabulaire n'est donc pas affecté à un module `VOC` par ce fichier. Toute correction de classement devra d'abord vérifier les codes de modules réellement présents dans le schéma et dans l'interface ; aucune nouvelle table ou colonne ne doit être créée.

## Décision éditoriale

- Conserver l'historique du lot installé : ne pas supprimer ou écraser des données déjà présentes sur les appareils.
- Ne pas compter ses variantes superficielles dans le quota des 100 000 activités inédites.
- Préparer de nouveaux lots avec des contextes, compétences, formulations, distracteurs et explications réellement différents.
- Pour les anciennes entrées, prévoir un audit et une éventuelle mise à niveau contrôlée dans un futur lot correctif, après vérification de compatibilité.

## Contrôles à intégrer pour les prochains lots

1. Détecter les questions identiques après suppression des préfixes génériques.
2. Comparer les énoncés normalisés, les options, les réponses et les explications.
3. Signaler les séries partageant le même noyau d'énoncé avec une introduction différente.
4. Vérifier que le domaine déclaré correspond au module existant.
5. Vérifier manuellement les réponses, distracteurs et explications.
6. N'accorder le statut « inédit et validé » qu'après revue éditoriale et tests Android.

## Limites de cet audit

Cet audit porte sur le code source visible du lot 003. Il ne mesure pas le nombre exact de doublons avec les lots 001 et 002, ni les données qui pourraient déjà être installées sur un appareil. Cette comparaison inter-lots devra être faite sur un export de données ou sur les fichiers source complets avant toute opération de nettoyage.

**Conclusion :** le lot 003 a bien fourni 500 entrées à l'import, mais sa génération actuelle repose sur 50 questions de base répétées avec des préfixes différents. Il ne satisfait donc pas la nouvelle exigence de 500 exercices tous réellement inédits.
