import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chunkCardCount, parseGeneratedCards, generateCardsFromText, callGeminiGenerateContent } from './ai';

describe('AI Generation Utilities', () => {
  describe('chunkCardCount', () => {
    it('returns empty array for 0 or negative numbers', () => {
      expect(chunkCardCount(0)).toEqual([]);
      expect(chunkCardCount(-5)).toEqual([]);
    });

    it('returns single batch when count is <= 5', () => {
      expect(chunkCardCount(1)).toEqual([1]);
      expect(chunkCardCount(3)).toEqual([3]);
      expect(chunkCardCount(5)).toEqual([5]);
    });

    it('splits into 2 balanced batches for counts > 5 to avoid burst throttling', () => {
      expect(chunkCardCount(10)).toEqual([5, 5]);
      expect(chunkCardCount(15)).toEqual([8, 7]);
      expect(chunkCardCount(20)).toEqual([10, 10]);
    });
  });

  describe('parseGeneratedCards', () => {
    it('parses valid JSON array directly', () => {
      const raw = JSON.stringify([
        {
          question: 'What is mitochondria?',
          answer: 'Powerhouse of the cell',
          explanation: 'Generates cellular ATP.',
          type: 'flashcard',
        },
      ]);
      const result = parseGeneratedCards(raw);
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('What is mitochondria?');
    });

    it('parses wrapped in { cards: [...] }', () => {
      const raw = JSON.stringify({
        cards: [
          {
            question: 'Capital of France?',
            answer: 'Paris',
            explanation: 'Paris is the capital.',
            type: 'flashcard',
          },
        ],
      });
      const result = parseGeneratedCards(raw);
      expect(result).toHaveLength(1);
      expect(result[0].answer).toBe('Paris');
    });

    it('cleans markdown code fences and backticks', () => {
      const raw = '```json\n[{"question": "Q1", "answer": "A1", "explanation": "E1", "type": "flashcard"}]\n```';
      const result = parseGeneratedCards(raw);
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('Q1');
    });

    it('recovers from extra preamble or text surrounding JSON array', () => {
      const raw = 'Here are your cards:\n[{"question": "Q2", "answer": "A2", "explanation": "E2", "type": "flashcard"}]\nEnjoy studying!';
      const result = parseGeneratedCards(raw);
      expect(result).toHaveLength(1);
      expect(result[0].question).toBe('Q2');
    });

    it('returns empty array if unparseable', () => {
      expect(parseGeneratedCards('Sorry I cannot do that.')).toEqual([]);
    });
  });

  describe('Gemini 503 / 429 Fallback Handling', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('falls back to the next model when first model returns 503 high demand', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        // First model fails with 503
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            json: async () => ({ error: { message: 'This model is currently experiencing high demand.' } }),
          };
        }
        // Second model succeeds
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify([{ question: 'Fallback Q', answer: 'A', explanation: 'E', type: 'flashcard' }]) }],
                },
              },
            ],
          }),
        };
      });

      vi.stubGlobal('fetch', mockFetch);

      const result = await callGeminiGenerateContent('fake-key', 'Test prompt');
      expect(callCount).toBe(2);
      expect(result).toContain('Fallback Q');
    });
  });

  describe('Parallel Batching & Progressive Stream Callback', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('dispatches 2 balanced parallel requests and fires onProgress as batches complete', async () => {
      const mockFetch = vi.fn().mockImplementation(async () => {
        const cards = Array.from({ length: 5 }, (_, i) => ({
          question: `Question-${Math.random()}-${i}`,
          answer: `Answer-${i}`,
          explanation: 'Concise explanation under 15 words.',
          type: 'multiple_choice',
          options: [`Answer-${i}`, 'B', 'C', 'D'],
        }));

        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(cards) }],
                },
              },
            ],
          }),
        };
      });

      vi.stubGlobal('fetch', mockFetch);

      const progressEvents: number[] = [];
      const result = await generateCardsFromText({
        apiKey: 'test-key',
        provider: 'gemini',
        content: 'Photosynthesis occurs in chloroplasts.',
        count: 10,
        type: 'multiple_choice',
        onProgress: (p) => {
          progressEvents.push(p.newCards.length);
        },
      });

      // 10 cards split into 2 batches of 5 each, exactly satisfying count (no refill needed)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(progressEvents.length).toBe(2);
      expect(result.length).toBe(10);
    });

    it('triggers remainder refill if batches return fewer cards than requested', async () => {
      let callIndex = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callIndex++;
        // Batches 1 and 2 only return 3 cards each (total 6 of 10)
        // Refill call 3 returns remaining 4 cards
        const count = callIndex <= 2 ? 3 : 4;
        const cards = Array.from({ length: count }, (_, i) => ({
          question: `RefillQ-${callIndex}-${i}`,
          answer: `Ans-${i}`,
          explanation: 'Short explanation.',
          type: 'flashcard',
        }));

        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(cards) }],
                },
              },
            ],
          }),
        };
      });

      vi.stubGlobal('fetch', mockFetch);

      const result = await generateCardsFromText({
        apiKey: 'test-key',
        provider: 'gemini',
        content: 'Test content',
        count: 10,
        type: 'flashcard',
      });

      // 2 parallel batches + 1 refill pass = 3 calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.length).toBe(10);
    });

    it('aborts card generation immediately when AbortSignal is cancelled', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        generateCardsFromText({
          apiKey: 'test-key',
          provider: 'gemini',
          content: 'Test content',
          count: 10,
          type: 'flashcard',
          signal: controller.signal,
        })
      ).rejects.toThrow('Generation cancelled');
    });
  });
});
