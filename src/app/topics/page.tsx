import Link from "next/link";
import { TopicList } from "@/components/topic-list";

export default function TopicsPage() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10">
        <nav className="flex items-center justify-between text-sm">
          <Link
            href="/"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back
          </Link>
          <Link
            href="/topics/new"
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + New topic
          </Link>
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Topics</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Each topic has its own cards and groups. Builtin topics ship with
            the app; user-created topics live in this browser.
          </p>
        </header>

        <TopicList />
      </main>
    </div>
  );
}
