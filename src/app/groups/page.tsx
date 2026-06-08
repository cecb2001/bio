import Link from "next/link";
import { GroupList } from "@/components/group-list";

export default function GroupsPage() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10">
        <nav className="flex items-center justify-between text-sm">
          <Link
            href="/"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to flashcards
          </Link>
          <Link
            href="/groups/new"
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + New group
          </Link>
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Saved groups
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Pick a focused subset of cards to study and shuffle through. Groups
            are stored in this browser only.
          </p>
        </header>

        <GroupList />
      </main>
    </div>
  );
}
