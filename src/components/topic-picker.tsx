"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTopics } from "@/lib/topics";

export function TopicPicker({ activeTopicId }: { activeTopicId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { topics, hydrated } = useTopics();

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("topic", value);
    else next.delete("topic");
    next.delete("group"); // selecting a new topic always clears the group filter
    const qs = next.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="flex w-full items-center justify-between gap-3 text-sm">
      <label className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0 text-xs uppercase tracking-widest text-zinc-500">
          Topic
        </span>
        <select
          value={activeTopicId}
          onChange={(e) => onChange(e.target.value)}
          disabled={!hydrated}
          className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.cards.length})
            </option>
          ))}
        </select>
      </label>
      <Link
        href="/topics"
        className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Manage topics
      </Link>
    </div>
  );
}
