"use client";

import Link from "next/link";
import { use } from "react";
import { GroupEditor } from "@/components/group-editor";
import { builtinTopics } from "@/data/decks";
import { useTopic } from "@/lib/topics";

export default function NewGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const params = use(searchParams);
  const topicId = params.topic ?? builtinTopics[0]?.id ?? "";
  const { topic, hydrated } = useTopic(topicId);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 px-6 py-16 sm:px-10">
        {!hydrated ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : !topic ? (
          <div className="flex flex-col items-start gap-4">
            <Link
              href="/topics"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ← Topics
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              Topic not found
            </h1>
          </div>
        ) : (
          <GroupEditor mode={{ kind: "create", topic }} />
        )}
      </main>
    </div>
  );
}
