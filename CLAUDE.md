# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project overview

`bio` is a personal study app for fetal pig dissection. The single-page UI is a flashcard deck (study + quiz modes) backed by an in-memory dataset of anatomy terms; a `/materials` route links to the source PDF served from `public/`.

The PDF source material lives at `public/study-materials/pig-dissection.pdf` and is the authority for any new card content. When asked to add or correct cards, treat the PDF as ground truth — do not invent anatomy.

## Stack

- **Next.js 16** (App Router, Turbopack enabled by default — see warning below)
- **React 19**
- **TypeScript 5** (strict)
- **Tailwind CSS v4** (PostCSS-based, no `tailwind.config.*` — config is inline in `src/app/globals.css` via `@theme`)
- **ESLint 9** (`eslint-config-next`)
- No test framework yet, no database, no auth

### Next.js 16 — read the bundled docs first

`AGENTS.md` notes that Next.js 16 has breaking changes from training-data assumptions. Before writing routing, caching, server-action, or middleware code, read the relevant guide in `node_modules/next/dist/docs/`. Don't rely on memorized App Router patterns from older versions.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (Turbopack, default port 3000) |
| Production build + typecheck | `npm run build` |
| Start prod build | `npm start` |
| Lint | `npm run lint` |
| Lint single file | `npx eslint src/path/to/file.tsx` |

There is no test runner configured. If you add tests, prefer Vitest + Testing Library and document the run command here.

## Architecture

```
src/
├── app/
│   ├── layout.tsx                # Root layout, fonts, metadata
│   ├── page.tsx                  # Home — picker + active deck
│   ├── globals.css               # Tailwind v4 entry + theme tokens
│   ├── groups/
│   │   ├── page.tsx              # Saved groups list
│   │   ├── new/page.tsx          # Create group
│   │   └── [id]/page.tsx         # Edit/delete group
│   └── materials/
│       └── page.tsx              # Lists source PDFs from public/study-materials/
├── components/
│   ├── flashcard-deck.tsx        # "use client" — study/quiz/shuffle UI; takes cards directly
│   ├── group-editor.tsx          # Create/edit form: name + searchable card checkboxes
│   ├── group-list.tsx            # Saved-group list rendering
│   ├── group-picker.tsx          # Active-deck dropdown on home (drives ?group= param)
│   └── home-deck.tsx             # Reads ?group= and resolves the deck for FlashcardDeck
├── data/
│   └── decks.ts                  # Generated; Card[] + pigAnatomyDeck (200 cards)
└── lib/
    └── groups.ts                 # localStorage-backed group store + hooks
public/
└── study-materials/
    └── pig-dissection.pdf        # Served at /study-materials/pig-dissection.pdf
```

### Server vs. client boundary

Pages under `src/app/**` are server components by default; interactive logic lives in client components under `src/components/`. The home page (`src/app/page.tsx`) is a server component that wraps client components (`GroupPicker`, `HomeDeck`) in `<Suspense>` boundaries — required because they call `useSearchParams`, which forces the page out of static generation otherwise. When adding interactivity, extend an existing client component rather than converting a page.

### Groups (localStorage)

Saved card groups live in `localStorage` under the key `bio:groups:v1`. There is no backend, no auth, no sync across devices. The store is encapsulated in `src/lib/groups.ts`:

- `Group = { id, name, cardIds: string[], createdAt, updatedAt }`
- CRUD: `createGroup`, `updateGroup`, `deleteGroup`, `getGroup`
- React hooks: `useGroups()` (all), `useGroup(id)` (single) — both SSR-safe (return empty / null until hydrated)
- Cross-tab sync: writes dispatch a `bio:groups:changed` event AND the native `storage` event fires for other tabs; both hooks listen to both.

The active group on the home page is selected via the `?group=<id>` URL search param, kept in URL for back/forward and link sharing within the same browser. If the group id is unknown (e.g. cleared cache), `HomeDeck` shows a "group not found" empty state.

If the deck is regenerated and a card id changes, groups silently drop the missing ids — `HomeDeck` shows "(N missing)" in the description so you notice.

### Data flow

`src/data/decks.ts` is **generated** from `public/study-materials/pig-dissection.pdf` by `scripts/parse-pdf.py`. Do NOT hand-edit `decks.ts`; corrections belong in the PDF (or in the parser if the issue is structural). To regenerate:

```bash
pdftotext -bbox-layout public/study-materials/pig-dissection.pdf /tmp/bbox.html
python3 scripts/parse-pdf.py /tmp/bbox.html src/data/decks.ts
```

The parser uses `defusedxml` for safe XML parsing and works at the **word** level (not block level) — words are grouped into rows by y-coordinate and then split into term column / definition column by xMin (threshold = 185pt). This handles the two structural quirks in this Quizlet PDF: (a) 3-digit numbered cards collapse number+term into one block, and (b) wide terms like `tensor fascia lata` push individual words past the visual term column. If the PDF layout changes, expect to re-tune `DEF_COLUMN_X` in `scripts/parse-pdf.py`.

To add a new deck from a *different* PDF: extend the parser to take a deck id/title via CLI args, or write a sibling script — don't manually author `decks.ts`.

## Conventions

- **File names**: lowercase kebab-case for components and routes (`flashcard-deck.tsx`, `materials/page.tsx`). Match Next.js conventions for special files (`page.tsx`, `layout.tsx`).
- **Component exports**: prefer named exports for non-page components; pages must default-export.
- **Tailwind**: design tokens live in `src/app/globals.css` under `@theme`. Use the existing zinc/emerald/red palette already in the deck component before introducing new colors.
- **No barrel files** in `src/components` or `src/data` — import directly.

## Out of scope (do not add without asking)

- Auth, database, server actions
- AI integrations (Vercel AI SDK is **not** wired up yet)
- A separate API layer — data is static and shipped with the bundle on purpose
- A test framework — confirm with the user before installing Vitest/Jest
