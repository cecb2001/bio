"use client";

import { useMemo, useState } from "react";
import type { Card, Deck } from "@/data/decks";

type Mode = "study" | "quiz";

type QuizState = {
  remaining: Card[];
  current: Card | null;
  correct: number;
  attempted: number;
};

function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuizState(cards: readonly Card[]): QuizState {
  const [first, ...rest] = shuffle(cards);
  return {
    remaining: rest,
    current: first ?? null,
    correct: 0,
    attempted: 0,
  };
}

export function FlashcardDeck({ deck }: { deck: Deck }) {
  const [mode, setMode] = useState<Mode>("study");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>(() => buildQuizState(deck.cards));
  const [revealed, setRevealed] = useState(false);

  const card = deck.cards[index];
  const total = deck.cards.length;

  const progressLabel = useMemo(() => {
    if (mode === "study") return `Card ${index + 1} of ${total}`;
    if (!quiz.current) return `Quiz complete — ${quiz.correct}/${quiz.attempted}`;
    return `Quiz: ${quiz.attempted + 1} of ${total} · score ${quiz.correct}/${quiz.attempted}`;
  }, [mode, index, total, quiz]);

  function next() {
    setFlipped(false);
    setIndex((i) => (i + 1) % total);
  }

  function prev() {
    setFlipped(false);
    setIndex((i) => (i - 1 + total) % total);
  }

  function answer(correct: boolean) {
    setQuiz((q) => {
      const attempted = q.attempted + 1;
      const correctCount = q.correct + (correct ? 1 : 0);
      const [nextCard, ...rest] = q.remaining;
      return {
        remaining: rest,
        current: nextCard ?? null,
        correct: correctCount,
        attempted,
      };
    });
    setRevealed(false);
  }

  function restartQuiz() {
    setQuiz(buildQuizState(deck.cards));
    setRevealed(false);
  }

  return (
    <section className="w-full max-w-2xl flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{deck.title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {deck.description}
          </p>
        </div>
        <div className="flex rounded-full border border-zinc-200 bg-white p-1 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setMode("study")}
            className={`px-3 py-1 rounded-full transition ${
              mode === "study"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Study
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("quiz");
              restartQuiz();
            }}
            className={`px-3 py-1 rounded-full transition ${
              mode === "quiz"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Quiz
          </button>
        </div>
      </header>

      <p className="text-xs uppercase tracking-widest text-zinc-500">
        {progressLabel}
      </p>

      {mode === "study" && card ? (
        <StudyView
          card={card}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          onNext={next}
          onPrev={prev}
        />
      ) : null}

      {mode === "quiz" ? (
        <QuizView
          state={quiz}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onAnswer={answer}
          onRestart={restartQuiz}
        />
      ) : null}
    </section>
  );
}

function StudyView({
  card,
  flipped,
  onFlip,
  onNext,
  onPrev,
}: {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onFlip}
        aria-label={flipped ? "Show term" : "Show definition"}
        className="group relative h-64 w-full rounded-2xl border border-zinc-200 bg-white p-8 text-left shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <span className="absolute right-4 top-4 text-xs uppercase tracking-widest text-zinc-400">
          {flipped ? "Definition" : "Term"} · click to flip
        </span>
        <div className="flex h-full items-center justify-center text-center">
          {flipped ? (
            <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-200">
              {card.back}
            </p>
          ) : (
            <p className="text-3xl font-semibold tracking-tight">{card.front}</p>
          )}
        </div>
        {!flipped && card.hint ? (
          <span className="absolute bottom-4 left-8 text-xs italic text-zinc-400">
            hint: {card.hint}
          </span>
        ) : null}
      </button>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function QuizView({
  state,
  revealed,
  onReveal,
  onAnswer,
  onRestart,
}: {
  state: QuizState;
  revealed: boolean;
  onReveal: () => void;
  onAnswer: (correct: boolean) => void;
  onRestart: () => void;
}) {
  if (!state.current) {
    const accuracy =
      state.attempted === 0
        ? 0
        : Math.round((state.correct / state.attempted) * 100);
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">Quiz complete</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {state.correct} correct out of {state.attempted} ({accuracy}%)
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Restart quiz
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs uppercase tracking-widest text-zinc-400">Term</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {state.current.front}
        </p>
        {revealed ? (
          <p className="mt-6 border-t border-zinc-200 pt-4 leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
            {state.current.back}
          </p>
        ) : null}
      </div>

      {revealed ? (
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={() => onAnswer(false)}
            className="flex-1 rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
          >
            Got it wrong
          </button>
          <button
            type="button"
            onClick={() => onAnswer(true)}
            className="flex-1 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
          >
            Got it right
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onReveal}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Reveal answer
        </button>
      )}
    </div>
  );
}
