/**
 * Shared types for topics, cards, and groups.
 *
 * Kept separate from the generated decks.ts so the parser only needs to emit
 * data, not redeclare types every time it runs.
 */

export type Card = {
  id: string;
  front: string;
  back: string;
  image?: string;
  hint?: string;
};

export type Topic = {
  id: string;
  name: string;
  description: string;
  cards: Card[];
  /** True for topics shipped in code; false/undefined for user-uploaded topics. */
  builtin?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Group = {
  id: string;
  topicId: string;
  name: string;
  cardIds: string[];
  createdAt: number;
  updatedAt: number;
};
