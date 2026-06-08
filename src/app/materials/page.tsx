import Link from "next/link";

const materials = [
  {
    href: "/study-materials/pig-dissection.pdf",
    title: "Fetal pig dissection",
    description: "Lab guide PDF — anatomy, procedures, and reference diagrams.",
  },
];

export default function MaterialsPage() {
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
        </nav>

        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Study materials
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Source documents that back the flashcard deck.
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {materials.map((m) => (
            <li key={m.href}>
              <a
                href={m.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <p className="text-base font-medium">{m.title}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {m.description}
                </p>
                <p className="mt-3 text-xs uppercase tracking-widest text-zinc-400">
                  Open PDF →
                </p>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
