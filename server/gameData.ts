import type {
  Difficulty,
  GameCatalogItem,
  QuizCategory,
  QuizQuestionAdmin,
} from '../src/types/playroom.ts';

export const GAME_CATALOG: GameCatalogItem[] = [
  {
    slug: 'quiz-battle',
    titleEn: 'Quiz Battle',
    titleFr: 'Quiz Battle',
    descriptionEn: 'Fast-paced competitive trivia across 7 curated knowledge domains with speed bonuses.',
    descriptionFr: 'Quiz compétitif rapide couvrant 7 domaines de connaissances avec bonus de rapidité.',
    category: 'Trivia · Solo & Multiplayer',
    supportsMultiplayer: true,
    isPlusOnly: false,
    baseXp: 60,
    imageUrl: '/src/assets/images/game_quiz_battle_1795256668251.jpg',
  },
  {
    slug: 'word-challenge',
    titleEn: 'Word Challenge',
    titleFr: 'Défi des Mots',
    descriptionEn: 'Decode hidden vocabulary words using letter position feedback, hints, and daily challenges.',
    descriptionFr: 'Déchiffrez des mots cachés grâce aux indices de lettres, astuces et défis quotidiens.',
    category: 'Vocabulary · Solo & Multiplayer',
    supportsMultiplayer: true,
    isPlusOnly: false,
    baseXp: 55,
    imageUrl: '/src/assets/images/game_word_challenge_1795256666968.jpg',
  },
  {
    slug: 'brain-test',
    titleEn: 'Brain Test',
    titleFr: 'Test Cérébral',
    descriptionEn: 'Master number sequences, spatial patterns, mathematical reasoning, and memory drills.',
    descriptionFr: 'Maîtrisez suites logiques, reconnaissance de motifs, calcul et mémoire visuelle.',
    category: 'Logic · Solo & Multiplayer',
    supportsMultiplayer: true,
    isPlusOnly: false,
    baseXp: 65,
    imageUrl: '/src/assets/images/game_brain_test_1795256666907.jpg',
  },
  {
    slug: 'mystery-room',
    titleEn: 'Mystery Room',
    titleFr: 'Chambre Mystère',
    descriptionEn: 'Examine evidence dossiers, spot contradictions in alibis, and identify the culprit.',
    descriptionFr: 'Analysez les dossiers d\'enquête, repérez les contradictions et démasquez le coupable.',
    category: 'Deduction · Story Cases',
    supportsMultiplayer: false,
    isPlusOnly: false,
    baseXp: 85,
    imageUrl: '/src/assets/images/game_mystery_room_1795256667037.jpg',
  },
];

export const INITIAL_QUIZ_QUESTIONS: QuizQuestionAdmin[] = [
  // GENERAL
  {
    id: 'qb-gen-1',
    category: 'general',
    difficulty: 'easy',
    promptEn: 'Which instrument is used to measure atmospheric pressure?',
    promptFr: 'Quel instrument permet de mesurer la pression atmosphérique ?',
    optionsEn: ['Barometer', 'Hygrometer', 'Anemometer', 'Altimeter'],
    optionsFr: ['Baromètre', 'Hygromètre', 'Anémomètre', 'Altimètre'],
    correctOptionIndex: 0,
    explanationEn: 'A barometer measures atmospheric pressure, while an anemometer measures wind speed.',
    explanationFr: 'Le baromètre mesure la pression atmosphérique, tandis que l\'anémomètre mesure la vitesse du vent.',
    isActive: true,
  },
  {
    id: 'qb-gen-2',
    category: 'general',
    difficulty: 'medium',
    promptEn: 'What is the chemical symbol for gold on the periodic table?',
    promptFr: 'Quel est le symbole chimique de l\'or dans le tableau périodique ?',
    optionsEn: ['Ag', 'Au', 'Gd', 'Or'],
    optionsFr: ['Ag', 'Au', 'Gd', 'Or'],
    correctOptionIndex: 1,
    explanationEn: 'Au derives from the Latin word for gold, aurum.',
    explanationFr: 'Au provient du mot latin désignant l\'or, aurum.',
    isActive: true,
  },
  {
    id: 'qb-gen-3',
    category: 'general',
    difficulty: 'hard',
    promptEn: 'Which language has the largest number of native speakers worldwide?',
    promptFr: 'Quelle langue compte le plus grand nombre de locuteurs natifs dans le monde ?',
    optionsEn: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'],
    optionsFr: ['Anglais', 'Espagnol', 'Chinois mandarin', 'Hindi'],
    correctOptionIndex: 2,
    explanationEn: 'Mandarin Chinese has over 900 million native speakers.',
    explanationFr: 'Le chinois mandarin compte plus de 900 millions de locuteurs natifs.',
    isActive: true,
  },
  {
    id: 'qb-gen-4',
    category: 'general',
    difficulty: 'easy',
    promptEn: 'How many minutes are there in three and a half hours?',
    promptFr: 'Combien de minutes y a-t-il dans trois heures et demie ?',
    optionsEn: ['180', '195', '210', '225'],
    optionsFr: ['180', '195', '210', '225'],
    correctOptionIndex: 2,
    explanationEn: '3 × 60 + 30 = 210 minutes.',
    explanationFr: '3 × 60 + 30 = 210 minutes.',
    isActive: true,
  },

  // SCIENCE
  {
    id: 'qb-sci-1',
    category: 'science',
    difficulty: 'easy',
    promptEn: 'Which planet in our solar system has the highest surface temperature?',
    promptFr: 'Quelle planète de notre système solaire possède la température de surface la plus élevée ?',
    optionsEn: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
    optionsFr: ['Mercure', 'Vénus', 'Mars', 'Jupiter'],
    correctOptionIndex: 1,
    explanationEn: 'Venus traps heat under a dense CO2 atmosphere, making it hotter than Mercury.',
    explanationFr: 'L\'atmosphère dense en CO2 de Vénus crée un effet de serre extrême.',
    isActive: true,
  },
  {
    id: 'qb-sci-2',
    category: 'science',
    difficulty: 'medium',
    promptEn: 'Which organelle generates most of the ATP energy in eukaryotic cells?',
    promptFr: 'Quel organite produit l\'essentiel de l\'énergie ATP dans les cellules eucaryotes ?',
    optionsEn: ['Ribosome', 'Golgi apparatus', 'Mitochondrion', 'Lysosome'],
    optionsFr: ['Ribosome', 'Appareil de Golgi', 'Mitochondrie', 'Lysosome'],
    correctOptionIndex: 2,
    explanationEn: 'Mitochondria synthesize ATP via oxidative phosphorylation.',
    explanationFr: 'Les mitochondries synthétisent l\'ATP par phosphorylation oxydative.',
    isActive: true,
  },
  {
    id: 'qb-sci-3',
    category: 'science',
    difficulty: 'hard',
    promptEn: 'Approximately how long does light from the Sun take to reach Earth?',
    promptFr: 'Combien de temps environ la lumière du Soleil met-elle pour atteindre la Terre ?',
    optionsEn: ['1 minute 20 seconds', '8 minutes 20 seconds', '24 minutes', '1 hour 10 minutes'],
    optionsFr: ['1 minute 20 secondes', '8 minutes 20 secondes', '24 minutes', '1 heure 10 minutes'],
    correctOptionIndex: 1,
    explanationEn: 'Light travels ~150 million km at ~300,000 km/s, taking ~499 seconds (8m 20s).',
    explanationFr: 'La lumière parcourt ~150 millions de km à ~300 000 km/s, soit environ 8 minutes 20 secondes.',
    isActive: true,
  },
  {
    id: 'qb-sci-4',
    category: 'science',
    difficulty: 'medium',
    promptEn: 'What gas makes up roughly 78% of Earth\'s dry atmosphere?',
    promptFr: 'Quel gaz compose environ 78 % de l\'atmosphère sèche de la Terre ?',
    optionsEn: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'],
    optionsFr: ['Oxygène', 'Dioxyde de carbone', 'Azote', 'Argon'],
    correctOptionIndex: 2,
    explanationEn: 'Earth\'s atmosphere is ~78% nitrogen, ~21% oxygen, and ~1% trace gases.',
    explanationFr: 'L\'atmosphère terrestre est composée d\'environ 78 % d\'azote et 21 % d\'oxygène.',
    isActive: true,
  },

  // TECHNOLOGY
  {
    id: 'qb-tech-1',
    category: 'technology',
    difficulty: 'easy',
    promptEn: 'What does HTTP stand for on the web?',
    promptFr: 'Que signifie l\'acronyme HTTP sur le web ?',
    optionsEn: [
      'HyperText Transfer Protocol',
      'High Transmission Text Process',
      'Hybrid Terminal Transport Path',
      'Host Transfer Tracking Protocol',
    ],
    optionsFr: [
      'HyperText Transfer Protocol',
      'High Transmission Text Process',
      'Hybrid Terminal Transport Path',
      'Host Transfer Tracking Protocol',
    ],
    correctOptionIndex: 0,
    explanationEn: 'HTTP stands for HyperText Transfer Protocol, the foundation of web communication.',
    explanationFr: 'HTTP signifie HyperText Transfer Protocol, le protocole fondamental du web.',
    isActive: true,
  },
  {
    id: 'qb-tech-2',
    category: 'technology',
    difficulty: 'medium',
    promptEn: 'In relational databases, what does ACID guarantee?',
    promptFr: 'Dans les bases de données relationnelles, que garantit le principe ACID ?',
    optionsEn: [
      'Automatic Compression & Indexing',
      'Atomicity, Consistency, Isolation, Durability',
      'Asynchronous Caching in Distributed clusters',
      'Authenticated Client Identity Delivery',
    ],
    optionsFr: [
      'Compression et indexation automatiques',
      'Atomicité, Cohérence, Isolation, Durabilité',
      'Mise en cache asynchrone distribuée',
      'Validation d\'identité client authentifiée',
    ],
    correctOptionIndex: 1,
    explanationEn: 'ACID properties guarantee reliable database transactions.',
    explanationFr: 'Les propriétés ACID garantissent la fiabilité des transactions SQL.',
    isActive: true,
  },
  {
    id: 'qb-tech-3',
    category: 'technology',
    difficulty: 'hard',
    promptEn: 'Which algorithm complexity describes binary search on a sorted array of N items?',
    promptFr: 'Quelle complexité décrit une recherche binaire dans un tableau trié de N éléments ?',
    optionsEn: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    optionsFr: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correctOptionIndex: 1,
    explanationEn: 'Binary search halves the search interval at every step, yielding O(log N) time.',
    explanationFr: 'La recherche binaire divise l\'intervalle par deux à chaque étape : O(log N).',
    isActive: true,
  },
  {
    id: 'qb-tech-4',
    category: 'technology',
    difficulty: 'easy',
    promptEn: 'How many bits make up one byte?',
    promptFr: 'Combien de bits composent un octet ?',
    optionsEn: ['4', '8', '16', '32'],
    optionsFr: ['4', '8', '16', '32'],
    correctOptionIndex: 1,
    explanationEn: 'One standard byte consists of 8 bits.',
    explanationFr: 'Un octet standard est composé de 8 bits.',
    isActive: true,
  },

  // GEOGRAPHY
  {
    id: 'qb-geo-1',
    category: 'geography',
    difficulty: 'easy',
    promptEn: 'Which ocean is the largest and deepest on Earth?',
    promptFr: 'Quel océan est le plus grand et le plus profond de la Terre ?',
    optionsEn: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
    optionsFr: ['Océan Atlantique', 'Océan Indien', 'Océan Pacifique', 'Océan Arctique'],
    correctOptionIndex: 2,
    explanationEn: 'The Pacific Ocean covers roughly 30% of Earth\'s surface.',
    explanationFr: 'L\'océan Pacifique couvre environ 30 % de la surface terrestre.',
    isActive: true,
  },
  {
    id: 'qb-geo-2',
    category: 'geography',
    difficulty: 'medium',
    promptEn: 'Which city is the administrative capital of Côte d\'Ivoire?',
    promptFr: 'Quelle ville est la capitale politique et administrative de la Côte d\'Ivoire ?',
    optionsEn: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro'],
    optionsFr: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro'],
    correctOptionIndex: 1,
    explanationEn: 'Yamoussoukro became the official capital in 1983, while Abidjan remains the economic hub.',
    explanationFr: 'Yamoussoukro est la capitale officielle depuis 1983, tandis qu\'Abidjan est le centre économique.',
    isActive: true,
  },
  {
    id: 'qb-geo-3',
    category: 'geography',
    difficulty: 'hard',
    promptEn: 'Which country spans the most time zones when including overseas territories?',
    promptFr: 'Quel pays couvre le plus grand nombre de fuseaux horaires en incluant ses territoires d\'outre-mer ?',
    optionsEn: ['Russia', 'United States', 'France', 'Canada'],
    optionsFr: ['Russie', 'États-Unis', 'France', 'Canada'],
    correctOptionIndex: 2,
    explanationEn: 'France spans 12 time zones across metropolitan France and its overseas territories.',
    explanationFr: 'La France couvre 12 fuseaux horaires grâce à ses territoires d\'outre-mer.',
    isActive: true,
  },
  {
    id: 'qb-geo-4',
    category: 'geography',
    difficulty: 'medium',
    promptEn: 'Through which continent does the longest mountain range above sea level, the Andes, run?',
    promptFr: 'À travers quel continent s\'étend la cordillère des Andes, plus longue chaîne de montagnes émergée ?',
    optionsEn: ['Asia', 'North America', 'South America', 'Africa'],
    optionsFr: ['Asie', 'Amérique du Nord', 'Amérique du Sud', 'Afrique'],
    correctOptionIndex: 2,
    explanationEn: 'The Andes run ~7,000 km along the western coast of South America.',
    explanationFr: 'Les Andes s\'étendent sur environ 7 000 km le long de la côte ouest de l\'Amérique du Sud.',
    isActive: true,
  },

  // HISTORY
  {
    id: 'qb-his-1',
    category: 'history',
    difficulty: 'easy',
    promptEn: 'In which year did the Apollo 11 mission first land humans on the Moon?',
    promptFr: 'En quelle année la mission Apollo 11 a-t-elle posé les premiers humains sur la Lune ?',
    optionsEn: ['1965', '1969', '1972', '1975'],
    optionsFr: ['1965', '1969', '1972', '1975'],
    correctOptionIndex: 1,
    explanationEn: 'Apollo 11 landed on the Moon on July 20, 1969.',
    explanationFr: 'Apollo 11 s\'est posé sur la Lune le 20 juillet 1969.',
    isActive: true,
  },
  {
    id: 'qb-his-2',
    category: 'history',
    difficulty: 'medium',
    promptEn: 'Which West African city was renowned in the 14th–16th centuries for the Sankore University and manuscripts?',
    promptFr: 'Quelle cité d\'Afrique de l\'Ouest était célèbre aux XIVe–XVIe siècles pour l\'université de Sankoré et ses manuscrits ?',
    optionsEn: ['Timbuktu', 'Kumasi', 'Lagos', 'Dakar'],
    optionsFr: ['Tombouctou', 'Kumasi', 'Lagos', 'Dakar'],
    correctOptionIndex: 0,
    explanationEn: 'Timbuktu was a premier center of Islamic scholarship and trade in the Mali and Songhai empires.',
    explanationFr: 'Tombouctou fut un centre majeur du savoir et du commerce dans les empires du Mali et Songhaï.',
    isActive: true,
  },
  {
    id: 'qb-his-3',
    category: 'history',
    difficulty: 'hard',
    promptEn: 'Who invented the movable-type printing press in Europe around 1440?',
    promptFr: 'Qui a mis au point l\'imprimerie à caractères mobiles en Europe vers 1440 ?',
    optionsEn: ['Johannes Gutenberg', 'Galileo Galilei', 'Blaise Pascal', 'Leonhard Euler'],
    optionsFr: ['Johannes Gutenberg', 'Galilée', 'Blaise Pascal', 'Leonhard Euler'],
    correctOptionIndex: 0,
    explanationEn: 'Johannes Gutenberg introduced mechanized movable-type printing in Mainz.',
    explanationFr: 'Johannes Gutenberg a développé l\'imprimerie à caractères mobiles à Mayence.',
    isActive: true,
  },
  {
    id: 'qb-his-4',
    category: 'history',
    difficulty: 'medium',
    promptEn: 'Which ancient civilization built Machu Picchu in the 15th century?',
    promptFr: 'Quelle civilisation ancienne a bâti Machu Picchu au XVe siècle ?',
    optionsEn: ['Maya', 'Aztec', 'Inca', 'Olmec'],
    optionsFr: ['Maya', 'Aztèque', 'Inca', 'Olmèque'],
    correctOptionIndex: 2,
    explanationEn: 'Machu Picchu was built by the Inca Empire under Emperor Pachacuti.',
    explanationFr: 'Machu Picchu fut construit par l\'Empire inca sous le règne de Pachacutec.',
    isActive: true,
  },

  // ENTERTAINMENT
  {
    id: 'qb-ent-1',
    category: 'entertainment',
    difficulty: 'easy',
    promptEn: 'How many standard squares are on a classic chess board?',
    promptFr: 'Combien de cases comporte un échiquier classique ?',
    optionsEn: ['48', '56', '64', '81'],
    optionsFr: ['48', '56', '64', '81'],
    correctOptionIndex: 2,
    explanationEn: 'An 8×8 chessboard contains 64 alternating light and dark squares.',
    explanationFr: 'Un échiquier 8×8 compte 64 cases alternées.',
    isActive: true,
  },
  {
    id: 'qb-ent-2',
    category: 'entertainment',
    difficulty: 'medium',
    promptEn: 'Which Studio Ghibli animated film won the Academy Award for Best Animated Feature in 2003?',
    promptFr: 'Quel film du Studio Ghibli a remporté l\'Oscar du meilleur film d\'animation en 2003 ?',
    optionsEn: ['Princess Mononoke', 'Spirited Away', 'Howl\'s Moving Castle', 'My Neighbor Totoro'],
    optionsFr: ['Princesse Mononoké', 'Le Voyage de Chihiro', 'Le Château ambulant', 'Mon voisin Totoro'],
    correctOptionIndex: 1,
    explanationEn: 'Hayao Miyazaki\'s Spirited Away won Best Animated Feature at the 75th Academy Awards.',
    explanationFr: 'Le Voyage de Chihiro de Hayao Miyazaki a remporté l\'Oscar en 2003.',
    isActive: true,
  },
  {
    id: 'qb-ent-3',
    category: 'entertainment',
    difficulty: 'hard',
    promptEn: 'In music theory, how many semitones separate a perfect fifth?',
    promptFr: 'En théorie musicale, combien de demi-tons séparent une quinte juste ?',
    optionsEn: ['5', '6', '7', '8'],
    optionsFr: ['5', '6', '7', '8'],
    correctOptionIndex: 2,
    explanationEn: 'A perfect fifth (e.g., C to G) spans 7 semitones.',
    explanationFr: 'Une quinte juste (par exemple Do à Sol) couvre 7 demi-tons.',
    isActive: true,
  },
  {
    id: 'qb-ent-4',
    category: 'entertainment',
    difficulty: 'easy',
    promptEn: 'Which piece in chess can leap over other pieces?',
    promptFr: 'Quelle pièce aux échecs peut sauter par-dessus d\'autres pièces ?',
    optionsEn: ['Bishop', 'Rook', 'Knight', 'Queen'],
    optionsFr: ['Fou', 'Tour', 'Cavalier', 'Dame'],
    correctOptionIndex: 2,
    explanationEn: 'The Knight moves in an L-shape and is the only piece able to jump over others.',
    explanationFr: 'Le Cavalier se déplace en L et est la seule pièce pouvant sauter au-dessus des autres.',
    isActive: true,
  },

  // LOGIC
  {
    id: 'qb-log-1',
    category: 'logic',
    difficulty: 'easy',
    promptEn: 'If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are definitely:',
    promptFr: 'Si tous les Bloops sont des Razzies et que tous les Razzies sont des Lazzies, alors tous les Bloops sont forcément :',
    optionsEn: ['Lazzies', 'Not Lazzies', 'Only Razzies', 'Impossible to tell'],
    optionsFr: ['Des Lazzies', 'Pas des Lazzies', 'Uniquement des Razzies', 'Impossible à déterminer'],
    correctOptionIndex: 0,
    explanationEn: 'By transitive set inclusion (A ⊂ B and B ⊂ C), A ⊂ C.',
    explanationFr: 'Par transitivité (A ⊂ B et B ⊂ C), A ⊂ C.',
    isActive: true,
  },
  {
    id: 'qb-log-2',
    category: 'logic',
    difficulty: 'medium',
    promptEn: 'A clock shows 3:15. What is the acute angle between the hour and minute hands?',
    promptFr: 'Une horloge indique 3h15. Quel est l\'angle aigu entre l\'aiguille des heures et celle des minutes ?',
    optionsEn: ['0 degrees', '7.5 degrees', '15 degrees', '22.5 degrees'],
    optionsFr: ['0 degré', '7,5 degrés', '15 degrés', '22,5 degrés'],
    correctOptionIndex: 1,
    explanationEn: 'At 3:15 the minute hand is at 90°, and the hour hand has moved a quarter of 30° = 7.5° past 90°.',
    explanationFr: 'À 3h15, la grande aiguille est à 90° et la petite a avancé d\'un quart de 30°, soit 7,5°.',
    isActive: true,
  },
  {
    id: 'qb-log-3',
    category: 'logic',
    difficulty: 'hard',
    promptEn: 'In a room of 5 people, everyone shakes hands with everyone else exactly once. How many handshakes occur?',
    promptFr: 'Dans une salle de 5 personnes, chacun serre la main de tous les autres exactement une fois. Combien de poignées de main ont lieu ?',
    optionsEn: ['8', '10', '12', '20'],
    optionsFr: ['8', '10', '12', '20'],
    correctOptionIndex: 1,
    explanationEn: 'Combinations C(5, 2) = 5 × 4 / 2 = 10 handshakes.',
    explanationFr: 'Combinaisons C(5, 2) = 5 × 4 / 2 = 10 poignées de main.',
    isActive: true,
  },
  {
    id: 'qb-log-4',
    category: 'logic',
    difficulty: 'medium',
    promptEn: 'Which number completes the sequence: 2, 6, 12, 20, 30, ?',
    promptFr: 'Quel nombre complète la suite : 2, 6, 12, 20, 30, ?',
    optionsEn: ['38', '40', '42', '44'],
    optionsFr: ['38', '40', '42', '44'],
    correctOptionIndex: 2,
    explanationEn: 'Differences increase by 2 (+4, +6, +8, +10, +12): 30 + 12 = 42.',
    explanationFr: 'Les écarts augmentent de 2 (+4, +6, +8, +10, +12) : 30 + 12 = 42.',
    isActive: true,
  },
];

export interface WordEntry {
  id: string;
  wordEn: string;
  wordFr: string;
  difficulty: Difficulty;
  categoryEn: string;
  categoryFr: string;
  hintEn: string;
  hintFr: string;
}

export const WORD_BANK: WordEntry[] = [
  // EASY (5 letters)
  {
    id: 'w-e-1',
    wordEn: 'PULSE',
    wordFr: 'POULS',
    difficulty: 'easy',
    categoryEn: 'Physics & Rhythm',
    categoryFr: 'Physique & Rythme',
    hintEn: 'A rhythmic beat or surge of energy.',
    hintFr: 'Battement régulier perceptible au poignet.',
  },
  {
    id: 'w-e-2',
    wordEn: 'PRISM',
    wordFr: 'PRISM',
    difficulty: 'easy',
    categoryEn: 'Optics',
    categoryFr: 'Optique',
    hintEn: 'A transparent solid that splits white light into a spectrum.',
    hintFr: 'Solide optique qui décompose la lumière blanche.',
  },
  {
    id: 'w-e-3',
    wordEn: 'ORBIT',
    wordFr: 'ASTRE',
    difficulty: 'easy',
    categoryEn: 'Astronomy',
    categoryFr: 'Astronomie',
    hintEn: 'Curved path of a satellite around a planet.',
    hintFr: 'Corps céleste brillant dans l\'espace.',
  },
  {
    id: 'w-e-4',
    wordEn: 'CHESS',
    wordFr: 'ECHEC',
    difficulty: 'easy',
    categoryEn: 'Strategy',
    categoryFr: 'Stratégie',
    hintEn: 'Classic 64-square strategy board game.',
    hintFr: 'Célèbre jeu de stratégie sur 64 cases.',
  },
  // MEDIUM (6 letters)
  {
    id: 'w-m-1',
    wordEn: 'CIPHER',
    wordFr: 'CHIFFR',
    difficulty: 'medium',
    categoryEn: 'Cryptography',
    categoryFr: 'Cryptographie',
    hintEn: 'An algorithm used to encrypt or decode secret messages.',
    hintFr: 'Méthode secrète pour coder un message.',
  },
  {
    id: 'w-m-2',
    wordEn: 'VECTOR',
    wordFr: 'VECTEU',
    difficulty: 'medium',
    categoryEn: 'Mathematics',
    categoryFr: 'Mathématiques',
    hintEn: 'A quantity with both magnitude and direction.',
    hintFr: 'Objet mathématique défini par une direction et une norme.',
  },
  {
    id: 'w-m-3',
    wordEn: 'ZENITH',
    wordFr: 'ZENITH',
    difficulty: 'medium',
    categoryEn: 'Astronomy',
    categoryFr: 'Astronomie',
    hintEn: 'The highest point directly above an observer.',
    hintFr: 'Le point le plus haut au-dessus de l\'observateur.',
  },
  {
    id: 'w-m-4',
    wordEn: 'MATRIX',
    wordFr: 'MATRIC',
    difficulty: 'medium',
    categoryEn: 'Algebra',
    categoryFr: 'Algèbre',
    hintEn: 'Rectangular array of numbers arranged in rows and columns.',
    hintFr: 'Tableau rectangulaire de nombres en lignes et colonnes.',
  },
  // HARD (7 letters)
  {
    id: 'w-h-1',
    wordEn: 'QUANTUM',
    wordFr: 'QUANTUM',
    difficulty: 'hard',
    categoryEn: 'Physics',
    categoryFr: 'Physique',
    hintEn: 'The smallest discrete unit of any physical property.',
    hintFr: 'La plus petite quantité indivisible d\'énergie.',
  },
  {
    id: 'w-h-2',
    wordEn: 'ECLIPSE',
    wordFr: 'ECLIPSE',
    difficulty: 'hard',
    categoryEn: 'Astronomy',
    categoryFr: 'Astronomie',
    hintEn: 'Alignment where one celestial body casts a shadow on another.',
    hintFr: 'Occultation temporaire d\'un astre par un autre.',
  },
  {
    id: 'w-h-3',
    wordEn: 'PARADOX',
    wordFr: 'PARADOX',
    difficulty: 'hard',
    categoryEn: 'Logic',
    categoryFr: 'Logique',
    hintEn: 'A seemingly contradictory statement that reveals a deeper truth.',
    hintFr: 'Énoncé qui semble se contredire malgré une logique rigoureuse.',
  },
];

// Normalize French 6/7-letter words cleanly to exact playable dictionary words
WORD_BANK[4].wordFr = 'CODAGE';
WORD_BANK[5].wordFr = 'SAVOIR';
WORD_BANK[7].wordFr = 'RESEAU';
WORD_BANK[10].wordFr = 'ENIGMES';

export interface BrainPuzzleAdmin {
  id: string;
  type: 'sequence' | 'pattern' | 'math' | 'memory' | 'logic';
  difficulty: Difficulty;
  promptEn: string;
  promptFr: string;
  visualData?: {
    sequence?: (number | string)[];
    grid?: string[];
    memorySequence?: string[];
    memoryRevealMs?: number;
  };
  options: string[];
  correctIndex: number;
  hintEn: string;
  hintFr: string;
}

export const BRAIN_PUZZLES: BrainPuzzleAdmin[] = [
  {
    id: 'bt-1',
    type: 'sequence',
    difficulty: 'easy',
    promptEn: 'Find the missing value in this arithmetic-geometric progression.',
    promptFr: 'Trouvez la valeur manquante dans cette suite.',
    visualData: { sequence: [3, 7, 15, 31, '?'] },
    options: ['47', '59', '63', '64'],
    correctIndex: 2,
    hintEn: 'Each term is double the previous term plus 1.',
    hintFr: 'Chaque terme vaut le double du précédent plus 1.',
  },
  {
    id: 'bt-2',
    type: 'math',
    difficulty: 'easy',
    promptEn: 'A player scores 18 points in round 1 and increases their score by 50% in round 2. What is their total across both rounds?',
    promptFr: 'Un joueur marque 18 points au tour 1 puis augmente ce score de 50 % au tour 2. Quel est le total cumulé ?',
    options: ['27', '36', '45', '54'],
    correctIndex: 2,
    hintEn: 'Round 2 is 18 + 9 = 27. Sum both rounds.',
    hintFr: 'Le tour 2 vaut 18 + 9 = 27. Additionnez les deux tours.',
  },
  {
    id: 'bt-3',
    type: 'memory',
    difficulty: 'easy',
    promptEn: 'Memorize the symbol code shown briefly, then pick the exact matching sequence.',
    promptFr: 'Mémorisez le code affiché brièvement, puis choisissez la séquence exacte.',
    visualData: { memorySequence: ['◆', '▲', '●', '■'], memoryRevealMs: 2800 },
    options: ['◆ ▲ ● ■', '◆ ● ▲ ■', '▲ ◆ ● ■', '◆ ▲ ■ ●'],
    correctIndex: 0,
    hintEn: 'Starts with a diamond and ends with a square.',
    hintFr: 'Commence par un losange et finit par un carré.',
  },
  {
    id: 'bt-4',
    type: 'pattern',
    difficulty: 'easy',
    promptEn: 'Which code continues the letter-number pairing?',
    promptFr: 'Quel code poursuit la paire lettre-nombre ?',
    visualData: { sequence: ['B2', 'D4', 'F6', 'H8', '?'] },
    options: ['I9', 'J10', 'K10', 'J12'],
    correctIndex: 1,
    hintEn: 'Skip one letter and add 2 to the number each step.',
    hintFr: 'Sautez une lettre et ajoutez 2 au chiffre à chaque étape.',
  },
  {
    id: 'bt-5',
    type: 'logic',
    difficulty: 'easy',
    promptEn: 'Three servers A, B, and C process tasks. A is faster than B, and C is slower than B. Which is fastest?',
    promptFr: 'Trois serveurs A, B et C traitent des requêtes. A est plus rapide que B, et C est plus lent que B. Lequel est le plus rapide ?',
    options: ['Server A', 'Server B', 'Server C', 'A and C tie'],
    correctIndex: 0,
    hintEn: 'Order them from fastest to slowest: A > B > C.',
    hintFr: 'Classez-les du plus rapide au plus lent : A > B > C.',
  },
  {
    id: 'bt-6',
    type: 'sequence',
    difficulty: 'medium',
    promptEn: 'Identify the next value in this alternating Fibonacci-like sequence.',
    promptFr: 'Identifiez le prochain terme de cette suite.',
    visualData: { sequence: [1, 2, 4, 7, 11, 16, '?'] },
    options: ['20', '21', '22', '24'],
    correctIndex: 2,
    hintEn: 'Add +1, +2, +3, +4, +5, then +6.',
    hintFr: 'Ajoutez +1, +2, +3, +4, +5, puis +6.',
  },
  {
    id: 'bt-7',
    type: 'math',
    difficulty: 'medium',
    promptEn: 'If 4 machines take 4 minutes to assemble 4 sensors, how long do 10 machines take to assemble 10 sensors?',
    promptFr: 'Si 4 machines mettent 4 minutes à assembler 4 capteurs, combien de temps mettent 10 machines pour assembler 10 capteurs ?',
    options: ['1 minute', '4 minutes', '10 minutes', '40 minutes'],
    correctIndex: 1,
    hintEn: 'Each machine works in parallel on one sensor.',
    hintFr: 'Chaque machine travaille en parallèle sur un capteur.',
  },
  {
    id: 'bt-8',
    type: 'memory',
    difficulty: 'medium',
    promptEn: 'Memorize the 5-digit security pin, then select the exact match.',
    promptFr: 'Mémorisez le code à 5 chiffres, puis sélectionnez la bonne combinaison.',
    visualData: { memorySequence: ['7', '3', '9', '1', '4'], memoryRevealMs: 2500 },
    options: ['7 3 9 4 1', '7 9 3 1 4', '7 3 9 1 4', '3 7 9 1 4'],
    correctIndex: 2,
    hintEn: 'Ends with 1 followed by 4.',
    hintFr: 'Se termine par 1 suivi de 4.',
  },
  {
    id: 'bt-9',
    type: 'pattern',
    difficulty: 'medium',
    promptEn: 'In a 3×3 matrix where every row sums to 15, row 1 is [8, 1, 6] and row 2 is [3, 5, ?]. What replaces ?',
    promptFr: 'Dans un carré 3×3 où chaque ligne vaut 15, la ligne 2 est [3, 5, ?]. Que vaut ? ?',
    visualData: { grid: ['8', '1', '6', '3', '5', '?', '4', '9', '2'] },
    options: ['6', '7', '8', '9'],
    correctIndex: 1,
    hintEn: '3 + 5 + ? = 15.',
    hintFr: '3 + 5 + ? = 15.',
  },
  {
    id: 'bt-10',
    type: 'logic',
    difficulty: 'medium',
    promptEn: 'In a tournament of 16 players with single elimination, how many matches are played to crown one champion?',
    promptFr: 'Dans un tournoi à élimination directe de 16 joueurs, combien de matchs faut-il pour désigner le vainqueur ?',
    options: ['8', '12', '15', '16'],
    correctIndex: 2,
    hintEn: 'Every match eliminates exactly 1 player; 15 players must be eliminated.',
    hintFr: 'Chaque match élimine exactement 1 joueur ; 15 joueurs doivent être éliminés.',
  },
  {
    id: 'bt-11',
    type: 'sequence',
    difficulty: 'hard',
    promptEn: 'What number comes next in the cube-minus-one series?',
    promptFr: 'Quel nombre suit dans cette série logique ?',
    visualData: { sequence: [0, 7, 26, 63, 124, '?'] },
    options: ['185', '215', '216', '255'],
    correctIndex: 1,
    hintEn: 'Calculate n³ - 1 for n = 1, 2, 3, 4, 5, 6.',
    hintFr: 'Calculez n³ - 1 pour n = 1, 2, 3, 4, 5, 6.',
  },
  {
    id: 'bt-12',
    type: 'math',
    difficulty: 'hard',
    promptEn: 'A store raises a price by 25%, then discounts the new price by 20%. Compared to the original price, the final price is:',
    promptFr: 'Un prix augmente de 25 %, puis baisse de 20 %. Par rapport au prix initial, le prix final est :',
    options: ['5% higher', '5% lower', 'Exactly the same', '2% higher'],
    correctIndex: 2,
    hintEn: '1.25 × 0.80 = 1.00.',
    hintFr: '1,25 × 0,80 = 1,00.',
  },
  {
    id: 'bt-13',
    type: 'memory',
    difficulty: 'hard',
    promptEn: 'Memorize the 6-token sequence before it vanishes.',
    promptFr: 'Mémorisez la séquence de 6 jetons avant qu\'elle ne disparaisse.',
    visualData: { memorySequence: ['A9', 'K4', 'M2', 'X7', 'P5', 'Z1'], memoryRevealMs: 2400 },
    options: ['A9 K4 M2 X7 P5 Z1', 'A9 K4 M7 X2 P5 Z1', 'A9 K4 M2 X7 P1 Z5', 'A4 K9 M2 X7 P5 Z1'],
    correctIndex: 0,
    hintEn: 'Middle pair is M2 X7.',
    hintFr: 'La paire centrale est M2 X7.',
  },
  {
    id: 'bt-14',
    type: 'logic',
    difficulty: 'hard',
    promptEn: 'A drawer holds 6 blue chips and 6 violet chips in the dark. Minimum chips to draw to guarantee a matching pair?',
    promptFr: 'Un tiroir contient 6 jetons bleus et 6 violets dans le noir. Combien en tirer au minimum pour garantir une paire identique ?',
    options: ['2', '3', '6', '7'],
    correctIndex: 1,
    hintEn: 'Apply the Pigeonhole Principle across 2 colors.',
    hintFr: 'Appliquez le principe des tiroirs sur 2 couleurs.',
  },
  {
    id: 'bt-15',
    type: 'pattern',
    difficulty: 'hard',
    promptEn: 'What replaces the question mark: 4 → 18, 5 → 27, 6 → 38, 7 → ?',
    promptFr: 'Quelle valeur remplace ? : 4 → 18, 5 → 27, 6 → 38, 7 → ?',
    visualData: { sequence: ['4→18', '5→27', '6→38', '7→?'] },
    options: ['49', '51', '53', '56'],
    correctIndex: 1,
    hintEn: 'Formula is n² + 2.',
    hintFr: 'La formule est n² + 2.',
  },
];

export interface MysteryScenarioAdmin {
  id: string;
  slug: string;
  difficulty: Difficulty;
  titleEn: string;
  titleFr: string;
  introEn: string;
  introFr: string;
  locationEn: string;
  locationFr: string;
  isPlusOnly: boolean;
  clues: {
    id: string;
    labelEn: string;
    labelFr: string;
    detailEn: string;
    detailFr: string;
    unlockedByDefault?: boolean;
  }[];
  suspects: {
    id: string;
    name: string;
    roleEn: string;
    roleFr: string;
    alibiEn: string;
    alibiFr: string;
  }[];
  questions: {
    id: string;
    promptEn: string;
    promptFr: string;
    optionsEn: string[];
    optionsFr: string[];
    correctIndex: number;
  }[];
  culpritId: string;
  resolutionEn: string;
  resolutionFr: string;
}

export const INITIAL_MYSTERY_SCENARIOS: MysteryScenarioAdmin[] = [
  {
    id: 'mys-1',
    slug: 'meridian-observatory',
    difficulty: 'easy',
    titleEn: 'The Meridian Observatory Theft',
    titleFr: 'Le Vol de l\'Observatoire Méridien',
    introEn:
      'At 23:40 during a blackout, the calibrated ruby lens vanished from Dome B of the Meridian Observatory. Only three researchers had keycards active in the building.',
    introFr:
      'À 23h40 pendant une coupure de courant, la lentille en rubis calibrée a disparu du Dôme B. Seuls trois chercheurs avaient un badge actif dans le bâtiment.',
    locationEn: 'Meridian Observatory · Dome B',
    locationFr: 'Observatoire Méridien · Dôme B',
    isPlusOnly: false,
    clues: [
      {
        id: 'clue-1',
        labelEn: 'Badge Access Log',
        labelFr: 'Journal des Badges',
        detailEn: 'Door sensor recorded manual key override at 23:42 — keycard reader was offline during the blackout, meaning a physical brass master key was used.',
        detailFr: 'Le capteur a enregistré une ouverture par clé mécanique à 23h42 — le lecteur de badge était hors ligne pendant la panne.',
        unlockedByDefault: true,
      },
      {
        id: 'clue-2',
        labelEn: 'Dome B Worktable',
        labelFr: 'Établi du Dôme B',
        detailEn: 'A faint trace of archival cedar polish was found on the velvet lens casing. Only the night archivist uses cedar polish on instrument crates.',
        detailFr: 'Une trace de cire de cèdre a été relevée sur l\'étui en velours. Seul l\'archiviste de nuit utilise cette cire.',
      },
      {
        id: 'clue-3',
        labelEn: 'Generator Switch',
        labelFr: 'Disjoncteur du Générateur',
        detailEn: 'Backup battery failed because someone removed fuse #4 ten minutes before 23:40—someone working in the basement wing.',
        detailFr: 'La batterie de secours a échoué car le fusible #4 a été retiré dix minutes avant 23h40 depuis le sous-sol.',
      },
    ],
    suspects: [
      {
        id: 's-nadia',
        name: 'Dr. Nadia Kante',
        roleEn: 'Astrophysicist',
        roleFr: 'Astrophysicienne',
        alibiEn: 'Claims she stayed in the rooftop telemetry booth calibrating radio dishes until 00:15.',
        alibiFr: 'Affirme être restée dans la cabine de télémétrie sur le toit jusqu\'à 00h15.',
      },
      {
        id: 's-julien',
        name: 'Julien Mercier',
        roleEn: 'Night Archivist',
        roleFr: 'Archiviste de nuit',
        alibiEn: 'Says he never left the 2nd-floor library and does not possess a brass master key.',
        alibiFr: 'Déclare ne jamais avoir quitté la bibliothèque du 2e étage et ne pas avoir de passe-partout.',
      },
      {
        id: 's-omar',
        name: 'Omar Diallo',
        roleEn: 'Systems Technician',
        roleFr: 'Technicien systèmes',
        alibiEn: 'Was spotted on CCTV outside the main gate waiting for a courier between 23:25 and 23:55.',
        alibiFr: 'Filmé par la caméra extérieure devant le portail en train d\'attendre un coursier entre 23h25 et 23h55.',
      },
    ],
    questions: [
      {
        id: 'mq-1',
        promptEn: 'How did the thief bypass the Dome B lock during the blackout?',
        promptFr: 'Comment le voleur a-t-il ouvert le Dôme B pendant la panne ?',
        optionsEn: [
          'Cloned an RFID badge',
          'Used a physical brass master key',
          'Entered through the roof skylight',
        ],
        optionsFr: [
          'En clonant un badge RFID',
          'Avec une clé mécanique passe-partout',
          'Par la verrière du toit',
        ],
        correctIndex: 1,
      },
      {
        id: 'mq-2',
        promptEn: 'Which forensic residue directly implicates the culprit?',
        promptFr: 'Quelle trace matérielle incrimine directement le coupable ?',
        optionsEn: [
          'Radio dish grease',
          'Archival cedar polish',
          'Courier ink stain',
        ],
        optionsFr: [
          'Graisse d\'antenne radio',
          'Cire de cèdre d\'archivage',
          'Encre de bordereau',
        ],
        correctIndex: 1,
      },
    ],
    culpritId: 's-julien',
    resolutionEn:
      'Julien Mercier used the archive\'s brass master key during the staged blackout, leaving cedar polish from his crate maintenance kit on the lens casing.',
    resolutionFr:
      'Julien Mercier a utilisé le passe-partout des archives pendant la panne provoquée, laissant de la cire de cèdre sur l\'étui.',
  },
  {
    id: 'mys-2',
    slug: 'midnight-server-vault',
    difficulty: 'medium',
    titleEn: 'The Midnight Server Vault',
    titleFr: 'Le Coffre Numérique de Minuit',
    introEn:
      'An encrypted prototype algorithm was exfiltrated from Vault 09 at 01:12 AM via a local air-gapped terminal—impossible without physical proximity.',
    introFr:
      'Un algorithme prototype chiffré a été exfiltré du Coffre 09 à 01h12 via un terminal isolé du réseau—impossible sans présence physique.',
    locationEn: 'Kora Labs · Sublevel Vault 09',
    locationFr: 'Kora Labs · Sous-sol Coffre 09',
    isPlusOnly: false,
    clues: [
      {
        id: 'clue-m1',
        labelEn: 'USB Port Telemetry',
        labelFr: 'Télémétrie du Port USB',
        detailEn: 'The air-gapped terminal mounted an encrypted drive formatted with an ext4 Linux volume labeled "NEBULA_DEV" at 01:11:40.',
        detailFr: 'Le terminal isolé a monté une clé chiffrée ext4 nommée « NEBULA_DEV » à 01h11:40.',
        unlockedByDefault: true,
      },
      {
        id: 'clue-m2',
        labelEn: 'Biometric Thermal Trace',
        labelFr: 'Empreinte Thermique',
        detailEn: 'The vault keypad retained heat on digits 4, 8, and 2—matching an elevated pulse from climbing stairs rather than using the elevator.',
        detailFr: 'Le clavier du coffre a conservé une trace thermique sur les touches 4, 8 et 2.',
      },
      {
        id: 'clue-m3',
        labelEn: 'Elevator Maintenance Log',
        labelFr: 'Journal de l\'Ascenseur',
        detailEn: 'The elevator was locked on floor 5 from 00:55 to 01:25 by a badge belonging to Lead Security.',
        detailFr: 'L\'ascenseur est resté bloqué au 5e étage de 00h55 à 01h25.',
      },
    ],
    suspects: [
      {
        id: 's-claire',
        name: 'Claire Vasseur',
        roleEn: 'Principal Kernel Engineer',
        roleFr: 'Ingénieure Noyau Principale',
        alibiEn: 'Works exclusively on Linux systems; her workstation project codename is Project Nebula, though she claims she was asleep at home.',
        alibiFr: 'Travaille exclusivement sous Linux sur le projet Nebula ; affirme avoir dormi chez elle.',
      },
      {
        id: 's-marcus',
        name: 'Marcus Reed',
        roleEn: 'Lead Security Officer',
        roleFr: 'Chef de la Sécurité',
        alibiEn: 'Was conducting an audit on floor 5 and logged badge scans there at 01:10.',
        alibiFr: 'Effectuait un audit au 5e étage avec enregistrement de badge à 01h10.',
      },
      {
        id: 's-amara',
        name: 'Amara Osei',
        roleEn: 'Hardware QA Lead',
        roleFr: 'Responsable QA Matériel',
        alibiEn: 'Uses macOS hardware benches in Lab 2 and checked out at 22:00 with a verified gate exit.',
        alibiFr: 'Travaille sur macOS au Labo 2 et a quitté le site à 22h00 avec sortie validée.',
      },
    ],
    questions: [
      {
        id: 'mq-m1',
        promptEn: 'Why could the culprit reach Sublevel Vault 09 without triggering elevator logs?',
        promptFr: 'Pourquoi le coupable a-t-il pu accéder au sous-sol sans apparaître dans les journaux d\'ascenseur ?',
        optionsEn: [
          'They hacked the elevator firmware',
          'They took the stairwell while the elevator was held on floor 5',
          'They accessed Vault 09 remotely over Wi-Fi',
        ],
        optionsFr: [
          'En piratant le logiciel de l\'ascenseur',
          'En prenant les escaliers pendant que l\'ascenseur était bloqué au 5e',
          'À distance via le Wi-Fi',
        ],
        correctIndex: 1,
      },
      {
        id: 'mq-m2',
        promptEn: 'Which detail ties the mounted drive directly to one suspect?',
        promptFr: 'Quel indice relie directement le disque monté à un suspect ?',
        optionsEn: [
          'The floor 5 audit log',
          'The ext4 volume labeled NEBULA_DEV',
          'The 22:00 gate exit',
        ],
        optionsFr: [
          'Le journal d\'audit du 5e étage',
          'Le volume ext4 nommé NEBULA_DEV',
          'La sortie de 22h00',
        ],
        correctIndex: 1,
      },
    ],
    culpritId: 's-claire',
    resolutionEn:
      'Claire Vasseur used the stairwell to bypass elevator tracking and copied the prototype onto her Linux NEBULA_DEV drive.',
    resolutionFr:
      'Claire Vasseur a emprunté les escaliers et copié le prototype sur sa clé Linux NEBULA_DEV.',
  },
  {
    id: 'mys-3',
    slug: 'vanished-horologist',
    difficulty: 'hard',
    titleEn: 'The Vanished Horologist',
    titleFr: 'L\'Horloger Disparu',
    introEn:
      'Master watchmaker Henri Valmont disappeared from his locked Geneva atelier at 19:00, leaving behind a stopped astronomical clock and three conflicting testimonies.',
    introFr:
      'Le maître horloger Henri Valmont a disparu de son atelier fermé à 19h00, laissant une horloge astronomique arrêtée et trois témoignages contradictoires.',
    locationEn: 'Atelier Valmont · Geneva',
    locationFr: 'Atelier Valmont · Genève',
    isPlusOnly: false,
    clues: [
      {
        id: 'clue-h1',
        labelEn: 'Stopped Pendulum',
        labelFr: 'Balancier Arrêté',
        detailEn: 'The master clock stopped at exactly 18:47—not from power loss, but because its chime weight was lifted off its chain.',
        detailFr: 'L\'horloge s\'est arrêtée à 18h47 précises car le poids de sonnerie a été soulevé de sa chaîne.',
        unlockedByDefault: true,
      },
      {
        id: 'clue-h2',
        labelEn: 'Ink-Stained Ledger',
        labelFr: 'Registre Taché d\'Encre',
        detailEn: 'A receipt dated 18:50 for a private courier car was signed with a fountain pen using rare cobalt-blue ink.',
        detailFr: 'Un reçu daté de 18h50 pour une voiture privée a été signé avec une encre bleu cobalt rare.',
      },
      {
        id: 'clue-h3',
        labelEn: 'Window Latch',
        labelFr: 'Loquet de Fenêtre',
        detailEn: 'The courtyard window was latched from the inside, meaning nobody exited through the window—everyone walked out the front gallery.',
        detailFr: 'La fenêtre sur cour était verrouillée de l\'intérieur ; personne n\'est sorti par là.',
      },
    ],
    suspects: [
      {
        id: 's-elena',
        name: 'Elena Soroka',
        roleEn: 'Apprentice Engraver',
        roleFr: 'Apprentie Graveuse',
        alibiEn: 'Was photographed entering the tram station two blocks away at 18:42.',
        alibiFr: 'Photographiée en train d\'entrer à la station de tramway à 18h42.',
      },
      {
        id: 's-luc',
        name: 'Luc Delacroix',
        roleEn: 'Business Partner',
        roleFr: 'Associé Commercial',
        alibiEn: 'Carries a cobalt-blue fountain pen and claimed he heard the clock chime 19:00 before leaving—impossible since it stopped at 18:47.',
        alibiFr: 'Possède un stylo à encre bleu cobalt et prétend avoir entendu sonner 19h00—impossible car l\'horloge s\'est arrêtée à 18h47.',
      },
      {
        id: 's-sora',
        name: 'Sora Takahashi',
        roleEn: 'Collector Client',
        roleFr: 'Collectionneuse Cliente',
        alibiEn: 'Arrived at 19:05 and waited outside the locked front gallery until security arrived.',
        alibiFr: 'Est arrivée à 19h05 et a patienté devant la galerie fermée.',
      },
    ],
    questions: [
      {
        id: 'mq-h1',
        promptEn: 'Which statement proves Luc Delacroix\'s alibi is fabricated?',
        promptFr: 'Quel fait prouve que l\'alibi de Luc Delacroix est fabriqué ?',
        optionsEn: [
          'He claimed to hear the 19:00 chime after the clock stopped at 18:47',
          'He arrived at 19:05',
          'He boarded the tram at 18:42',
        ],
        optionsFr: [
          'Il affirme avoir entendu le carillon de 19h00 alors que l\'horloge s\'est arrêtée à 18h47',
          'Il est arrivé à 19h05',
          'Il a pris le tramway à 18h42',
        ],
        correctIndex: 0,
      },
      {
        id: 'mq-h2',
        promptEn: 'What does the window latch confirm about the departure?',
        promptFr: 'Que confirme le loquet de la fenêtre sur la fuite ?',
        optionsEn: [
          'The culprit escaped onto the roof',
          'The exit occurred through the front gallery door',
          'The clock was broken by wind',
        ],
        optionsFr: [
          'Le coupable s\'est enfui par le toit',
          'La sortie s\'est faite par la porte principale de la galerie',
          'Le vent a brisé l\'horloge',
        ],
        correctIndex: 1,
      },
    ],
    culpritId: 's-luc',
    resolutionEn:
      'Luc Delacroix arranged Henri\'s departure in the 18:50 courier car, signed the ledger with his cobalt pen, and gave away his lie by claiming he heard a 19:00 chime.',
    resolutionFr:
      'Luc Delacroix a organisé le départ dans la voiture de 18h50 avec son stylo bleu cobalt et s\'est trahi sur le carillon de 19h00.',
  },
];

export function getQuizCategories(): QuizCategory[] {
  return ['general', 'science', 'technology', 'geography', 'history', 'entertainment', 'logic'];
}
