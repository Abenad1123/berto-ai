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

// Handle cross-tab schema upgrades cleanly
if (typeof window !== 'undefined') {
  db.on('versionchange', () => {
    db.close();
  });

  // Request durable, non-evictable storage for local study vault
  if (navigator.storage?.persist) {
    navigator.storage.persisted().then((persisted) => {
      if (!persisted) {
        navigator.storage.persist().catch(() => {});
      }
    }).catch(() => {});
  }
}

let isSeeding = false;

// Initialize default user settings if not present (does not seed default decks)
export async function seedInitialData() {
  if (isSeeding) return;
  isSeeding = true;
  try {
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
  } finally {
    isSeeding = false;
  }
}

// Optional helper to restore starter demo decks on demand via Settings
export async function seedStarterDecks() {
  const deckCount = await db.decks.count();
  if (deckCount > 0) return;
  const now = new Date();

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
}

/**
 * Test & Demo helper: Sets student account data to Max Level (Level 6 Sage)
 * and unlocks all quests, achievements, badges, and prestige avatar gradients.
 */
export async function upgradeToMaxLevelAndQuests() {
  const existingProfile = await db.profile.toCollection().first();
  const profileData: UserProfile = {
    name: existingProfile?.name || 'Grand Scholar',
    age: existingProfile?.age || 'Undergraduate / College',
    major: existingProfile?.major || 'Computer Science & AI',
    motto: existingProfile?.motto || 'Consistency beats intensity.',
    avatarColor: existingProfile?.avatarColor || 'obsidian_gold',
    avatarIcon: existingProfile?.avatarIcon || '👑',
    xp: 3500, // Level 6 Sage (requires >= 2500 XP)
    streakDays: 7, // Unlocks 3-Day Flame badge
  };

  if (existingProfile?.id) {
    await db.profile.update(existingProfile.id, profileData);
  } else {
    await db.profile.add(profileData);
  }

  // Ensure a deck exists with at least 100 cards, 15 mature cards, and 75 reviews
  let deck = await db.decks.toCollection().first();
  const now = new Date();
  if (!deck?.id) {
    const deckId = await db.decks.add({
      title: 'Master Study Arena',
      description: 'Comprehensive mastery deck with unlocked quests and stats.',
      category: 'Science',
      color: 'violet',
      icon: 'Trophy',
      cardCount: 0,
      tags: ['#mastery', '#arena'],
      parentId: null,
      createdAt: now,
      updatedAt: now,
    });
    deck = await db.decks.get(deckId);
  }

  if (deck?.id) {
    const currentCardCount = await db.cards.count();
    const needed = Math.max(0, 100 - currentCardCount);

    if (needed > 0) {
      const newCards: Omit<Card, 'id'>[] = [];
      for (let i = 0; i < needed; i++) {
        const isMature = i < 15;
        newCards.push({
          deckId: deck.id,
          type: 'multiple_choice',
          question: `Mastery Challenge Card #${currentCardCount + i + 1}`,
          answer: 'Optimal Retention',
          options: ['Optimal Retention', 'Passive Review', 'Cramming', 'Ignoring'],
          explanation: 'Active recall spaced over time yields highest neural retention.',
          state: isMature ? 2 : 1, // 2 = mature
          due: new Date(now.getTime() - 86400000),
          reps: isMature ? 5 : 1,
          difficulty: 0.3,
          stability: 15.0,
          createdAt: now,
        });
      }
      await db.cards.bulkAdd(newCards as Card[]);
    }

    // Ensure at least 15 cards have mature state (state 2) and 5 reps each (15 * 5 = 75 total reviews)
    let matureUpdated = 0;
    await db.cards.toCollection().modify((card) => {
      if (matureUpdated < 15) {
        card.state = 2; // mature (unlocks Perfect Recall >= 10)
        card.reps = 5; // 75 reviews (unlocks Memory Architect >= 50 and Speed Demon >= 3 quizzes)
        matureUpdated++;
      }
    });

    const updatedTotal = await db.cards.count();
    await db.decks.update(deck.id, { cardCount: updatedTotal });
  }
}
