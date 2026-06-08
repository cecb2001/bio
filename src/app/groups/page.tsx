"use client";

import Link from "next/link";
import { use } from "react";
import { GroupList } from "@/components/group-list";
import { builtinTopics } from "@/data/decks";
import { useTopic } from "@/lib/topics";

export default function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const params = use(searchParams);
  const topicId = params.topic ?? builtinTopics[0]?.id ?? "";
  const { topic, hydrated } = useTopic(topicId);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10">
        <nav className="flex items-center justify-between text-sm">
          <Link
            href={`/?topic=${encodeURIComponent(topicId)}`}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to flashcards
          </Link>
          {topic ? (
            <Link
              href={`/groups/new?topic=${encodeURIComponent(topic.id)}`}
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              + New group
            </Link>
          ) : null}
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Saved groups
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {topic
              ? `Groups in ${topic.name}. Stored in this browser only.`
              : "Pick a topic to see its groups."}
          </p>
        </header>

        {!hydrated ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : !topic ? (
          <p className="text-sm text-zinc-500">
            Topic not found. <Link href="/topics" className="underline">Pick another</Link>.
          </p>
        ) : (
          <GroupList topic={topic} />
        )}
      </main>
    </div>
  );
}
