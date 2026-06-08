"use client";

import Link from "next/link";
import { pigAnatomyDeck } from "@/data/decks";
import { useGroups } from "@/lib/groups";

export function GroupList() {
  const { groups, hydrated } = useGroups();
  const totalCards = pigAnatomyDeck.cards.length;

  if (!hydrated) {
    return (
      <p className="text-sm text-zinc-500">Loading saved groups…</p>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No groups yet. Create one to study a focused subset of the {totalCards} cards.
        </p>
        <Link
          href="/groups/new"
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create your first group
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {groups
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((g) => (
          <li
            key={g.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{g.name}</p>
              <p className="text-xs text-zinc-500">
                {g.cardIds.length}{" "}
                {g.cardIds.length === 1 ? "card" : "cards"} · updated{" "}
                {new Date(g.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/?group=${encodeURIComponent(g.id)}`}
                className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Study
              </Link>
              <Link
                href={`/groups/${encodeURIComponent(g.id)}`}
                className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                Edit
              </Link>
            </div>
          </li>
        ))}
    </ul>
  );
}
