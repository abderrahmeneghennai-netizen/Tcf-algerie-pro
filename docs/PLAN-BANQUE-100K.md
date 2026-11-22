# Plan de réalisation — Banque TCF ALGÉRIE PRO de 100 000 activités

Branche de travail : `v4-development`

## Objectif

Constituer une banque de 100 000 activités pédagogiques, réparties selon le cadrage validé :

| Domaine | Cible |
|---|---:|
| Compréhension orale (CO) | 20 000 |
| Compréhension écrite (CE) | 20 000 |
| Expression orale (EO) | 10 000 |
| Expression écrite (EE) | 10 000 |
| Grammaire | 20 000 |
| Vocabulaire | 20 000 |
| **Total** | **100 000** |

Les activités de vocabulaire restent identifiées comme telles dans le champ `chapitre` et dans les métadonnées de contenu, mais sont rattachées au module SQLite `GRAM` : le schéma validé ne prévoit pas de module `VOC`.

## Règles de protection

1. Ne jamais modifier `database/schema-v4.sql` : aucune table, colonne, contrainte, relation, clé ou index ne doit être ajouté, supprimé ou renommé.
2. Ne jamais pousser de changement sur `main` : la V3.1 reste intacte.
3. Toute évolution V4 est faite sur `v4-development`.
4. Les contenus sont accessibles sans verrou Premium, conformément à la décision du projet.
5. Ne pas déclarer 100 000 activités terminées sur la seule base d'un compteur théorique ou d'une génération de modèles.

## Correspondance avec le schéma SQLite existant

- **CO** : documents et transcriptions dans `fichiers_audio`, questions associées dans `exercices.audio_id`. La lecture vocale Android doit rester compatible avec le fonctionnement existant.
- **CE** : textes dans `supports_ecrits`, questions associées dans `exercices.support_ecrit_id`.
- **EE / EO** : consignes et grilles dans `sujets_expression`, activités associées dans `exercices.sujet_id`. Ce sont des tâches ouvertes, pas des QCM artificiels.
- **Grammaire / vocabulaire** : QCM ou activités appropriées dans `exercices`, rattachées au module `GRAM`, avec une valeur `chapitre` explicite distinguant les deux domaines.

## Qualité pédagogique exigée

Chaque activité doit avoir un identifiant stable et unique, un niveau CECRL (A1 à C2), une difficulté cohérente, une consigne claire et une correction exploitable. Pour les QCM : quatre choix plausibles, une seule bonne réponse, aucune option dupliquée et une explication qui justifie réellement la réponse. Pour EE/EO : consigne originale, contexte, durée ou longueur attendue si pertinent, et grille d'évaluation adaptée.

Les contenus doivent varier réellement : situations, textes, intentions communicatives, structures linguistiques, lexique, réponses attendues et compétences évaluées. Changer seulement le prénom, la date ou l'ordre des mots ne constitue pas une nouvelle activité.

## Contrôles obligatoires avant intégration

- comptage exact par domaine, module et niveau ;
- unicité des identifiants et détection des doublons de consigne / texte ;
- validation des niveaux et des difficultés ;
- validation des quatre choix et de la réponse correcte pour chaque QCM ;
- cohérence entre question et support associé ;
- vérification des références CO, CE, EE et EO ;
- contrôle des caractères, chaînes vides et contenus tronqués ;
- contrôle du nombre de lignes réellement insérées dans SQLite ;
- tests de pagination, de sélection aléatoire stable, de reprise hors ligne et de temps de démarrage.

## Stratégie de réalisation

La cible est bien une banque complète de 100 000 activités. Pour protéger l'application et rendre les erreurs détectables, la fabrication, la validation et l'importation se feront en lots techniques contrôlés. Ces lots ne changent pas l'objectif final : ils évitent de charger un seul énorme fichier JavaScript ou de lancer une transaction SQLite démesurée.

Chaque lot doit être validé automatiquement puis testé dans l'application avant de poursuivre. Le compteur officiel ne progresse qu'après insertion vérifiée dans SQLite. La première étape est un audit du chemin d'importation et des performances sur la base des 1 030 activités déjà présentes.

## État initial de référence

Au démarrage de ce plan, les lots 001, 002 et 003 sont présents dans la branche de développement. L'utilisateur a confirmé l'installation et le bon fonctionnement de l'APK contenant le lot 003. Cela valide le fonctionnement de cette version testée, mais ne vaut pas encore validation de la banque complète de 100 000 activités.
