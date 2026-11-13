import './style.css';
import schemaSql from '../../../database/schema-v4.sql?raw';
import { sqliteDatabase } from '../database/SQLiteDatabase.js';
import { ExerciseService } from '../services/ExerciseService.js';
import { ProgressService } from '../services/ProgressService.js';
import { SeedService } from '../services/SeedService.js';
import { ContentService } from '../services/ContentService.js';
import { ExpressionOraleService } from '../services/ExpressionOraleService.js';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

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
  eoButton: document.querySelector('#eoModuleButton'),
  oralPanel: document.querySelector('#oralPanel'),
  oralSubject: document.querySelector('#oralSubjectSelect'),
  oralDuration: document.querySelector('#oralDuration'),
  oralPrompt: document.querySelector('#oralPrompt'),
  oralRecord: document.querySelector('#oralRecordButton'),
  oralStop: document.querySelector('#oralStopButton'),
  oralRecordStatus: document.querySelector('#oralRecordStatus'),
  oralPlayback: document.querySelector('#oralPlayback'),
  oralTranscript: document.querySelector('#oralTranscript'),
  oralSpeech: document.querySelector('#oralSpeechButton'),
  oralSpeechStop: document.querySelector('#oralSpeechStopButton'),
  oralSpeechStatus: document.querySelector('#oralSpeechStatus'),
  oralSelfAssessment: document.querySelector('#oralSelfAssessment'),
  oralSave: document.querySelector('#oralSaveButton'),
  oralSaveStatus: document.querySelector('#oralSaveStatus'),
  questionCard: document.querySelector('.question-card'),
  progressLine: document.querySelector('.progress-line'),
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
const oralService = new ExpressionOraleService(sqliteDatabase);
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
let oralSubjects = [];
let currentOralSubject = null;
let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let recognition = null;
let recordedAudioUrl = null;

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
let frenchTtsLanguagePromise = null;

async function getFrenchTtsLanguage() {
  if (!frenchTtsLanguagePromise) {
    frenchTtsLanguagePromise = (async () => {
      const supported = await TextToSpeech.isLanguageSupported({ lang: 'fr-FR' });
      if (supported.supported) return 'fr-FR';
      const available = await TextToSpeech.getSupportedLanguages();
      const frenchLanguage = (available.languages || []).find((language) => /^fr([_-]|$)/i.test(language));
      if (!frenchLanguage) {
        throw new Error('Aucune voix française n’est proposée par le moteur vocal Android.');
      }
      return frenchLanguage;
    })().catch((error) => {
      frenchTtsLanguagePromise = null;
      throw error;
    });
  }
  return frenchTtsLanguagePromise;
}

async function stopAudio() {
  try {
    await TextToSpeech.stop();
  } catch (error) {
    console.warn('[TCF V4.0] Arrêt audio non confirmé', error);
  }
  if (el.audioStatus && currentAudio) el.audioStatus.textContent = 'Lecture arrêtée.';
}

async function playAudio() {
  if (!currentAudio?.transcription) return;
  el.audioPlay.disabled = true;
  el.audioStatus.textContent = 'Préparation de la lecture audio…';
  try {
    const language = await getFrenchTtsLanguage();
    await TextToSpeech.speak({
      text: currentAudio.transcription,
      lang: language,
      rate: 1.0,
      pitch: 1,
      volume: 1
    });
    el.audioStatus.textContent = 'Écoute terminée. Vous pouvez réécouter le document.';
  } catch (error) {
    console.error('[TCF V4.0] Lecture native impossible', error);
    el.audioStatus.textContent = 'La lecture audio a échoué : ' + String(error?.message || error);
  } finally {
    el.audioPlay.disabled = false;
  }
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
    el.audioStatus.textContent = 'Prêt à écouter. Lecture par le moteur vocal Android.';
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

async function loadOralSubjects() {
  oralSubjects = await oralService.listSubjects(activeLevel);
  el.oralSubject.replaceChildren();
  if (!oralSubjects.length) {
    currentOralSubject = null;
    el.oralPrompt.textContent = 'Aucun sujet gratuit disponible pour ce niveau.';
    el.oralDuration.textContent = activeLevel;
    el.oralSave.disabled = true;
    return;
  }
  oralSubjects.forEach((subject) => {
    const option = document.createElement('option');
    option.value = String(subject.id);
    option.textContent = subject.stable_code.replace('eo-' + activeLevel.toLowerCase() + '-', '').replaceAll('-', ' ');
    el.oralSubject.append(option);
  });
  currentOralSubject = oralSubjects[0];
  el.oralSubject.value = String(currentOralSubject.id);
  displayOralSubject();
  el.oralSave.disabled = false;
}

function displayOralSubject() {
  const subject = oralSubjects.find((item) => String(item.id) === el.oralSubject.value);
  if (!subject) return;
  currentOralSubject = subject;
  el.oralPrompt.textContent = subject.consigne;
  el.oralDuration.textContent = subject.duree_minutes + ' min';
  el.oralSaveStatus.textContent = '';
  el.oralTranscript.value = '';
  el.oralSelfAssessment.value = '';
}

async function startOralRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    el.oralRecordStatus.textContent = 'Cet appareil ne permet pas l’enregistrement audio dans cette version.';
    return;
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data?.size) recordedChunks.push(event.data);
    });
    mediaRecorder.addEventListener('stop', () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      recordedAudioUrl = URL.createObjectURL(blob);
      el.oralPlayback.src = recordedAudioUrl;
      el.oralPlayback.hidden = false;
      el.oralRecordStatus.textContent = 'Enregistrement terminé. Vous pouvez réécouter votre réponse.';
      mediaStream?.getTracks().forEach((track) => track.stop());
      mediaStream = null;
      el.oralRecord.disabled = false;
      el.oralStop.disabled = true;
    });
    mediaRecorder.addEventListener('error', () => {
      el.oralRecordStatus.textContent = 'Une erreur a interrompu l’enregistrement.';
      mediaStream?.getTracks().forEach((track) => track.stop());
      mediaStream = null;
      el.oralRecord.disabled = false;
      el.oralStop.disabled = true;
    });
    mediaRecorder.start();
    el.oralRecord.disabled = true;
    el.oralStop.disabled = false;
    el.oralRecordStatus.textContent = 'Enregistrement en cours… Appuyez sur Arrêter lorsque vous avez terminé.';
  } catch (error) {
    el.oralRecordStatus.textContent = 'Microphone indisponible ou autorisation refusée : ' + String(error?.message || error);
  }
}

function stopOralRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  } else {
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
    el.oralRecord.disabled = false;
    el.oralStop.disabled = true;
  }
}

function startOralTranscription() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    el.oralSpeechStatus.textContent = 'La reconnaissance vocale n’est pas disponible sur ce téléphone. Vous pouvez saisir votre réponse dans la zone de texte.';
    return;
  }
  try {
    recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalText = el.oralTranscript.value.trim();
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const part = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += (finalText ? ' ' : '') + part.trim();
        else interim += part;
      }
      el.oralTranscript.value = [finalText, interim].filter(Boolean).join(' ').trim();
    };
    recognition.onerror = (event) => {
      el.oralSpeechStatus.textContent = 'Transcription interrompue : ' + (event.error || 'erreur du moteur vocal') + '. Vous pouvez saisir le texte manuellement.';
    };
    recognition.onend = () => {
      el.oralSpeech.disabled = false;
      el.oralSpeechStop.disabled = true;
      if (!el.oralSpeechStatus.textContent.includes('Transcription interrompue')) {
        el.oralSpeechStatus.textContent = 'Transcription terminée. Relisez et corrigez le texte si nécessaire.';
      }
    };
    recognition.start();
    el.oralSpeech.disabled = true;
    el.oralSpeechStop.disabled = false;
    el.oralSpeechStatus.textContent = 'Écoute en cours… Parlez clairement en français.';
  } catch (error) {
    el.oralSpeechStatus.textContent = 'Impossible de démarrer la transcription : ' + String(error?.message || error);
  }
}

function stopOralTranscription() {
  try { recognition?.stop(); } catch { /* arrêt déjà demandé */ }
}

async function saveOralProduction() {
  el.oralSave.disabled = true;
  el.oralSaveStatus.textContent = 'Enregistrement de votre production dans SQLite…';
  try {
    await oralService.saveProduction({
      subject: currentOralSubject,
      transcript: el.oralTranscript.value,
      selfAssessment: el.oralSelfAssessment.value
    });
    el.oralSaveStatus.textContent = 'Votre production orale a été sauvegardée sur cet appareil.';
  } catch (error) {
    el.oralSaveStatus.textContent = String(error?.message || error);
  } finally {
    el.oralSave.disabled = false;
  }
}

async function openOralModule() {
  el.oralPanel.hidden = false;
  el.questionCard.hidden = true;
  el.progressLine.hidden = true;
  el.historyButton.hidden = true;
  el.historyPanel.hidden = true;
  el.readingSupport.hidden = true;
  el.audioSupport.hidden = true;
  await loadOralSubjects();
  status('success', 'Expression orale disponible',
    'Choisissez un sujet, enregistrez votre réponse et sauvegardez votre transcription localement.',
    oralSubjects.length + ' sujet(s) gratuit(s) au niveau ' + activeLevel + '.');
}

function closeOralModule() {
  el.oralPanel.hidden = true;
  el.questionCard.hidden = false;
  el.progressLine.hidden = false;
  el.historyButton.hidden = false;
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
  const names = { GRAM:'Grammaire', CE:'Compréhension écrite', CO:'Compréhension orale', EO:'Expression orale' };
  el.exerciseTitle.textContent = (names[activeModule] || 'Entraînement') + ' — niveau ' + activeLevel;
  el.levelChip.textContent = activeLevel;
  el.grammarButton?.classList.toggle('selected', activeModule === 'GRAM');
  el.ceButton?.classList.toggle('selected', activeModule === 'CE');
  el.coButton?.classList.toggle('selected', activeModule === 'CO');
  el.eoButton?.classList.toggle('selected', activeModule === 'EO');
  el.b1Button?.classList.toggle('selected', activeLevel === 'B1');
  el.b2Button?.classList.toggle('selected', activeLevel === 'B2');
}
async function chooseModule(code) {
  if (!moduleIds[code]) return;
  activeModule = code;
  moduleId = moduleIds[code];
  updateTrainingControls();
  if (code === 'EO') {
    await openOralModule();
    return;
  }
  closeOralModule();
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
  if (activeModule === 'EO') {
    await openOralModule();
    return;
  }
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
      "SELECT id, code FROM modules WHERE code IN ('GRAM', 'CE', 'CO', 'EO') AND is_active = 1"
    );
    for (const row of (moduleResult.values ?? [])) moduleIds[row.code] = row.id;
    if (!moduleIds.GRAM || !moduleIds.CE || !moduleIds.CO || !moduleIds.EO) throw new Error('Un des modules de formation n’est pas initialisé.');
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
    if (el.eoButton) el.eoButton.addEventListener('click', () => chooseModule('EO').catch(handleModuleError));
    if (el.oralSubject) el.oralSubject.addEventListener('change', displayOralSubject);
    if (el.oralRecord) el.oralRecord.addEventListener('click', startOralRecording);
    if (el.oralStop) el.oralStop.addEventListener('click', stopOralRecording);
    if (el.oralSpeech) el.oralSpeech.addEventListener('click', startOralTranscription);
    if (el.oralSpeechStop) el.oralSpeechStop.addEventListener('click', stopOralTranscription);
    if (el.oralSave) el.oralSave.addEventListener('click', saveOralProduction);
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
      'Grammaire, Compréhension écrite et orale B1-B2, ainsi que l’Expression orale B1-B2, sont disponibles hors ligne.',
      count + ' tables vérifiées · ' + batch.length + ' questions chargées.');
  } catch (error) {
    console.error('[TCF V4.0] Initialisation impossible', error);
    status('error', 'Initialisation à vérifier',
      'La base SQLite ou le pack d’exercices n’a pas pu être initialisé.',
      String(error?.message || error));
  }
}
start();
