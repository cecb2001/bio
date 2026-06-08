"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { pigAnatomyDeck } from "@/data/decks";
import { useGroups } from "@/lib/groups";

export function GroupPicker() {
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get("group");
  const { groups, hydrated } = useGroups();

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("group", value);
    else next.delete("group");
    const qs = next.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="flex w-full items-center justify-between gap-3 text-sm">
      <label className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0 text-xs uppercase tracking-widest text-zinc-500">
          Deck
        </span>
        <select
          value={activeId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={!hydrated}
          className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        >
          <option value="">
            All cards ({pigAnatomyDeck.cards.length})
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.cardIds.length})
            </option>
          ))}
        </select>
      </label>
      <Link
        href="/groups"
        className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Manage groups
      </Link>
    </div>
  );
}
