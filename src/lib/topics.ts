"use client";

import { useEffect, useMemo, useState } from "react";
import { builtinTopics } from "@/data/decks";
import type { Card, Topic } from "@/lib/topic-types";

const STORAGE_KEY = "bio:topics:v1";
const STORAGE_EVENT = "bio:topics:changed";

const builtinIds = new Set(builtinTopics.map((t) => t.id));

function readUserTopics(): Topic[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTopic);
  } catch {
    return [];
  }
}

function writeUserTopics(topics: Topic[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function isTopic(value: unknown): value is Topic {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.description === "string" &&
    Array.isArray(v.cards) &&
    typeof v.createdAt === "number" &&
    typeof v.updatedAt === "number"
  );
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "card"
  );
}

function dedupeIds(cards: Card[]): Card[] {
  const seen = new Set<string>();
  return cards.map((c) => {
    let id = c.id || slugify(c.front).slice(0, 60);
    let suffix = 2;
    while (seen.has(id)) {
      id = `${c.id || slugify(c.front).slice(0, 60)}-${suffix++}`;
    }
    seen.add(id);
    return { ...c, id };
  });
}

export function createTopic(input: {
  name: string;
  description?: string;
  cards: Card[];
}): Topic {
  const trimmedName = input.name.trim() || "Untitled topic";
  if (builtinIds.has(slugify(trimmedName))) {
    // Don't let users shadow a builtin id.
  }
  const now = Date.now();
  const topic: Topic = {
    id: generateId(),
    name: trimmedName,
    description: (input.description ?? "").trim(),
    cards: dedupeIds(input.cards),
    createdAt: now,
    updatedAt: now,
  };
  writeUserTopics([...readUserTopics(), topic]);
  return topic;
}

export function updateTopic(
  id: string,
  patch: { name?: string; description?: string; cards?: Card[] },
): Topic | null {
  if (builtinIds.has(id)) return null;
  const topics = readUserTopics();
  const idx = topics.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const next: Topic = {
    ...topics[idx],
    ...(patch.name !== undefined
      ? { name: patch.name.trim() || topics[idx].name }
      : {}),
    ...(patch.description !== undefined
      ? { description: patch.description.trim() }
      : {}),
    ...(patch.cards !== undefined ? { cards: dedupeIds(patch.cards) } : {}),
    updatedAt: Date.now(),
  };
  topics[idx] = next;
  writeUserTopics(topics);
  return next;
}

export function deleteTopic(id: string): boolean {
  if (builtinIds.has(id)) return false;
  writeUserTopics(readUserTopics().filter((t) => t.id !== id));
  return true;
}

/** Returns a topic by id, searching builtin then user topics. */
export function getTopic(id: string): Topic | null {
  return (
    builtinTopics.find((t) => t.id === id) ??
    readUserTopics().find((t) => t.id === id) ??
    null
  );
}

/** Resolves a card within a topic by id. */
export function getCardInTopic(
  topic: Topic | null,
  cardId: string,
): Card | null {
  if (!topic) return null;
  return topic.cards.find((c) => c.id === cardId) ?? null;
}

/** SSR-safe hook listing all topics (builtin first, then user-created newest first). */
export function useTopics(): { topics: Topic[]; hydrated: boolean } {
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUserTopics(readUserTopics());
    setHydrated(true);
    const sync = () => setUserTopics(readUserTopics());
    window.addEventListener(STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const topics = useMemo(() => {
    const sortedUser = [...userTopics].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    return [...builtinTopics, ...sortedUser];
  }, [userTopics]);

  return { topics, hydrated };
}

export function useTopic(id: string | null): {
  topic: Topic | null;
  hydrated: boolean;
} {
  const { topics, hydrated } = useTopics();
  return {
    topic: id ? topics.find((t) => t.id === id) ?? null : null,
    hydrated,
  };
}

export function isBuiltin(topicId: string): boolean {
  return builtinIds.has(topicId);
}
