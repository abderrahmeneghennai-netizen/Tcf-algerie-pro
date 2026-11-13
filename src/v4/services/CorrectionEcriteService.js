/**
 * TCF ALGÉRIE PRO V4.0 — Assistant de correction écrite local.
 *
 * Analyse pédagogique indicative, exécutée entièrement sur l'appareil.
 * Aucun texte n'est transmis à Internet.
 * L'interface IA accepte un fournisseur injecté ultérieurement, mais aucun
 * fournisseur distant n'est activé tant qu'une passerelle sécurisée n'existe pas.
 */
const SPELLING_RULES = [
  [/\bsa va\b/giu, 'ça va', 'Confusion fréquente : « ça va ».'],
  [/\bcomme même\b/giu, 'quand même', 'On écrit « quand même ».'],
  [/\bmalgrés\b/giu, 'malgré', '« Malgré » est invariable.'],
  [/\bparmis\b/giu, 'parmi', 'On écrit « parmi », sans s final.'],
  [/\bbeaucoups\b/giu, 'beaucoup', '« Beaucoup » ne prend pas de s.'],
  [/\binterressant\b/giu, 'intéressant', 'Orthographe : « intéressant ».'],
  [/\bdévelopement\b/giu, 'développement', 'Orthographe : « développement ».'],
  [/\benvironement\b/giu, 'environnement', 'Orthographe : « environnement ».'],
  [/\bapparament\b/giu, 'apparemment', 'Orthographe : « apparemment ».'],
  [/\bacceuillir\b/giu, 'accueillir', 'Orthographe : « accueillir ».'],
  [/\blanguage\b/giu, 'langage', 'En français, on écrit « langage ».'],
  [/\bils ont était\b/giu, 'ils ont été', 'Avec l’auxiliaire avoir, le participe passé est « été ».'],
  [/\bj'ai était\b/giu, "j'ai été", 'La forme correcte est « j’ai été ».'],
  [/\b(il est aller)\b/giu, 'il est allé', 'Avec « être », le participe passé s’accorde avec le sujet.'],
  [/\b(elle est aller)\b/giu, 'elle est allée', 'Avec « être », le participe passé s’accorde avec le sujet.']
];

const CONNECTORS = [
  'tout d’abord', 'premièrement', 'ensuite', 'de plus', 'en outre',
  'cependant', 'pourtant', 'néanmoins', 'en revanche', 'par conséquent',
  'ainsi', 'en effet', 'par exemple', 'en conclusion', 'pour conclure',
  'finalement', 'd’une part', 'd’autre part'
];

function wordCount(value) {
  const matches = String(value ?? '').match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return matches ? matches.length : 0;
}

function preserveInitialCase(source, replacement) {
  if (source && source === source.toLocaleUpperCase('fr')) return replacement.toLocaleUpperCase('fr');
  if (source && source[0] === source[0].toLocaleUpperCase('fr')) {
    return replacement.charAt(0).toLocaleUpperCase('fr') + replacement.slice(1);
  }
  return replacement;
}

function applySpellingRules(input, findings) {
  let output = input;
  for (const [pattern, replacement, explanation] of SPELLING_RULES) {
    output = output.replace(pattern, (match) => {
      findings.push({ original: match, replacement: preserveInitialCase(match, replacement), explanation, type: 'Orthographe / usage' });
      return preserveInitialCase(match, replacement);
    });
  }
  return output;
}

function cleanPunctuation(input, findings) {
  let output = input.replace(/ {2,}/g, ' ');
  output = output.replace(/\s+([,;.!?])/g, '$1');
  output = output.replace(/([,;:!?])(?=\S)/g, '$1 ');
  output = output.replace(/([.!?])([A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1 $2');
  const before = input.trim();
  if (output.trim() !== before && !findings.some((item) => item.type === 'Ponctuation')) {
    findings.push({
      original: 'Espaces ou ponctuation',
      replacement: 'Ponctuation et espaces régularisés dans la proposition.',
      explanation: 'En français, on évite les espaces avant la virgule et le point. Une espace suit généralement la ponctuation.',
      type: 'Ponctuation'
    });
  }
  return output;
}

function evaluate(text, subject) {
  const words = wordCount(text);
  const sentences = text.split(/[.!?]+/u).map((part) => part.trim()).filter(Boolean);
  const paragraphs = text.split(/\n\s*\n/u).map((part) => part.trim()).filter(Boolean);
  const normalizedWords = (text.toLocaleLowerCase('fr').match(/[\p{L}]+/gu) || []);
  const uniqueRatio = normalizedWords.length ? new Set(normalizedWords).size / normalizedWords.length : 0;
  const connectorCount = CONNECTORS.filter((connector) => text.toLocaleLowerCase('fr').includes(connector)).length;

  const rangeMatch = String(subject?.nb_mots_attendu || '').match(/(\d+)\s*-\s*(\d+)/u);
  let lengthLabel = 'Longueur à vérifier';
  let lengthDetail = words + ' mots rédigés.';
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (words < min * 0.75) {
      lengthLabel = 'À développer';
      lengthDetail = words + ' mots : le texte est nettement plus court que le repère de ' + min + ' à ' + max + ' mots.';
    } else if (words > max * 1.25) {
      lengthLabel = 'À raccourcir';
      lengthDetail = words + ' mots : le texte dépasse nettement le repère de ' + min + ' à ' + max + ' mots.';
    } else if (words >= min && words <= max) {
      lengthLabel = 'Repère atteint';
      lengthDetail = words + ' mots : le texte se situe dans le repère indicatif de ' + min + ' à ' + max + ' mots.';
    } else {
      lengthLabel = 'Proche du repère';
      lengthDetail = words + ' mots : vérifiez la longueur indicative de ' + min + ' à ' + max + ' mots.';
    }
  }

  const structureLabel = paragraphs >= 2 ? 'Organisation visible' : (sentences.length >= 4 ? 'À structurer' : 'À développer');
  const structureDetail = paragraphs >= 2
    ? paragraphs + ' paragraphes repérés.'
    : 'Séparez l’introduction, les idées principales et la conclusion en paragraphes.';

  const connectorLabel = connectorCount >= 2 ? 'Connecteurs présents' : 'À enrichir';
  const connectorDetail = connectorCount >= 2
    ? connectorCount + ' connecteur(s) de la liste pédagogique repéré(s).'
    : 'Ajoutez des liens logiques adaptés : « tout d’abord », « cependant », « de plus », « par conséquent ».';

  const vocabularyLabel = uniqueRatio >= 0.55 ? 'Variété encourageante' : 'À diversifier';
  const vocabularyDetail = normalizedWords.length
    ? 'Indice de diversité lexicale approximatif : ' + Math.round(uniqueRatio * 100) + ' %.'
    : 'Rédigez quelques phrases pour permettre cette observation.';

  return [
    { title: 'Longueur', label: lengthLabel, detail: lengthDetail },
    { title: 'Organisation', label: structureLabel, detail: structureDetail },
    { title: 'Connecteurs', label: connectorLabel, detail: connectorDetail },
    { title: 'Vocabulaire', label: vocabularyLabel, detail: vocabularyDetail }
  ];
}

function buildSuggestions(text, evaluation) {
  const suggestions = [];
  if (evaluation[0].label === 'À développer') suggestions.push('Développez chaque idée avec une explication ou un exemple concret.');
  if (evaluation[0].label === 'À raccourcir') suggestions.push('Supprimez les répétitions et gardez les informations directement liées à la consigne.');
  if (evaluation[1].label !== 'Organisation visible') suggestions.push('Organisez le texte en paragraphes : introduction, développement et conclusion.');
  if (evaluation[2].label === 'À enrichir') suggestions.push('Variez les connecteurs logiques pour rendre les relations entre les idées plus claires.');
  if (evaluation[3].label === 'À diversifier') suggestions.push('Évitez de répéter les mêmes mots ; cherchez des synonymes précis et adaptés au contexte.');
  if (!/[.!?]\s*$/u.test(text.trim())) suggestions.push('Terminez la dernière phrase par une ponctuation adaptée.');
  suggestions.push('Relisez la consigne et vérifiez que chaque partie de votre réponse y répond.');
  return suggestions;
}

export class CorrectionEcriteService {
  constructor(aiProvider = null) {
    this.aiProvider = aiProvider;
  }

  analyzeLocally({ text, subject = null } = {}) {
    const original = String(text ?? '').trim();
    if (wordCount(original) < 5) {
      throw new Error('Rédigez au moins cinq mots avant de lancer l’analyse.');
    }

    const findings = [];
    let corrected = applySpellingRules(original, findings);
    corrected = cleanPunctuation(corrected, findings);
    corrected = corrected.replace(/\b([\p{L}]{2,})\s+\1\b/giu, (match, repeated) => {
      findings.push({
        original: match,
        replacement: repeated,
        explanation: 'Un mot semble répété deux fois de suite.',
        type: 'Répétition'
      });
      return repeated;
    });
    corrected = corrected.replace(/(^|[.!?]\s+)([a-zà-öø-ÿ])/gu, (match, prefix, letter) => prefix + letter.toLocaleUpperCase('fr'));

    const evaluation = evaluate(original, subject);
    const suggestions = buildSuggestions(original, evaluation);
    return {
      original,
      corrected,
      wordCount: wordCount(original),
      findings,
      evaluation,
      suggestions,
      notice: 'Analyse locale indicative : elle repère certaines erreurs fréquentes, mais ne remplace pas une correction humaine ni une évaluation officielle du TCF.'
    };
  }

  async correctWithAI({ text, subject = null, level = 'B1' } = {}) {
    if (!this.aiProvider || typeof this.aiProvider.correct !== 'function') {
      return {
        available: false,
        reason: 'La correction IA avancée n’est pas activée. Aucun texte n’est envoyé à un service externe.'
      };
    }
    return this.aiProvider.correct({ text: String(text ?? ''), subject, level });
  }
}
