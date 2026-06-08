"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { pigAnatomyDeck } from "@/data/decks";
import {
  createGroup,
  deleteGroup,
  type Group,
  updateGroup,
} from "@/lib/groups";

type Mode = { kind: "create" } | { kind: "edit"; group: Group };

export function GroupEditor({ mode }: { mode: Mode }) {
  const router = useRouter();
  const initial = mode.kind === "edit" ? mode.group : null;
  const [name, setName] = useState(initial?.name ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial?.cardIds ?? []),
  );
  const [query, setQuery] = useState("");

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pigAnatomyDeck.cards;
    return pigAnatomyDeck.cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q),
    );
  }, [query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of filteredCards) next.add(c.id);
      return next;
    });
  }

  function clearAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of filteredCards) next.delete(c.id);
      return next;
    });
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Please give the group a name.");
      return;
    }
    if (selected.size === 0) {
      alert("Pick at least one card.");
      return;
    }
    const cardIds = pigAnatomyDeck.cards
      .filter((c) => selected.has(c.id))
      .map((c) => c.id);
    if (mode.kind === "create") {
      const g = createGroup(trimmed, cardIds);
      router.push(`/?group=${encodeURIComponent(g.id)}`);
    } else {
      updateGroup(mode.group.id, { name: trimmed, cardIds });
      router.push(`/?group=${encodeURIComponent(mode.group.id)}`);
    }
  }

  function remove() {
    if (mode.kind !== "edit") return;
    if (!confirm(`Delete group "${mode.group.name}"? This cannot be undone.`))
      return;
    deleteGroup(mode.group.id);
    router.push("/groups");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/groups"
          className="self-start text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← All groups
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode.kind === "create" ? "New group" : "Edit group"}
        </h1>
      </header>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="group-name"
          className="text-xs uppercase tracking-widest text-zinc-500"
        >
          Name
        </label>
        <input
          id="group-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lab exam 1 — muscles"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-base outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            {selected.size} of {pigAnatomyDeck.cards.length} cards selected
          </p>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={selectAllVisible}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Select all{query ? " visible" : ""}
            </button>
            <button
              type="button"
              onClick={clearAllVisible}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Clear{query ? " visible" : ""}
            </button>
          </div>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards…"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />
        <ul className="max-h-[60vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {filteredCards.length === 0 ? (
            <li className="p-6 text-center text-sm text-zinc-500">
              No cards match “{query}”.
            </li>
          ) : (
            filteredCards.map((card) => {
              const checked = selected.has(card.id);
              return (
                <li
                  key={card.id}
                  className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
                >
                  <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(card.id)}
                      className="mt-1 h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{card.front}</p>
                      <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {card.back.replace(/\n/g, " · ")}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {mode.kind === "edit" ? (
            <button
              type="button"
              onClick={remove}
              className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
            >
              Delete group
            </button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link
            href="/groups"
            className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {mode.kind === "create" ? "Create group" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
