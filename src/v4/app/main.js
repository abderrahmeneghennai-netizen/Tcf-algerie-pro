import './style.css';
import schemaSql from '../../../database/schema-v4.sql?raw';
import { sqliteDatabase } from '../database/SQLiteDatabase.js';
import { ExerciseService } from '../services/ExerciseService.js';
import { ProgressService } from '../services/ProgressService.js';
import { SeedService } from '../services/SeedService.js';

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
  score: document.querySelector('#scoreLabel')
};
const exercises = new ExerciseService(sqliteDatabase);
const progress = new ProgressService(sqliteDatabase);
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
function displayQuestion() {
  const item = batch[index];
  if (!item) return;
  answered = false;
  startedAt = Date.now();
  el.chapter.textContent = item.chapitre + ' · Difficulté ' + item.difficulte + '/5';
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
  attempted += 1;
  if (isCorrect) correct += 1;

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
async function loadBatch() {
  batch = await exercises.getNextBatch({
    moduleId,
    level: 'B1',
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
  displayQuestion();
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
      "SELECT id FROM modules WHERE code = 'GRAM' AND is_active = 1 LIMIT 1"
    );
    moduleId = moduleResult.values?.[0]?.id;
    if (!moduleId) throw new Error('Le module Grammaire n’a pas été initialisé.');

    el.panel.hidden = false;
    await loadBatch();
    el.next.addEventListener('click', async () => {
      if (index + 1 < batch.length) {
        index += 1;
        displayQuestion();
      } else {
        try { await loadBatch(); }
        catch (error) { status('error', 'Chargement impossible', 'La suite ne peut pas être chargée.', String(error?.message || error)); }
      }
    });
    status('success', 'Exercices disponibles',
      'Le pack gratuit de Grammaire B1 est chargé. Les réponses sont enregistrées hors ligne.',
      count + ' tables vérifiées · ' + batch.length + ' questions chargées.');
  } catch (error) {
    console.error('[TCF V4.0] Initialisation impossible', error);
    status('error', 'Initialisation à vérifier',
      'La base SQLite ou le pack d’exercices n’a pas pu être initialisé.',
      String(error?.message || error));
  }
}
start();
