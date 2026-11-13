-- TCF ALGÉRIE PRO V4.0
-- Schéma SQLite fourni et validé par le propriétaire du projet.
-- NE PAS MODIFIER les tables, colonnes, contraintes ou relations.
-- Configuration globale à appliquer à chaque ouverture de connexion.
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

-- 1. Modules de l'application
CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,          -- 'CO', 'CE', 'GRAM', 'EE', 'EO'
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
);

-- 2. Packs d'exercices (Gratuit / Premium)
CREATE TABLE IF NOT EXISTS packs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,          -- 'pack_free_discovery', 'pack_premium_100k'
    name TEXT NOT NULL,
    is_premium INTEGER DEFAULT 0 CHECK (is_premium IN (0, 1)),
    description TEXT
);

-- 3. Versioning des packs avec vérification par checksum
CREATE TABLE IF NOT EXISTS pack_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    checksum TEXT NOT NULL,
    date_maj TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(pack_id, version_number)
);

-- 4. Textes supports pour la Compréhension Écrite (CE)
CREATE TABLE IF NOT EXISTS supports_ecrits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER NOT NULL,
    stable_code TEXT NOT NULL,
    titre TEXT NOT NULL,
    texte_contenu TEXT NOT NULL,
    source TEXT,
    is_archived INTEGER DEFAULT 0 CHECK (is_archived IN (0, 1)),
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(pack_id, stable_code)
);

-- 5. Fichiers audio pour la Compréhension Orale (CO)
CREATE TABLE IF NOT EXISTS fichiers_audio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER NOT NULL,
    stable_code TEXT NOT NULL,
    chemin_fichier TEXT NOT NULL,
    duree_secondes INTEGER CHECK (duree_secondes >= 0),
    transcription TEXT,
    is_archived INTEGER DEFAULT 0 CHECK (is_archived IN (0, 1)),
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(pack_id, stable_code)
);

-- 6. Sujets d'Expression Écrite (EE) & Orale (EO)
CREATE TABLE IF NOT EXISTS sujets_expression (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id INTEGER NOT NULL,
    stable_code TEXT NOT NULL,
    module_id INTEGER NOT NULL,
    niveau TEXT NOT NULL CHECK (niveau IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    consigne TEXT NOT NULL,
    duree_minutes INTEGER CHECK (duree_minutes > 0),
    nb_mots_attendu TEXT,
    grille_evaluation_json TEXT,
    is_archived INTEGER DEFAULT 0 CHECK (is_archived IN (0, 1)),
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(pack_id, stable_code)
);

-- 7. Table Principale des Exercices
CREATE TABLE IF NOT EXISTS exercices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stable_id TEXT UNIQUE NOT NULL,     -- UUID stable pour les patches de mise à jour
    pack_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    support_ecrit_id INTEGER,
    audio_id INTEGER,
    sujet_id INTEGER,
    chapitre TEXT NOT NULL,
    niveau TEXT NOT NULL CHECK (niveau IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    difficulte INTEGER DEFAULT 1 CHECK (difficulte BETWEEN 1 AND 5),
    shuffle_key INTEGER NOT NULL,       -- Entier pour le mélange et la pagination stable
    enonce TEXT NOT NULL,
    options_json TEXT,                  -- NULL autorisé pour les questions ouvertes EE/EO
    bonne_reponse TEXT,                 -- NULL autorisé pour les questions ouvertes EE/EO
    explication TEXT NOT NULL,
    is_archived INTEGER DEFAULT 0 CHECK (is_archived IN (0, 1)),
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (support_ecrit_id) REFERENCES supports_ecrits(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (audio_id) REFERENCES fichiers_audio(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (sujet_id) REFERENCES sujets_expression(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 8. Table de Curseur Persistant (Pagination stable avec bouclage automatique)
CREATE TABLE IF NOT EXISTS user_selection_cursor (
    module_id INTEGER NOT NULL,
    niveau TEXT NOT NULL CHECK (niveau IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    last_shuffle_key INTEGER DEFAULT 0,
    last_id INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (module_id, niveau)
);

-- 9. Historique des réponses avec instantané (Snapshot) de la question présentée
CREATE TABLE IF NOT EXISTS user_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercice_id INTEGER NOT NULL,
    question_snapshot_json TEXT NOT NULL, -- Conserve l'énoncé, options et réponse au moment exact de la tentative
    date_tentative TEXT DEFAULT (datetime('now')),
    reponse_donnee TEXT,
    est_correct INTEGER NOT NULL CHECK (est_correct IN (0, 1)),
    temps_passe_secondes INTEGER CHECK (temps_passe_secondes >= 0),
    FOREIGN KEY (exercice_id) REFERENCES exercices(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 10. Statistiques individuelles (Répétition espacée)
CREATE TABLE IF NOT EXISTS user_exercise_stats (
    exercice_id INTEGER PRIMARY KEY,
    derniere_vue TEXT,
    nombre_essais INTEGER DEFAULT 0 CHECK (nombre_essais >= 0),
    nombre_succes INTEGER DEFAULT 0 CHECK (nombre_succes >= 0),
    consecutive_succes INTEGER DEFAULT 0 CHECK (consecutive_succes >= 0),
    prochaine_revision TEXT,
    FOREIGN KEY (exercice_id) REFERENCES exercices(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 11. Favoris utilisateur
CREATE TABLE IF NOT EXISTS favoris (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercice_id INTEGER UNIQUE NOT NULL,
    date_ajout TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (exercice_id) REFERENCES exercices(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 12. Productions personnelles renforcées (EE & EO) avec snapshot complet
CREATE TABLE IF NOT EXISTS user_productions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sujet_id INTEGER NOT NULL,
    sujet_code TEXT NOT NULL,
    consigne_originale TEXT NOT NULL,
    module_code TEXT NOT NULL,
    niveau TEXT NOT NULL,
    date_production TEXT DEFAULT (datetime('now')),
    contenu_texte TEXT,
    audio_path TEXT,
    autoevaluation_note TEXT,
    FOREIGN KEY (sujet_id) REFERENCES sujets_expression(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 13. Statistiques globales par module
CREATE TABLE IF NOT EXISTS user_global_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER UNIQUE NOT NULL,
    total_tentees INTEGER DEFAULT 0 CHECK (total_tentees >= 0),
    total_reussies INTEGER DEFAULT 0 CHECK (total_reussies >= 0),
    niveau_estime TEXT DEFAULT 'A1' CHECK (niveau_estime IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 14. Gestion de la Licence Premium Hors Ligne (Signature Asymétrique)
CREATE TABLE IF NOT EXISTS app_licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_key_text TEXT UNIQUE NOT NULL,
    expiration_date TEXT NOT NULL,
    signature_b64 TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    date_activation TEXT DEFAULT (datetime('now'))
);
