#!/usr/bin/env python3
"""Tests d'intégrité du schéma SQLite V4. Ne modifie jamais le DDL validé."""
from pathlib import Path
import re
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "database" / "schema-v4.sql"

class SchemaV4Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sql = SCHEMA.read_text(encoding="utf-8")
        # Les PRAGMA de connexion sont appliqués séparément, comme sur l'adaptateur natif.
        sql = re.sub(r"^\s*PRAGMA\b[^;]*;\s*", "", sql, flags=re.IGNORECASE | re.MULTILINE)
        cls.db = sqlite3.connect(":memory:")
        cls.db.row_factory = sqlite3.Row
        cls.db.execute("PRAGMA foreign_keys = ON")
        cls.db.executescript(sql)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_exactly_fourteen_expected_tables(self):
        actual = {r[0] for r in self.db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )}
        expected = {
            "modules", "packs", "pack_versions", "supports_ecrits", "fichiers_audio",
            "sujets_expression", "exercices", "user_selection_cursor", "user_history",
            "user_exercise_stats", "favoris", "user_productions", "user_global_stats",
            "app_licenses"
        }
        self.assertEqual(actual, expected)

    def test_foreign_keys_are_enabled_and_schema_is_consistent(self):
        self.assertEqual(self.db.execute("PRAGMA foreign_keys").fetchone()[0], 1)
        self.assertEqual(self.db.execute("PRAGMA foreign_key_check").fetchall(), [])

    def test_core_relations_and_user_data_round_trip(self):
        c = self.db
        c.execute("INSERT INTO modules(code,name) VALUES('CE','Compréhension écrite')")
        module_id = c.execute("SELECT id FROM modules WHERE code='CE'").fetchone()[0]
        c.execute("INSERT INTO packs(code,name,is_premium) VALUES('free','Pack gratuit',0)")
        pack_id = c.execute("SELECT id FROM packs WHERE code='free'").fetchone()[0]
        c.execute("INSERT INTO pack_versions(pack_id,version_number,checksum) VALUES(?,?,?)",
                  (pack_id, 1, "sha256-test"))
        c.execute("""INSERT INTO supports_ecrits(pack_id,stable_code,titre,texte_contenu)
                     VALUES(?,?,?,?)""", (pack_id, "CE-001", "Texte", "Contenu"))
        support_id = c.execute("SELECT id FROM supports_ecrits").fetchone()[0]
        c.execute("""INSERT INTO sujets_expression
                     (pack_id,stable_code,module_id,niveau,consigne)
                     VALUES(?,?,?,?,?)""", (pack_id, "SUJET-1", module_id, "B1", "Consigne"))
        sujet_id = c.execute("SELECT id FROM sujets_expression").fetchone()[0]
        c.execute("""INSERT INTO fichiers_audio(pack_id,stable_code,chemin_fichier,duree_secondes)
                     VALUES(?,?,?,?)""", (pack_id, "AUD-1", "audio/test.mp3", 30))
        audio_id = c.execute("SELECT id FROM fichiers_audio").fetchone()[0]
        c.execute("""INSERT INTO exercices
                     (stable_id,pack_id,module_id,support_ecrit_id,audio_id,sujet_id,
                      chapitre,niveau,shuffle_key,enonce,explication)
                     VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                  ("stable-ex-1", pack_id, module_id, support_id, audio_id, sujet_id,
                   "Chapitre 1", "B1", 100, "Question ?", "Explication"))
        exercise_id = c.execute("SELECT id FROM exercices").fetchone()[0]
        c.execute("""INSERT INTO user_selection_cursor(module_id,niveau,last_shuffle_key,last_id)
                     VALUES(?,?,?,?)""", (module_id, "B1", 100, exercise_id))
        c.execute("""INSERT INTO user_history
                     (exercice_id,question_snapshot_json,reponse_donnee,est_correct,temps_passe_secondes)
                     VALUES(?,?,?,?,?)""", (exercise_id, '{"enonce":"Question ?"}', "A", 1, 12))
        c.execute("""INSERT INTO user_exercise_stats
                     (exercice_id,nombre_essais,nombre_succes,consecutive_succes)
                     VALUES(?,?,?,?)""", (exercise_id, 1, 1, 1))
        c.execute("INSERT INTO favoris(exercice_id) VALUES(?)", (exercise_id,))
        c.execute("""INSERT INTO user_productions
                     (sujet_id,sujet_code,consigne_originale,module_code,niveau,contenu_texte)
                     VALUES(?,?,?,?,?,?)""",
                  (sujet_id, "SUJET-1", "Consigne", "EE", "B1", "Ma production"))
        c.execute("INSERT INTO user_global_stats(module_id,total_tentees,total_reussies) VALUES(?,?,?)",
                  (module_id, 1, 1))
        c.execute("""INSERT INTO app_licenses
                     (license_key_text,expiration_date,signature_b64,is_active)
                     VALUES(?,?,?,?)""", ("LIC-TEST", "2099-12-31T23:59:59Z", "c2ln", 1))
        c.commit()

        self.assertEqual(c.execute("SELECT COUNT(*) FROM exercices").fetchone()[0], 1)
        self.assertEqual(c.execute("SELECT COUNT(*) FROM user_history").fetchone()[0], 1)
        self.assertEqual(c.execute("SELECT COUNT(*) FROM favoris").fetchone()[0], 1)
        self.assertEqual(c.execute("SELECT total_reussies FROM user_global_stats").fetchone()[0], 1)
        self.assertEqual(c.execute("SELECT COUNT(*) FROM app_licenses WHERE is_active=1").fetchone()[0], 1)

    def test_invalid_foreign_key_is_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("""INSERT INTO exercices
                (stable_id,pack_id,module_id,chapitre,niveau,shuffle_key,enonce,explication)
                VALUES('bad-fk',999,999,'X','B1',1,'Q','E')""")

    def test_check_constraints_reject_invalid_level(self):
        self.db.execute("INSERT INTO modules(code,name) VALUES('TEST','Test')")
        module_id = self.db.execute("SELECT id FROM modules WHERE code='TEST'").fetchone()[0]
        self.db.execute("INSERT INTO packs(code,name) VALUES('test-pack','Test')")
        pack_id = self.db.execute("SELECT id FROM packs WHERE code='test-pack'").fetchone()[0]
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("""INSERT INTO sujets_expression
                (pack_id,stable_code,module_id,niveau,consigne)
                VALUES(?,?,?,?,?)""", (pack_id, "bad-level", module_id, "D1", "Test"))

if __name__ == "__main__":
    unittest.main(verbosity=2)
