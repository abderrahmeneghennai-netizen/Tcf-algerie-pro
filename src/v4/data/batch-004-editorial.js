/**
 * TCF ALGÉRIE PRO V4.0 — Lot pilote 100 — première livraison éditoriale.
 * 40 QCM explicitement rédigés : 20 grammaire + 20 vocabulaire.
 * Les autres compétences ne sont pas déclarées livrées tant que leurs supports
 * et leur import spécialisé ne sont pas ajoutés et contrôlés.
 */
const grammar = [
['Accord du participe passé','Les lettres que Nadia a ___ hier sont déjà envoyées.',['écrit','écrites','écrite','écrire'],'écrites','Le COD « que » reprend « les lettres » et précède le participe passé employé avec avoir.'],
['Subjonctif','Il est indispensable que vous ___ votre inscription avant vendredi.',['confirmez','confirmiez','confirmiez-vous','confirmer'],'confirmiez','« Il est indispensable que » exprime une nécessité et appelle le subjonctif.'],
['Conditionnel','Si le service était mieux organisé, les usagers ___ moins longtemps.',['attendront','attendraient','ont attendu','attendent'],'attendraient','Après si + imparfait, la conséquence hypothétique se met au conditionnel présent.'],
['Pronoms relatifs','Le rapport ___ tu fais référence sera présenté demain.',['que','dont','où','auquel'],'auquel','« Faire référence à » se construit avec à : on emploie « auquel ».'],
['Temps du passé','Lorsque le directeur est arrivé, la réunion ___.',['commence','commençait','avait déjà commencé','commencera'],'avait déjà commencé','Le plus-que-parfait marque une action antérieure à une autre action passée.'],
['Prépositions','Elle renonce ___ participer au concours cette année.',['à','de','pour','avec'],'à','Le verbe « renoncer » se construit avec la préposition « à ».'],
['Discours indirect','Il a annoncé : « Je terminerai demain. » Il a annoncé qu’il ___ le lendemain.',['terminera','terminerait','terminait','a terminé'],'terminerait','Au discours indirect au passé, le futur devient généralement le conditionnel présent.'],
['Connecteurs','Le trajet était plus long que prévu ; ___, nous sommes arrivés à l’heure.',['par conséquent','néanmoins','puisque','en effet'],'néanmoins','« Néanmoins » introduit une opposition entre la difficulté et le résultat.'],
['Négation','Personne ___ répondu à la dernière question.',['n’a','a ne','n’est','ne sont'],'n’a','La négation avec « personne » encadre l’auxiliaire : personne n’a répondu.'],
['Comparaison','Cette solution est ___ coûteuse que la précédente, sans être moins efficace.',['moins','aussi de','très','autant'],'moins','La structure comparative correcte est « moins… que ».'],
['Accord sujet-verbe','Une partie des dossiers ___ déjà classée.',['sont','ont','est','étaient'],'est','Avec « une partie de » employé comme sujet, l’accord se fait ici avec le noyau singulier « partie ».'],
['Pronoms','J’ai transmis les documents à Samir ; je ___ ai envoyés ce matin.',['les lui','lui les','leur en','y les'],'les lui','Le COD « les » précède le COI « lui » dans cette construction.'],
['Infinitif ou participe','Les visiteurs sont ___ par l’entrée principale.',['entrer','entrés','entrée','entrait'],'entrés','Après « sont » exprimant un déplacement au passé composé, on emploie le participe passé « entrés ».'],
['Expression de la cause','La sortie a été reportée ___ les conditions météorologiques.',['grâce à','à cause des','afin des','malgré les'],'à cause des','« À cause de » introduit ici une cause défavorable.'],
['Expression du but','Une permanence supplémentaire a été créée ___ faciliter les démarches.',['pour','malgré','depuis','tandis que'],'pour','« Pour » suivi de l’infinitif exprime le but.'],
['Hypothèse','À condition que chacun ___ les horaires, le projet pourra fonctionner.',['respecte','respectera','respectait','a respecté'],'respecte','« À condition que » est suivi du subjonctif présent.'],
['Voix passive','Les résultats ___ demain matin par le responsable.',['publieront','seront publiés','ont publié','publieraient'],'seront publiés','Le futur passif se forme avec « être » au futur et le participe passé accordé au sujet.'],
['Gérondif','___ régulièrement, on améliore sa compréhension orale.',['Écouter','En écoutant','Écouté','A écouté'],'En écoutant','Le gérondif se forme avec « en » suivi du participe présent.'],
['Déterminants','Il ne reste ___ place disponible dans cette salle.',['aucune','aucun','plusieurs','chaque'],'aucune','« Place » est féminin singulier : le déterminant négatif est « aucune ».'],
['Concordance','Je ne pensais pas qu’elle ___ déjà la réponse.',['connaît','connaîtra','connaissait','connaisse demain'],'connaissait','Dans ce contexte passé, l’imparfait exprime l’état simultané à « je ne pensais pas ».']
];
const vocabulary = [
['Nuance lexicale','Dans « une mesure pertinente », « pertinente » signifie :',['adaptée à la situation','particulièrement coûteuse','imposée sans débat','temporaire'],'adaptée à la situation','Une mesure pertinente répond de façon appropriée au problème posé.'],
['Collocation','On dit naturellement :',['poser une décision','prendre une décision','faire une décision','mettre une décision'],'prendre une décision','La collocation usuelle est « prendre une décision ».'],
['Sens en contexte','Le médiateur a tenté d’« apaiser » le conflit. Cela signifie qu’il a voulu :',['l’aggraver','le rendre moins tendu','le rendre public','l’ignorer'],'le rendre moins tendu','Apaiser une situation, c’est en réduire la tension.'],
['Antonyme','Quel mot est le contraire de « facultatif » ?',['optionnel','obligatoire','occasionnel','provisoire'],'obligatoire','Ce qui est obligatoire doit être fait ; ce qui est facultatif reste au choix.'],
['Synonyme','« Une amélioration progressive » est une amélioration qui se fait :',['brusquement','peu à peu','sans résultat','à rebours'],'peu à peu','« Progressif » indique une évolution par étapes.'],
['Expression','« Tenir compte d’un avis » signifie :',['le prendre en considération','le contredire systématiquement','le publier','le remplacer'],'le prendre en considération','Tenir compte d’un élément signifie l’intégrer à sa réflexion.'],
['Faux ami','En français, « éventuellement » signifie le plus souvent :',['certainement','peut-être, si les circonstances le permettent','immédiatement','rarement'],'peut-être, si les circonstances le permettent','Le mot exprime une possibilité, et non une certitude.'],
['Registre','Quel adjectif convient à un document facile à comprendre ?',['opaque','lisible','aléatoire','excessif'],'lisible','Un document lisible se lit facilement et son contenu est compréhensible.'],
['Verbe précis','Pour un formulaire, on dit :',['remplir un formulaire','construire un formulaire','ranger un formulaire','nourrir un formulaire'],'remplir un formulaire','Le verbe approprié est « remplir ».'],
['Sens figuré','Une proposition « controversée » est une proposition :',['qui suscite des désaccords','qui a été oubliée','qui est sans intérêt','qui est unanimement acceptée'],'qui suscite des désaccords','Une idée controversée fait l’objet de discussions ou de désaccords.'],
['Famille de mots','Quel nom appartient à la famille de « fiable » ?',['fiabilité','fièrement','filiation','finalité'],'fiabilité','« Fiabilité » est le nom formé à partir de l’adjectif « fiable ».'],
['Préfixe','Le préfixe « pré- » dans « prévoir » indique généralement :',['une action antérieure ou anticipée','une négation','une répétition','une opposition'],'une action antérieure ou anticipée','« Pré- » marque l’idée d’antériorité ou d’anticipation.'],
['Verbe et préposition','Complétez : « Cette décision dépend ___ budget disponible. »',['du','au','sur le','avec le'],'du','On dit « dépendre de » ; devant « le budget », cela devient « du budget ».'],
['Nom abstrait','La « cohérence » d’un argument désigne :',['la logique entre ses différentes idées','sa longueur','son caractère humoristique','son ancienneté'],'la logique entre ses différentes idées','Un raisonnement cohérent présente des idées liées de manière logique.'],
['Sens en contexte','Le projet a été « suspendu » jusqu’à nouvel ordre. Il a été :',['définitivement annulé','mis temporairement à l’arrêt','accéléré','publié'],'mis temporairement à l’arrêt','Suspendre une activité signifie l’interrompre provisoirement.'],
['Antonyme','L’antonyme de « développer » dans le sens d’agrandir est :',['étendre','réduire','renforcer','approfondir'],'réduire','Réduire signifie diminuer l’ampleur ou la taille.'],
['Expression idiomatique','« Mettre en évidence un problème » signifie :',['le rendre visible ou le souligner','le dissimuler','le résoudre automatiquement','le reporter'],'le rendre visible ou le souligner','Mettre en évidence, c’est attirer l’attention sur un élément.'],
['Adjectif précis','Un délai « raisonnable » est un délai :',['excessivement long','acceptable compte tenu de la situation','impossible à respecter','sans limite'],'acceptable compte tenu de la situation','« Raisonnable » signifie ici proportionné et acceptable.'],
['Registre administratif','Dans un courrier formel, quelle formule convient pour demander un document ?',['File-moi le papier.','Je vous prie de bien vouloir me transmettre le document.','Envoie ça vite.','Tu peux me passer le truc ?'],'Je vous prie de bien vouloir me transmettre le document.','La formule utilise le vouvoiement et une demande polie adaptée au registre formel.'],
['Sens en contexte','Une fréquentation « en hausse » indique que le nombre de visiteurs :',['diminue','augmente','reste identique','devient inconnu'],'augmente','Une hausse correspond à une augmentation.']
];
const make = (rows, prefix, chapter, offset) => rows.map((r,i)=>({
 id:`v4-l004-${prefix}-${String(i+1).padStart(3,'0')}`,
 module:'GRAM', level:'B1', chapter, difficulty: i%3===0?3:2,
 prompt:r[0]+ ' — '+r[1], options:r[2], answer:r[3], explanation:r[4],
 shuffleKey:offset+i+1
}));
export const BATCH_004_EDITORIAL = {
 code:'pack_v4_lot_004_editorial',
 name:'Lot pilote 100 — première livraison éditoriale',
 description:'Première livraison contrôlée : 20 exercices de grammaire et 20 de vocabulaire, rédigés individuellement.',
 exercises:[...make(grammar,'gram','Grammaire — B1/B2',400000),...make(vocabulary,'vocab','Vocabulaire — B1/B2',400100)]
};
