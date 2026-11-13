import './style.css';
import schemaSql from '../../../database/schema-v4.sql?raw';
import { sqliteDatabase } from '../database/SQLiteDatabase.js';
import { ExerciseService } from '../services/ExerciseService.js';
import { ProgressService } from '../services/ProgressService.js';
import { SeedService } from '../services/SeedService.js';

const elements = {
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

const exerciseService = new ExerciseService(sqliteDatabase);
const progressService = new ProgressService(sqliteDatabase);

let grammarModuleId = null;
let batch = [];
let batchIndex = 0;
let answered = false;
let correctCount = 0;
let totalAnswered = 0;
let questionStartedAt = 0;

function showStatus(kind, heading, detail, diagnostic = '') {
  elements.title.textContent = heading;
  elements.message.textContent = detail;
  elements.technical.textContent = diagnostic;
  elements.dot.className = 'status-dot ' + kind;
}

function normalizeAnswer(value) {
  return String(value ?? '').trim().toLocaleLowerCase('fr');
}

function updateScore() {
  elements.score.textContent = correctCount + ' bonne(s) réponse(s) sur ' + totalAnswered;
}

function showQuestion() {
  const exercise = batch[batchIndex];
  if (!exercise) {
    elements.question.textContent = 'Aucune question disponible pour le moment.';
    elements.chapter.textContent = '';
    elements.answers.replaceChildren();
    return;
  }

  answered = false;
  questionStartedAt = Date.now();
  elements.chapter.textContent = exercise.chapitre + ' · Difficulté ' + exercise.difficulte + '/5';
  elements.question.textContent = exercise.enonce;
  elements.progress.textContent = 'Question ' + (batchIndex + 1) + ' / ' + batch.length;
  elements.feedback.hidden = true;
  elements.feedback.textContent = '';
  elements.next.hidden = true;
  elements.answers.replaceChildren();

  let options;
  try {
    options = JSON.parse(exercise.options_json || '[]');
  } catch {
    options = [];
  }

  if (!Array.isArray(options) || options.length < 2) {
    elements.feedback.hidden = false;
    elements.feedback.textContent = 'Les choix de réponse de cette question sont indisponibles.';
    return;
  }

  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.textContent = option;
    button.addEventListener('click', () => submitAnswer(exercise, option, button));
    elements.answers.append(button);
  });
}

async function submitAnswer(exercise, selectedAnswer, selectedButton) {
  if (answered) return;
  answered = true;

  const isCorrect = normalizeAnswer(selectedAnswer) === normalizeAnswer(exercise.bonne_reponse);
  totalAnswered += 1;
  if (isCorrect) correctCount += 1;

  [...elements.answers.querySelectorAll('button')].forEach((button) => {
    button.disabled = true;
    if (normalizeAnswer(button.textContent) === normalizeAnswer(exercise.bonne_reponse)) {
      button.classList.add('correct');
    }
  });
  if (!isCorrect) selectedButton.classList.add('incorrect');

  const snapshot = {
    stable_id: exercise.stable_id,
    chapitre: exercise.chapitre,
    niveau: exercise.niveau,
    enonce: exercise.enonce,
    options: JSON.parse(exercise.options_json || '[]'),
    bonne_reponse: exercise.bonne_reponse,
    explication: exercise.explication
  };

  try {
    await progressService.recordAnswer({
      exercise,
      questionSnapshot: snapshot,
      answer: selectedAnswer,
      isCorrect,
      elapsedSeconds: Math.max(0, Math.round((Date.now() - questionStartedAt) / 1000))
    });
    elements.feedback.textContent = (isCorrect ? 'Bonne réponse ! ' : 'Pas tout à fait. La bonne réponse est : ' + exercise.bonne_reponse + '. ') + exercise.explication;
  } catch (error) {
    console.error('[TCF V4.0] Enregistrement de la réponse impossible', error);
    elements.feedback.textContent = (isCorrect ? 'Bonne réponse. ' : 'Réponse incorrecte. ') +
      exercise.explication + ' Attention : cette tentative n’a pas pu être enregistrée.';
  }

  elements.feedback.hidden = false;
  elements.next.hidden = false;
  elements.next.textContent = batchIndex + 1 < batch.length ? 'Question suivante' : 'Charger la suite';
  updateScore();
}

async function loadBatch() {
  batch = await exerciseService.getNextBatch({
    moduleId: grammarModuleId,
    level: 'B1',
    limit: 5,
    premiumAccess: false
  });
  batchIndex = 0;
  if (batch.length === 0) {
    elements.question.textContent = 'Aucune question gratuite disponible pour ce niveau.';
    elements.chapter.textContent = '';
    elements.answers.replaceChildren();
    elements.next.hidden = true;
    return;
  }
  showQuestion();
}

async function startV4() {
  try {
    if (!window.Capacitor?.isNativePlatform?.()) {
      showStatus('warning', 'Version Android requise',
        'Installez l’APK V4.0 pour utiliser les exercices et la base SQLite locale.',
        'Le mode navigateur ne démarre pas la base SQLite native.');
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

    await new SeedService(sqliteDatabase).ensureInitialContent();
    const moduleResult = await sqliteDatabase.query(
      "SELECT id FROM modules WHERE code = 'GRAM' AND is_active = 1 LIMIT 1"
    );
    grammarModuleId = moduleResult.values?.[0]?.id;
    if (!grammarModuleId) throw new Error('Le module Grammaire n’a pas été initialisé.');

    elements.panel.hidden = false;
    await loadBatch();
    elements.next.addEventListener('click', async () => {
      if (batchIndex + 1 < batch.length) {
        batchIndex += 1;
        showQuestion();
      } else {
        try {
          await loadBatch();
        } catch (error) {
          showStatus('error', 'Chargement impossible', 'La suite des exercices ne peut pas être chargée.', String(error?.message || error));
        }
      }
    });

    showStatus('success', 'Exercices disponibles',
      'La base locale est prête. Le pack gratuit de Grammaire B1 est chargé.',
      tableCount + ' tables vérifiées · Questions et résultats enregistrés hors ligne.');
  } catch (error) {
    console.error('[TCF V4.0] Initialisation impossible', error);
    showStatus('error', 'Initialisation à vérifier',
      'La base SQLite ou le pack d’exercices n’a pas pu être initialisé.',
      String(error?.message || error));
  }
}

startV4();
