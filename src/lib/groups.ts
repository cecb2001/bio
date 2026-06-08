"use client";

import { useEffect, useMemo, useState } from "react";
import type { Group } from "@/lib/topic-types";

// v2 introduces topicId on every group. v1 (untyped) is wiped on first load.
const STORAGE_KEY = "bio:groups:v2";
const LEGACY_KEYS = ["bio:groups:v1"];
const STORAGE_EVENT = "bio:groups:changed";

function readGroups(): Group[] {
  if (typeof window === "undefined") return [];
  try {
    for (const k of LEGACY_KEYS) {
      if (window.localStorage.getItem(k)) {
        window.localStorage.removeItem(k);
      }
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isGroup);
  } catch {
    return [];
  }
}

function writeGroups(groups: Group[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function isGroup(value: unknown): value is Group {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.topicId === "string" &&
    typeof v.name === "string" &&
    Array.isArray(v.cardIds) &&
    v.cardIds.every((id) => typeof id === "string") &&
    typeof v.createdAt === "number" &&
    typeof v.updatedAt === "number"
  );
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `g_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function createGroup(
  topicId: string,
  name: string,
  cardIds: string[],
): Group {
  const now = Date.now();
  const group: Group = {
    id: generateId(),
    topicId,
    name: name.trim() || "Untitled group",
    cardIds: [...new Set(cardIds)],
    createdAt: now,
    updatedAt: now,
  };
  writeGroups([...readGroups(), group]);
  return group;
}

export function updateGroup(
  id: string,
  patch: { name?: string; cardIds?: string[] },
): Group | null {
  const groups = readGroups();
  const idx = groups.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  const next: Group = {
    ...groups[idx],
    ...(patch.name !== undefined
      ? { name: patch.name.trim() || groups[idx].name }
      : {}),
    ...(patch.cardIds !== undefined
      ? { cardIds: [...new Set(patch.cardIds)] }
      : {}),
    updatedAt: Date.now(),
  };
  groups[idx] = next;
  writeGroups(groups);
  return next;
}

export function deleteGroup(id: string): void {
  writeGroups(readGroups().filter((g) => g.id !== id));
}

export function getGroup(id: string): Group | null {
  return readGroups().find((g) => g.id === id) ?? null;
}

/** SSR-safe hook for all groups across all topics. */
export function useGroups(): { groups: Group[]; hydrated: boolean } {
  const [groups, setGroups] = useState<Group[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setGroups(readGroups());
    setHydrated(true);
    const sync = () => setGroups(readGroups());
    window.addEventListener(STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { groups, hydrated };
}

/** Groups filtered to a specific topic. */
export function useGroupsForTopic(topicId: string | null): {
  groups: Group[];
  hydrated: boolean;
} {
  const { groups, hydrated } = useGroups();
  const filtered = useMemo(
    () => (topicId ? groups.filter((g) => g.topicId === topicId) : []),
    [groups, topicId],
  );
  return { groups: filtered, hydrated };
}

export function useGroup(id: string | null): {
  group: Group | null;
  hydrated: boolean;
} {
  const { groups, hydrated } = useGroups();
  return {
    group: id ? groups.find((g) => g.id === id) ?? null : null,
    hydrated,
  };
}
