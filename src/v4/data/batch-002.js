/**
 * TCF ALGÉRIE PRO V4 — LOT 002
 * 500 questions originales de compréhension écrite B1-B2.
 * 50 supports pratiques distincts × 10 questions de repérage/interprétation.
 * Les questions sont générées à partir des informations explicites de chaque support.
 */
const pools = {
  activities: ['atelier de photographie','cours de cuisine','sortie botanique','club de lecture','atelier de réparation','visite guidée','séance de conversation','initiation au théâtre','formation numérique','rencontre littéraire','atelier de jardinage'],
  places: ['la maison de la culture','la médiathèque centrale','le centre de quartier','la salle polyvalente','le musée municipal','la maison des associations','le parc des expositions','le centre de formation','la galerie municipale'],
  dates: ['mardi 3 décembre','jeudi 5 décembre','samedi 7 décembre','lundi 9 décembre','mercredi 11 décembre','vendredi 13 décembre','dimanche 15 décembre','mardi 17 décembre','jeudi 19 décembre','samedi 21 décembre','lundi 23 décembre','mercredi 25 décembre','vendredi 27 décembre'],
  times: ['8 h 30','9 h','9 h 45','10 h 15','11 h','13 h 30','14 h','15 h 15','16 h','17 h 30','18 h'],
  durations: ['45 minutes','1 heure','1 h 30','2 heures','2 h 30','3 heures'],
  fees: ['gratuit','300 DA','500 DA','700 DA','900 DA','1 000 DA','1 200 DA','1 500 DA'],
  audiences: ['les adolescents à partir de 14 ans','les adultes débutants','les familles avec enfants','les étudiants','les personnes de plus de 60 ans','tous les habitants','les enseignants','les jeunes de 18 à 25 ans','les enfants de 8 à 12 ans'],
  deadlines: ['la veille avant 16 h','deux jours avant la séance','le vendredi précédent','jusqu’au 1er décembre','trois jours avant l’activité','le matin même, dans la limite des places','une semaine à l’avance','jusqu’à 18 h la veille','avant le début du mois'],
  equipment: ['un cahier et un stylo','une pièce d’identité','des chaussures confortables','un ordinateur portable','une bouteille d’eau','le matériel est fourni sur place','un tablier de protection','un livre de votre choix','des écouteurs personnels','aucun matériel particulier'],
  contacts: ['le secrétariat au 021 44 18 20','l’accueil au 0550 12 34 56','Mme Nadia par courriel','le service culturel au 023 61 09 14','le responsable des inscriptions','la page officielle du centre','M. Karim à l’accueil','le bureau des activités','le standard au 029 73 22 10']
};

const fields = [
  {key:'activity', labels:['Quelle activité est proposée ?','De quelle activité parle cette annonce ?','Qu’est-ce que le centre propose aux participants ?','Quelle est l’activité annoncée ?','Quel atelier ou événement est organisé ?'], get:r=>r.activity, why:'Le premier paragraphe annonce explicitement l’activité.'},
  {key:'place', labels:['Où l’activité se déroule-t-elle ?','Quel est le lieu de rendez-vous ?','Dans quel établissement aura lieu la rencontre ?','Où les participants doivent-ils se rendre ?','Quel lieu est indiqué dans l’annonce ?'], get:r=>r.place, why:'Le lieu est indiqué dans les informations pratiques.'},
  {key:'date', labels:['À quelle date l’activité est-elle organisée ?','Quel jour la rencontre est-elle prévue ?','Quand l’activité aura-t-elle lieu ?','Quelle date faut-il retenir ?','À quel moment du mois l’événement est-il programmé ?'], get:r=>r.date, why:'La date figure dans l’annonce.'},
  {key:'time', labels:['À quelle heure l’activité commence-t-elle ?','À quelle heure les participants sont-ils attendus ?','Quel est l’horaire de début ?','Quand la séance débute-t-elle dans la journée ?','Quelle heure est annoncée pour le début ?'], get:r=>r.time, why:'L’heure de début est précisée dans le programme.'},
  {key:'duration', labels:['Combien de temps dure l’activité ?','Quelle est la durée prévue de la séance ?','Pendant combien de temps les participants seront-ils occupés ?','La rencontre dure combien de temps ?','Quelle durée est annoncée ?'], get:r=>r.duration, why:'La durée est donnée dans les détails de l’activité.'},
  {key:'fee', labels:['Quel est le tarif de participation ?','Combien coûte l’inscription ?','Quel montant faut-il prévoir ?','La participation est-elle gratuite ou payante, et à quel prix ?','Quel prix est demandé aux participants ?'], get:r=>r.fee, why:'Le tarif est indiqué dans les conditions d’inscription.'},
  {key:'audience', labels:['À quel public cette activité s’adresse-t-elle ?','Qui peut participer à cette activité ?','Quel groupe de personnes est concerné ?','Pour quelles personnes cette rencontre est-elle prévue ?','Quel est le public visé par l’annonce ?'], get:r=>r.audience, why:'Le public concerné est précisé dans l’annonce.'},
  {key:'deadline', labels:['Quand faut-il s’inscrire au plus tard ?','Quelle est la date limite d’inscription ?','Jusqu’à quand les inscriptions restent-elles possibles ?','À quel moment faut-il avoir effectué son inscription ?','Quel délai les participants doivent-ils respecter ?'], get:r=>r.deadline, why:'La date limite d’inscription est mentionnée dans le texte.'},
  {key:'equipment', labels:['Que faut-il apporter ?','Quel matériel est demandé aux participants ?','Quel objet faut-il prévoir pour la séance ?','Les participants doivent-ils venir avec un équipement particulier ?','Quelle consigne concerne le matériel ?'], get:r=>r.equipment, why:'Le matériel nécessaire est indiqué dans les consignes.'},
  {key:'contact', labels:['Qui faut-il contacter pour obtenir des renseignements ?','À qui peut-on s’adresser en cas de question ?','Quel contact est indiqué dans l’annonce ?','Comment joindre le service responsable ?','Quel interlocuteur peut fournir des précisions ?'], get:r=>r.contact, why:'Le dernier paragraphe donne le contact utile.'}
];

const records = Array.from({length:50}, (_,i) => ({
  code:'ce-l002-support-'+String(i+1).padStart(3,'0'),
  activity:pools.activities[(i*3+1)%pools.activities.length],
  place:pools.places[(i*5+2)%pools.places.length],
  date:pools.dates[(i*7+3)%pools.dates.length],
  time:pools.times[(i*4+1)%pools.times.length],
  duration:pools.durations[(i*5+2)%pools.durations.length],
  fee:pools.fees[(i*3+1)%pools.fees.length],
  audience:pools.audiences[(i*7+2)%pools.audiences.length],
  deadline:pools.deadlines[(i*4+3)%pools.deadlines.length],
  equipment:pools.equipment[(i*3+2)%pools.equipment.length],
  contact:pools.contacts[(i*5+1)%pools.contacts.length]
}));

function makeText(r) {
  return 'Le programme propose l’activité suivante : '+r.activity+'. Cette activité est ouverte au public suivant : '+r.audience+'. '
    +'La rencontre aura lieu le '+r.date+' à '+r.time+', à '+r.place+'. '
    +'La séance durera '+r.duration+' et le tarif est fixé à '+r.fee+'. '
    +'Les participants doivent prévoir : '+r.equipment+'. '
    +'Pour participer, il est nécessaire de s’inscrire au plus tard '+r.deadline+'. '
    +'Pour toute question concernant le déroulement ou les places disponibles, veuillez contacter '+r.contact+'. '
    +'Les inscriptions sont enregistrées dans la limite des places disponibles. En cas de changement, les personnes inscrites seront informées directement.';
}

function makeOptions(fieldIndex, recordIndex, answer) {
  const candidates = [];
  for (let step=1; step<records.length && candidates.length<3; step++) {
    const value=fields[fieldIndex].get(records[(recordIndex+step*7)%records.length]);
    if (value!==answer && !candidates.includes(value)) candidates.push(value);
  }
  const options=[answer,...candidates.slice(0,3)];
  // Mélange déterministe pour éviter que la bonne réponse soit toujours en première position.
  const shift=(recordIndex+fieldIndex*3)%4;
  return options.map((_,j)=>options[(j+shift)%options.length]);
}

export const BATCH_002 = {
  code:'pack_v4_lot_002',
  name:'Lot 002 — Compréhension écrite B1-B2 (500 exercices)',
  description:'500 QCM originaux fondés sur 50 annonces et supports pratiques distincts.',
  supports:records.map(r=>({code:r.code,title:'Annonce pratique — '+r.activity,text:makeText(r)})),
  exercises:records.flatMap((r,ri)=>fields.map((field,fi)=>({
    id:'ce-l002-'+String(ri+1).padStart(3,'0')+'-'+String(fi+1).padStart(2,'0'),
    module:'CE',
    support:r.code,
    chapter:['Identifier le thème','Repérer un lieu','Repérer une date','Comprendre un horaire','Repérer une durée','Comprendre un tarif','Identifier le public','Repérer une condition','Comprendre une consigne','Identifier un interlocuteur'][fi],
    level:ri%4===0?'B2':'B1',
    difficulty:ri%4===0?4:2,
    prompt:field.labels[ri%field.labels.length],
    options:makeOptions(fi,ri,field.get(r)),
    answer:field.get(r),
    explanation:field.why+' La réponse attendue est : '+field.get(r)+'.'
  })))
};
