"use client";

import Link from "next/link";
import { deleteTopic, isBuiltin, useTopics } from "@/lib/topics";

export function TopicList() {
  const { topics, hydrated } = useTopics();

  if (!hydrated) {
    return <p className="text-sm text-zinc-500">Loading topics…</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {topics.map((t) => {
        const builtin = isBuiltin(t.id);
        return (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {t.name}
                {builtin ? (
                  <span className="ml-2 rounded-full border border-zinc-200 px-2 py-0.5 text-xs uppercase tracking-widest text-zinc-500 dark:border-zinc-700">
                    builtin
                  </span>
                ) : null}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {t.cards.length} {t.cards.length === 1 ? "card" : "cards"}
                {t.description ? ` · ${t.description}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/?topic=${encodeURIComponent(t.id)}`}
                className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Study
              </Link>
              {builtin ? null : (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete topic "${t.name}" and all its groups? This cannot be undone.`,
                      )
                    ) {
                      deleteTopic(t.id);
                    }
                  }}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
