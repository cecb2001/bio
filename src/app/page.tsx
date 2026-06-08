import Link from "next/link";
import { FlashcardDeck } from "@/components/flashcard-deck";
import { pigAnatomyDeck } from "@/data/decks";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center gap-10 px-6 py-16 sm:px-10">
        <nav className="flex w-full items-center justify-between text-sm">
          <span className="font-semibold tracking-tight">bio · study</span>
          <Link
            href="/materials"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Study materials →
          </Link>
        </nav>
        <FlashcardDeck deck={pigAnatomyDeck} />
      </main>
    </div>
  );
}
