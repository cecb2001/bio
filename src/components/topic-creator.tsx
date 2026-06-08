"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createTopic } from "@/lib/topics";
import type { Card } from "@/lib/topic-types";

type Separator = "tab" | "comma" | "dash" | "custom";

const SEP_LABELS: Record<Separator, string> = {
  tab: "Tab",
  comma: ",",
  dash: " — ",
  custom: "Custom…",
};

function separatorRegex(sep: Separator, custom: string): RegExp {
  switch (sep) {
    case "tab":
      return /\t+/;
    case "comma":
      return /,\s*/;
    case "dash":
      return /\s*[-–—]\s+/;
    case "custom":
      // Treat as a literal (escaped) string.
      return new RegExp(custom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  }
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "card"
  );
}

function parsePastedCards(
  text: string,
  separator: RegExp,
): { cards: Card[]; errors: string[] } {
  const errors: string[] = [];
  const cards: Card[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line) return;
    const parts = line.split(separator);
    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: no separator found.`);
      return;
    }
    const front = parts[0].trim();
    const back = parts.slice(1).join(" ").trim();
    if (!front || !back) {
      errors.push(`Line ${i + 1}: empty term or definition.`);
      return;
    }
    cards.push({ id: slugify(front).slice(0, 60), front, back });
  });
  return { cards, errors };
}

export function TopicCreator() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [separator, setSeparator] = useState<Separator>("tab");
  const [customSep, setCustomSep] = useState("");
  const [text, setText] = useState("");

  const sepRe = useMemo(
    () => separatorRegex(separator, customSep),
    [separator, customSep],
  );
  const { cards, errors } = useMemo(
    () => parsePastedCards(text, sepRe),
    [text, sepRe],
  );

  function save() {
    if (!name.trim()) {
      alert("Give the topic a name.");
      return;
    }
    if (cards.length === 0) {
      alert("Paste at least one card.");
      return;
    }
    const topic = createTopic({
      name,
      description,
      cards,
    });
    router.push(`/?topic=${encodeURIComponent(topic.id)}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/topics"
          className="self-start text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← All topics
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New topic</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Paste term/definition pairs, one card per line. PDF upload with
          images is coming next; for now this is text only.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-widest text-zinc-500">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Cell biology"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-base outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-widest text-zinc-500">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short note about this topic"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-widest text-zinc-500">
            Cards (paste below)
          </label>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Separator:</span>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value as Separator)}
              className="rounded-full border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {(Object.keys(SEP_LABELS) as Separator[]).map((s) => (
                <option key={s} value={s}>
                  {SEP_LABELS[s]}
                </option>
              ))}
            </select>
            {separator === "custom" ? (
              <input
                type="text"
                value={customSep}
                onChange={(e) => setCustomSep(e.target.value)}
                placeholder="e.g. ;"
                className="w-20 rounded-full border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900"
              />
            ) : null}
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder={
            separator === "tab"
              ? "term1\\tdefinition1\nterm2\\tdefinition2"
              : `term1${SEP_LABELS[separator]}definition1\nterm2${SEP_LABELS[separator]}definition2`
          }
          className="font-mono rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            {cards.length} {cards.length === 1 ? "card" : "cards"} parsed
          </span>
          {errors.length > 0 ? (
            <span className="text-amber-600 dark:text-amber-400">
              {errors.length} line{errors.length === 1 ? "" : "s"} skipped
            </span>
          ) : null}
        </div>
        {errors.length > 0 ? (
          <ul className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            {errors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {errors.length > 5 ? (
              <li>… and {errors.length - 5} more.</li>
            ) : null}
          </ul>
        ) : null}
        {cards.length > 0 ? (
          <details className="rounded-xl border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer text-zinc-500">
              Preview parsed cards
            </summary>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {cards.slice(0, 30).map((c) => (
                <li key={c.id} className="truncate">
                  <span className="font-medium">{c.front}</span>
                  <span className="text-zinc-500"> — {c.back}</span>
                </li>
              ))}
              {cards.length > 30 ? (
                <li className="text-zinc-400">… and {cards.length - 30} more</li>
              ) : null}
            </ul>
          </details>
        ) : null}
      </div>

      <div className="flex justify-end gap-2">
        <Link
          href="/topics"
          className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={save}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create topic
        </button>
      </div>
    </div>
  );
}
