import Dexie, { type Table } from 'dexie';
import type { Deck, Card, UserSettings, UserProfile } from '../types';
import { initializeFSRSCard } from './fsrs';

export class BertoDatabase extends Dexie {
  decks!: Table<Deck, number>;
  cards!: Table<Card, number>;
  settings!: Table<UserSettings, number>;
  profile!: Table<UserProfile, number>;

  constructor() {
    super('BertoAIDatabase');
    this.version(2).stores({
      decks: '++id, title, category, parentId, createdAt, updatedAt',
      cards: '++id, deckId, type, due, state, createdAt',
      settings: '++id',
      profile: '++id',
    });
  }
}

export const db = new BertoDatabase();

let isSeeding = false;

// Seed initial starter decks & profile for instant study experience
export async function seedInitialData() {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const deckCount = await db.decks.count();
    const now = new Date();

  // Initialize default user settings if not present
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      aiProvider: 'gemini',
      apiKey: '',
      soundEnabled: true,
      soundVolume: 0.8,
      hapticsEnabled: true,
      darkMode: false,
    });
  }

  // Initialize default user profile if not present
  const profileCount = await db.profile.count();
  if (profileCount === 0) {
    await db.profile.add({
      name: 'Alex',
      age: 'University Student',
      major: 'Computer Science & Pre-Med',
      motto: 'Consistency beats intensity.',
      avatarColor: 'violet',
      dailyGoalCards: 20,
      xp: 340,
      streakDays: 3,
      lastStudyDate: now.toISOString().slice(0, 10),
    });
  }

  if (deckCount > 0) return;

  // 1. Cellular Biology Deck (Parent Deck)
  const bioDeckId = await db.decks.add({
    title: 'Cellular Biology 101',
    description: 'Key cell structures, organelles, and energy synthesis.',
    category: 'Science',
    color: 'emerald',
    icon: 'Microscope',
    cardCount: 6,
    tags: ['#biology', '#cells', '#exam'],
    parentId: null,
    createdAt: now,
    updatedAt: now,
  });

  const bioCards: Omit<Card, 'id'>[] = [
    {
      deckId: bioDeckId,
      question: 'Which organelle is responsible for generating most of the cell’s supply of adenosine triphosphate (ATP)?',
      answer: 'Mitochondria',
      options: ['Mitochondria', 'Endoplasmic Reticulum', 'Golgi Apparatus', 'Ribosome'],
      explanation: 'Mitochondria are often referred to as the powerhouses of the cell because they generate ATP via oxidative phosphorylation.',
      type: 'multiple_choice',
      createdAt: now,
      ...initializeFSRSCard(),
    },
    {
      deckId: bioDeckId,
      question: 'Which of the following cellular components are present in animal cells? (Select all that apply)',
      answer: 'Mitochondria, Ribosomes, Plasma Membrane',
      options: ['Mitochondria', 'Chloroplasts', 'Ribosomes', 'Plasma Membrane'],
      correctAnswers: ['Mitochondria', 'Ribosomes', 'Plasma Membrane'],
      explanation: 'Animal cells contain mitochondria, ribosomes, and plasma membranes, but lack chloroplasts (which are found in plants and algae).',
      type: 'multiple_select',
      createdAt: now,
      ...initializeFSRSCard(),
    },
    {
      deckId: bioDeckId,
      question: 'The powerhouse of the cell is the [______], which synthesizes ATP through oxidative phosphorylation.',
      answer: 'Mitochondria',
      explanation: 'Mitochondria generate the majority of chemical energy required to power biochemical reactions in eukaryotic cells.',
      type: 'fill_blank',
      createdAt: now,
      ...initializeFSRSCard(),
    },
    {
      deckId: bioDeckId,
      question: 'Plant cells have both a rigid cell wall and chloroplasts for photosynthesis.',
      answer: 'True',
      options: ['True', 'False'],
      correctAnswers: ['True'],
      explanation: 'Unlike animal cells, plant cells possess a cellulose cell wall for structure and chloroplasts for energy capture.',
      type: 'true_false',
      createdAt: now,
      ...initializeFSRSCard(),
    },
    {
      deckId: bioDeckId,
      question: 'What is the primary function of the Ribosome?',
      answer: 'Protein synthesis',
      options: ['Protein synthesis', 'Lipid breakdown', 'DNA replication', 'Waste packaging'],
      explanation: 'Ribosomes translate messenger RNA (mRNA) sequences into amino acid chains to synthesize proteins.',
      type: 'multiple_choice',
      createdAt: now,
      ...initializeFSRSCard(),
    },
    {
      deckId: bioDeckId,
      question: 'What process do plant cells use to convert sunlight into chemical energy?',
      answer: 'Photosynthesis',
      options: ['Photosynthesis', 'Fermentation', 'Glycolysis', 'Krebs Cycle'],
      explanation: 'Photosynthesis occurs within chloroplasts, utilizing chlorophyll to capture photons and produce glucose and oxygen.',
      type: 'multiple_choice',
      createdAt: now,
      ...initializeFSRSCard(),
    },
  ];

  await db.cards.bulkAdd(bioCards as Card[]);

  // 1b. Nested Sub-deck under Biology 101!
  const subBioDeckId = await db.decks.add({
    title: 'Unit 2: Genetics & DNA',
    description: 'Nucleotides, double-helix structures, and transcription.',
    category: 'Science',
    color: 'sky',
    icon: 'Atom',
    cardCount: 2,
    tags: ['#genetics', '#dna', '#biology'],
    parentId: bioDeckId,
    createdAt: now,
    updatedAt: now,
  });

  await db.cards.bulkAdd([
    {
      deckId: subBioDeckId,
      question: 'Which base pairs with Adenine in DNA?',
      answer: 'Thymine',
      options: ['Thymine', 'Cytosine', 'Guanine', 'Uracil'],
      explanation: 'In DNA, Adenine always pairs with Thymine via two hydrogen bonds (Uracil replaces Thymine in RNA).',
      type: 'multiple_choice',
      createdAt: now,
      ...initializeFSRSCard(),
    },
    {
      deckId: subBioDeckId,
      question: 'What enzyme unwinds the DNA double helix during replication?',
      answer: 'Helicase',
      options: ['Helicase', 'DNA Polymerase', 'Ligase', 'Topoisomerase'],
      explanation: 'Helicase separates double-stranded DNA into single strands allowing each strand to be copied.',
      type: 'multiple_choice',
      createdAt: now,
      ...initializeFSRSCard(),
    },
  ]);

  // 2. Data Structures & Algorithms Deck
  const csDeckId = await db.decks.add({
    title: 'Data Structures & Big-O',
    description: 'Essential computer science interview & exam fundamentals.',
    category: 'Computer Science',
    color: 'indigo',
    icon: 'Code2',
    cardCount: 4,
    tags: ['#cs', '#algorithms', '#interview'],
    parentId: null,
    createdAt: now,
    updatedAt: now,
  });

  const csCards: Omit<Card, 'id'>[] = [
    {
      deckId: csDeckId,
      question: 'What is the average time complexity for searching a key in a balanced Hash Table?',
      answer: 'O(1)',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      explanation: 'Hash tables offer O(1) constant average lookup time through hashing and bucketing, assuming a good hash distribution.',
      type: 'multiple_choice',
      createdAt: now,
      ...initializeFSRSCard(),
    },
    {
      deckId: csDeckId,
      question: 'Which data structure operates on a Last-In, First-Out (LIFO) order?',
      answer: 'Stack',
      options: ['Stack', 'Queue', 'Array', 'Priority Queue'],
      explanation: 'A Stack pushes and pops elements from the top, following the LIFO principle (like a stack of plates).',
      type: 'multiple_choice',
      createdAt: now,
      ...initializeFSRSCard(),
    },
    {
      deckId: csDeckId,
      question: 'Binary Search requires the input array to be:',
      answer: 'Sorted',
      options: ['Sorted', 'Reversed', 'Unique integers only', 'Indexed with strings'],
      explanation: 'Binary Search halves the search space each step, which requires the underlying elements to be in sorted order.',
      type: 'multiple_choice',
      createdAt: now,
      ...initializeFSRSCard(),
    },
    {
      deckId: csDeckId,
      question: 'What is the worst-case time complexity of standard QuickSort?',
      answer: 'O(n²)',
      options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'],
      explanation: 'When the chosen pivot is consistently the smallest or largest element, QuickSort degrades to O(n²).',
      type: 'multiple_choice',
      createdAt: now,
      ...initializeFSRSCard(),
    },
  ];

  await db.cards.bulkAdd(csCards as Card[]);
  } finally {
    isSeeding = false;
  }
}
