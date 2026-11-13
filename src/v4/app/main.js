import './style.css';
import schemaSql from '../database/schema-v4.sql?raw';
import { sqliteDatabase } from '../database/SQLiteDatabase.js';

const title = document.querySelector('#statusTitle');
const message = document.querySelector('#statusMessage');
const technical = document.querySelector('#technicalMessage');
const dot = document.querySelector('#statusDot');

function showStatus(kind, heading, detail, diagnostic) {
  title.textContent = heading;
  message.textContent = detail;
  technical.textContent = diagnostic;
  dot.className = 'status-dot ' + kind;
}

async function startV4() {
  try {
    if (!window.Capacitor?.isNativePlatform?.()) {
      showStatus('warning', 'Application V4.0 prête pour Android',
        'Le moteur SQLite natif sera activé dans l’application Android installée.',
        'Environnement navigateur détecté : aucune base native n’a été ouverte.');
      return;
    }

    await sqliteDatabase.open(schemaSql);
    const result = await sqliteDatabase.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const tableCount = result.values?.length ?? 0;

    if (tableCount !== 14) {
      throw new Error('Nombre de tables inattendu : ' + tableCount + ' (14 attendues).');
    }

    showStatus('success', 'Base SQLite initialisée',
      'Le moteur local V4.0 a ouvert la base et vérifié les 14 tables.',
      'Contrôle des tables réussi. Les contenus pédagogiques seront intégrés dans une étape distincte.');
  } catch (error) {
    console.error('[TCF V4.0] Initialisation SQLite impossible', error);
    showStatus('error', 'Initialisation à vérifier',
      'La base SQLite n’a pas pu être initialisée sur cet appareil.',
      String(error?.message || error));
  }
}

startV4();
