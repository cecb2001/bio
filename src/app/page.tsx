import Link from "next/link";
import { Suspense } from "react";
import { GroupPicker } from "@/components/group-picker";
import { HomeDeck } from "@/components/home-deck";
import { TopicPicker } from "@/components/topic-picker";
import { builtinTopics } from "@/data/decks";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const params = await searchParams;
  const topicId = params.topic ?? builtinTopics[0]?.id ?? "";

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center gap-6 px-6 py-12 sm:px-10">
        <nav className="flex w-full items-center justify-between text-sm">
          <span className="font-semibold tracking-tight">bio · study</span>
          <Link
            href="/materials"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Study materials →
          </Link>
        </nav>
        <Suspense fallback={null}>
          <TopicPicker activeTopicId={topicId} />
        </Suspense>
        <Suspense fallback={null}>
          <GroupPicker topicId={topicId} />
        </Suspense>
        <Suspense fallback={null}>
          <HomeDeck topicId={topicId} />
        </Suspense>
      </main>
    </div>
  );
}
