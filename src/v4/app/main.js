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
  b1Button: document.querySelector('#b1LevelButton'),
  b2Button: document.querySelector('#b2LevelButton'),
  readingSupport: document.querySelector('#readingSupport'),
  readingTitle: document.querySelector('#readingTitle'),
  readingText: document.querySelector('#readingText')
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
async function displayQuestion() {
  const item = batch[index];
  if (!item) return;
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
        title.textContent = snapshot.chapitre || 'Exercice de grammaire';
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
  el.exerciseTitle.textContent = (isCE ? 'Compréhension écrite' : 'Grammaire') + ' — niveau ' + activeLevel;
  el.levelChip.textContent = activeLevel;
  el.grammarButton?.classList.toggle('selected', !isCE);
  el.ceButton?.classList.toggle('selected', isCE);
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
  status('success', 'Module chargé',
    (code === 'CE' ? 'Compréhension écrite' : 'Grammaire') + ' — niveau ' + activeLevel + ' : exercices disponibles hors ligne.',
    batch.length + ' question(s) chargée(s).');
}
async function chooseLevel(level) {
  activeLevel = level;
  updateTrainingControls();
  await refreshModuleStats();
  await loadBatch();
  status('success', 'Niveau chargé',
    (activeModule === 'CE' ? 'Compréhension écrite' : 'Grammaire') + ' — niveau ' + activeLevel + '.',
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
      "SELECT id, code FROM modules WHERE code IN ('GRAM', 'CE') AND is_active = 1"
    );
    for (const row of (moduleResult.values ?? [])) moduleIds[row.code] = row.id;
    if (!moduleIds.GRAM || !moduleIds.CE) throw new Error('Les modules Grammaire et Compréhension écrite ne sont pas initialisés.');
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
      'Grammaire B1 et Compréhension écrite B1-B2 sont disponibles hors ligne.',
      count + ' tables vérifiées · ' + batch.length + ' questions chargées.');
  } catch (error) {
    console.error('[TCF V4.0] Initialisation impossible', error);
    status('error', 'Initialisation à vérifier',
      'La base SQLite ou le pack d’exercices n’a pas pu être initialisé.',
      String(error?.message || error));
  }
}
start();
