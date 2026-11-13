import './style.css';
import schemaSql from '../../../database/schema-v4.sql?raw';
import { sqliteDatabase } from '../database/SQLiteDatabase.js';
import { ExerciseService } from '../services/ExerciseService.js';
import { ProgressService } from '../services/ProgressService.js';
import { SeedService } from '../services/SeedService.js';
import { ContentService } from '../services/ContentService.js';

const el = {
  title: document.querySelector('#statusTitle'),
  message: document.querySelector('#statusMessage'),
  technical: document.querySelector('#technicalMessage'),
  dot: document.querySelector('#statusDot'),
  panel: document.querySelector('#exercisePanel'),
  chapter: document.querySelector('#chapterLabel'),
  question: document.querySelector('#questionText'),
  answers: document.querySelector('#answers'),
  feedback: document.querySelector('#feedback'),
  next: document.querySelector('#nextButton'),
  progress: document.querySelector('#progressLabel'),
  score: document.querySelector('#scoreLabel'),
  historyButton: document.querySelector('#historyButton'),
  historyPanel: document.querySelector('#historyPanel'),
  historyList: document.querySelector('#historyList'),
  exerciseTitle: document.querySelector('#exerciseTitle'),
  levelChip: document.querySelector('#levelChip'),
  grammarButton: document.querySelector('#grammarModuleButton'),
  ceButton: document.querySelector('#ceModuleButton'),
  coButton: document.querySelector('#coModuleButton'),
  b1Button: document.querySelector('#b1LevelButton'),
  b2Button: document.querySelector('#b2LevelButton'),
  readingSupport: document.querySelector('#readingSupport'),
  readingTitle: document.querySelector('#readingTitle'),
  readingText: document.querySelector('#readingText'),
  audioSupport: document.querySelector('#audioSupport'),
  audioTitle: document.querySelector('#audioTitle'),
  audioPlay: document.querySelector('#audioPlayButton'),
  audioStop: document.querySelector('#audioStopButton'),
  audioStatus: document.querySelector('#audioStatus'),
  transcriptionButton: document.querySelector('#transcriptionButton'),
  audioTranscript: document.querySelector('#audioTranscript')
};
const exercises = new ExerciseService(sqliteDatabase);
const progress = new ProgressService(sqliteDatabase);
const content = new ContentService(sqliteDatabase);
const moduleIds = {};
let activeModule = 'GRAM';
let activeLevel = 'B1';
let moduleId = null;
let batch = [];
let index = 0;
let answered = false;
let correct = 0;
let attempted = 0;
let startedAt = 0;
let currentAudio = null;

function status(kind, heading, detail, diagnostic = '') {
  el.title.textContent = heading;
  el.message.textContent = detail;
  el.technical.textContent = diagnostic;
  el.dot.className = 'status-dot ' + kind;
}
function normalize(value) {
  return String(value ?? '').trim().toLocaleLowerCase('fr');
}
function updateScore() {
  el.score.textContent = correct + ' bonne(s) réponse(s) sur ' + attempted;
}
function stopAudio() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (el.audioStatus && currentAudio) el.audioStatus.textContent = 'Lecture arrêtée.';
}

function playAudio() {
  if (!currentAudio?.transcription) return;
  if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') {
    el.audioStatus.textContent = 'La lecture vocale n’est pas disponible sur cet appareil. Vérifiez que le moteur de synthèse vocale français est installé.';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new window.SpeechSynthesisUtterance(currentAudio.transcription);
  utterance.lang = 'fr-FR';
  utterance.rate = activeLevel === 'B2' ? 0.96 : 0.91;
  utterance.pitch = 1;
  const frenchVoice = window.speechSynthesis.getVoices().find((voice) => /^fr([_-]|$)/i.test(voice.lang));
  if (frenchVoice) utterance.voice = frenchVoice;
  utterance.onstart = () => { el.audioStatus.textContent = 'Lecture en cours…'; };
  utterance.onend = () => { el.audioStatus.textContent = 'Écoute terminée. Vous pouvez réécouter le document.'; };
  utterance.onerror = () => { el.audioStatus.textContent = 'La lecture a échoué. Vérifiez la disponibilité de la voix française sur votre appareil.'; };
  window.speechSynthesis.speak(utterance);
}

async function displayQuestion() {
  const item = batch[index];
  if (!item) return;
  stopAudio();
  answered = false;
  startedAt = Date.now();
  el.chapter.textContent = item.chapitre + ' · Difficulté ' + item.difficulte + '/5';
  if (item.support_ecrit_id && activeModule === 'CE') {
    const support = await content.getWrittenSupport(item.support_ecrit_id);
    if (!support) throw new Error('Le texte de compréhension écrite est introuvable.');
    el.readingTitle.textContent = support.titre;
    el.readingText.textContent = support.texte_contenu;
    el.readingSupport.hidden = false;
  } else {
    el.readingSupport.hidden = true;
    el.readingTitle.textContent = '';
    el.readingText.textContent = '';
  }

  if (activeModule === 'CO' && item.audio_id) {
    currentAudio = await content.getAudio(item.audio_id);
    if (!currentAudio?.transcription) throw new Error('Le support audio de compréhension orale est introuvable.');
    const audioTitles = {
      'co-b1-dialogue-gare': 'À la gare : acheter un billet',
      'co-b1-message-centre-sportif': 'Message du centre sportif',
      'co-b2-interview-teletravail': 'Interview : organiser le télétravail',
      'co-b2-reportage-mobilite': 'Reportage : un nouveau plan de mobilité'
    };
    el.audioTitle.textContent = audioTitles[currentAudio.stable_code] || 'Document de compréhension orale';
    el.audioTranscript.textContent = currentAudio.transcription;
    el.audioTranscript.hidden = true;
    el.transcriptionButton.hidden = true;
    el.audioStatus.textContent = 'Prêt à écouter. La lecture utilise la voix française installée sur votre appareil.';
    el.audioSupport.hidden = false;
  } else {
    currentAudio = null;
    el.audioSupport.hidden = true;
    el.audioTranscript.textContent = '';
    el.audioTranscript.hidden = true;
    el.transcriptionButton.hidden = true;
  }

  el.question.textContent = item.enonce;
  el.progress.textContent = 'Question ' + (index + 1) + ' / ' + batch.length;
  el.feedback.hidden = true;
  el.feedback.textContent = '';
  el.next.hidden = true;
  el.answers.replaceChildren();

  let options = [];
  try { options = JSON.parse(item.options_json || '[]'); } catch { /* données invalides */ }
  if (!Array.isArray(options) || options.length < 2) {
    el.feedback.textContent = 'Les choix de réponse sont indisponibles.';
    el.feedback.hidden = false;
    return;
  }
  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.textContent = option;
    button.addEventListener('click', () => submitAnswer(item, option, button));
    el.answers.append(button);
  });
}
async function submitAnswer(item, selected, selectedButton) {
  if (answered) return;
  answered = true;
  const isCorrect = normalize(selected) === normalize(item.bonne_reponse);
  [...el.answers.querySelectorAll('button')].forEach((button) => {
    button.disabled = true;
    if (normalize(button.textContent) === normalize(item.bonne_reponse)) button.classList.add('correct');
  });
  if (!isCorrect) selectedButton.classList.add('incorrect');

  const snapshot = {
    stable_id: item.stable_id,
    module_code: activeModule,
    chapitre: item.chapitre,
    niveau: item.niveau,
    enonce: item.enonce,
    options: JSON.parse(item.options_json || '[]'),
    bonne_reponse: item.bonne_reponse,
    explication: item.explication
  };
  let saved = true;
  try {
    await progress.recordAnswer({
      exercise: item,
      questionSnapshot: snapshot,
      answer: selected,
      isCorrect,
      elapsedSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000))
    });
    // Le score affiché est mis à jour uniquement après confirmation SQLite.
    attempted += 1;
    if (isCorrect) correct += 1;
  } catch (error) {
    saved = false;
    console.error('[TCF V4.0] Enregistrement impossible', error);
  }

  el.feedback.textContent =
    (isCorrect ? 'Bonne réponse ! ' : 'Pas tout à fait. La bonne réponse est : ' + item.bonne_reponse + '. ') +
    item.explication + (saved ? '' : ' Attention : cette tentative n’a pas pu être enregistrée.');
  el.feedback.hidden = false;
  if (activeModule === 'CO' && el.transcriptionButton) el.transcriptionButton.hidden = false;
  el.next.hidden = false;
  el.next.textContent = index + 1 < batch.length ? 'Question suivante' : 'Charger la suite';
  updateScore();
}
async function showHistory() {
  el.historyButton.disabled = true;
  el.historyButton.textContent = 'Chargement…';
  try {
    const entries = await progress.listHistory({ limit: 50, offset: 0 });
    el.historyList.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'history-empty';
      empty.textContent = 'Aucune réponse enregistrée pour le moment. Réalisez quelques exercices : vos tentatives apparaîtront ici.';
      el.historyList.append(empty);
    } else {
      entries.forEach((entry) => {
        let snapshot = {};
        try { snapshot = JSON.parse(entry.question_snapshot_json || '{}'); } catch { /* instantané illisible */ }
        const card = document.createElement('article');
        card.className = 'history-entry';
        const heading = document.createElement('div');
        heading.className = 'history-entry-heading';
        const title = document.createElement('h3');
        const moduleLabel = snapshot.module_code === 'CO' ? 'Compréhension orale · ' : (snapshot.module_code === 'CE' ? 'Compréhension écrite · ' : '');
        title.textContent = moduleLabel + (snapshot.chapitre || 'Exercice');
        const result = document.createElement('span');
        result.className = entry.est_correct ? 'history-result good' : 'history-result wrong';
        result.textContent = entry.est_correct ? 'Correcte' : 'À revoir';
        heading.append(title, result);
        const question = document.createElement('p');
        question.className = 'history-question';
        question.textContent = snapshot.enonce || 'Énoncé non disponible';
        const answer = document.createElement('p');
        answer.textContent = 'Votre réponse : ' + (entry.reponse_donnee ?? 'Non renseignée');
        const expected = document.createElement('p');
        expected.textContent = 'Bonne réponse : ' + (snapshot.bonne_reponse ?? 'Non disponible');
        const date = document.createElement('small');
        const parsedDate = entry.date_tentative ? new Date(entry.date_tentative.replace(' ', 'T') + 'Z') : null;
        date.textContent = parsedDate && !Number.isNaN(parsedDate.getTime())
          ? 'Tentative du ' + parsedDate.toLocaleString('fr-FR')
          : 'Date non disponible';
        card.append(heading, question, answer, expected, date);
        el.historyList.append(card);
      });
    }
    el.historyPanel.hidden = false;
    el.historyPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.historyButton.textContent = 'Actualiser mon historique';
  } catch (error) {
    console.error('[TCF V4.0] Historique impossible à charger', error);
    el.historyButton.textContent = 'Réessayer';
    status('error', 'Historique indisponible', 'Les réponses enregistrées ne peuvent pas être affichées.', String(error?.message || error));
  } finally {
    el.historyButton.disabled = false;
  }
}
async function loadBatch() {
  batch = await exercises.getNextBatch({
    moduleId,
    level: activeLevel,
    limit: 5,
    premiumAccess: false
  });
  index = 0;
  if (!batch.length) {
    el.chapter.textContent = '';
    el.question.textContent = 'Aucune question gratuite disponible pour ce niveau.';
    el.answers.replaceChildren();
    el.next.hidden = true;
    return;
  }
  await displayQuestion();
}
async function refreshModuleStats() {
  const savedStats = await progress.getModuleStats(moduleId);
  attempted = Number(savedStats?.total_tentees ?? 0);
  correct = Number(savedStats?.total_reussies ?? 0);
  updateScore();
}
function updateTrainingControls() {
  const isCE = activeModule === 'CE';
  const moduleName = activeModule === 'CO' ? 'Compréhension orale' : (isCE ? 'Compréhension écrite' : 'Grammaire');
  el.exerciseTitle.textContent = moduleName + ' — niveau ' + activeLevel;
  el.levelChip.textContent = activeLevel;
  el.grammarButton?.classList.toggle('selected', activeModule === 'GRAM');
  el.ceButton?.classList.toggle('selected', isCE);
  el.coButton?.classList.toggle('selected', activeModule === 'CO');
  el.b1Button?.classList.toggle('selected', activeLevel === 'B1');
  el.b2Button?.classList.toggle('selected', activeLevel === 'B2');
}
async function chooseModule(code) {
  if (!moduleIds[code]) return;
  activeModule = code;
  moduleId = moduleIds[code];
  updateTrainingControls();
  await refreshModuleStats();
  await loadBatch();
  const moduleName = code === 'CO' ? 'Compréhension orale' : (code === 'CE' ? 'Compréhension écrite' : 'Grammaire');
  status('success', 'Module chargé',
    moduleName + ' — niveau ' + activeLevel + ' : exercices disponibles hors ligne.',
    batch.length + ' question(s) chargée(s).');
}
async function chooseLevel(level) {
  activeLevel = level;
  updateTrainingControls();
  await refreshModuleStats();
  await loadBatch();
  const moduleName = activeModule === 'CO' ? 'Compréhension orale' : (activeModule === 'CE' ? 'Compréhension écrite' : 'Grammaire');
  status('success', 'Niveau chargé',
    moduleName + ' — niveau ' + activeLevel + '.',
    batch.length + ' question(s) disponibles hors ligne.');
}
function handleModuleError(error) {
  console.error('[TCF V4.0] Changement de module impossible', error);
  status('error', 'Chargement impossible', 'Le module demandé ne peut pas être chargé.', String(error?.message || error));
}
async function start() {
  try {
    if (!window.Capacitor?.isNativePlatform?.()) {
      status('warning', 'Version Android requise',
        'Installez l’APK V4.0 pour utiliser les exercices et la base SQLite locale.',
        'Le mode navigateur ne démarre pas la base SQLite native.');
      return;
    }
    await sqliteDatabase.open(schemaSql);
    const tables = await sqliteDatabase.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const count = tables.values?.length ?? 0;
    if (count !== 14) throw new Error('Nombre de tables inattendu : ' + count + ' (14 attendues).');

    await new SeedService(sqliteDatabase).ensureInitialContent();
    const moduleResult = await sqliteDatabase.query(
      "SELECT id, code FROM modules WHERE code IN ('GRAM', 'CE', 'CO') AND is_active = 1"
    );
    for (const row of (moduleResult.values ?? [])) moduleIds[row.code] = row.id;
    if (!moduleIds.GRAM || !moduleIds.CE || !moduleIds.CO) throw new Error('Les modules Grammaire, Compréhension écrite et Compréhension orale ne sont pas initialisés.');
    moduleId = moduleIds.GRAM;
    activeModule = 'GRAM';
    activeLevel = 'B1';
    await refreshModuleStats();
    updateTrainingControls();

    el.panel.hidden = false;
    // Les commandes d'interface sont attachées uniquement si leur élément existe.
    // Cela évite qu'un ancien index.html en cache bloque toute l'initialisation.
    if (el.historyButton) el.historyButton.addEventListener('click', showHistory);
    if (el.grammarButton) el.grammarButton.addEventListener('click', () => chooseModule('GRAM').catch(handleModuleError));
    if (el.ceButton) el.ceButton.addEventListener('click', () => chooseModule('CE').catch(handleModuleError));
    if (el.coButton) el.coButton.addEventListener('click', () => chooseModule('CO').catch(handleModuleError));
    if (el.audioPlay) el.audioPlay.addEventListener('click', playAudio);
    if (el.audioStop) el.audioStop.addEventListener('click', stopAudio);
    if (el.transcriptionButton) el.transcriptionButton.addEventListener('click', () => {
      el.audioTranscript.hidden = !el.audioTranscript.hidden;
      el.transcriptionButton.textContent = el.audioTranscript.hidden ? 'Afficher la transcription' : 'Masquer la transcription';
    });
    if (el.b1Button) el.b1Button.addEventListener('click', () => chooseLevel('B1').catch(handleModuleError));
    if (el.b2Button) el.b2Button.addEventListener('click', () => chooseLevel('B2').catch(handleModuleError));
    await loadBatch();
    if (el.next) el.next.addEventListener('click', async () => {
      try {
        if (index + 1 < batch.length) {
          index += 1;
          await displayQuestion();
        } else {
          await loadBatch();
        }
      } catch (error) {
        status('error', 'Chargement impossible', 'La question ou son document ne peut pas être chargé.', String(error?.message || error));
      }
    });
    status('success', 'Exercices disponibles',
      'Grammaire B1, Compréhension écrite et Compréhension orale B1-B2 sont disponibles hors ligne.',
      count + ' tables vérifiées · ' + batch.length + ' questions chargées.');
  } catch (error) {
    console.error('[TCF V4.0] Initialisation impossible', error);
    status('error', 'Initialisation à vérifier',
      'La base SQLite ou le pack d’exercices n’a pas pu être initialisé.',
      String(error?.message || error));
  }
}
start();
