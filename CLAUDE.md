# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project overview

`bio` is a personal study app for fetal pig dissection (and, soon, any topic the user uploads). The data model is a three-level hierarchy: **Topic → Group → Card**.

- A **topic** owns a set of cards. The **Pig Dissection** topic is "builtin" — generated from `public/study-materials/pig-dissection.pdf` by `scripts/parse-pdf.py` and shipped in `src/data/decks.ts`.
- User-created topics live in `localStorage` (no backend) and currently come from pasted text term/definition pairs. PDF upload with images is the next planned step (see PHASE 2 below).
- A **group** is a saved subset of one topic's cards. Groups are also localStorage-only and reference cards by id within a single topic.

The pig dissection PDF source material is the authority for any new card content in that topic. When asked to add or correct pig-anatomy cards, treat the PDF as ground truth — do not invent anatomy.

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
│   ├── page.tsx                  # Home — topic + group pickers, active deck
│   ├── globals.css               # Tailwind v4 entry + theme tokens
│   ├── topics/
│   │   ├── page.tsx              # All topics list (builtin + user)
│   │   └── new/page.tsx          # Create topic (paste term/definition lines)
│   ├── groups/
│   │   ├── page.tsx              # Groups in active topic (?topic=)
│   │   ├── new/page.tsx          # Create group in topic (?topic=)
│   │   └── [id]/page.tsx         # Edit/delete group (topic resolved from group)
│   └── materials/
│       └── page.tsx              # Lists source PDFs from public/study-materials/
├── components/
│   ├── flashcard-deck.tsx        # "use client" — study/quiz/shuffle UI; takes cards directly
│   ├── group-editor.tsx          # Create/edit form: name + searchable card checkboxes
│   ├── group-list.tsx            # Saved-group list (topic-scoped)
│   ├── group-picker.tsx          # Active-group dropdown (drives ?group= param)
│   ├── home-deck.tsx             # Resolves topic + group from URL → FlashcardDeck
│   ├── topic-creator.tsx         # Paste-TSV form (Phase 1 topic upload)
│   ├── topic-list.tsx            # Topic management list
│   └── topic-picker.tsx          # Active-topic dropdown (drives ?topic= param)
├── data/
│   └── decks.ts                  # Generated; pigAnatomyTopic (200 cards) + builtinTopics
└── lib/
    ├── topic-types.ts            # Card / Topic / Group types (shared)
    ├── topics.ts                 # localStorage user-topic store + hooks
    └── groups.ts                 # localStorage group store + hooks (topicId-scoped, key v2)
public/
└── study-materials/
    ├── pig-dissection.pdf        # Source PDF
    └── images/                   # Per-card images extracted from the PDF
```

## Phase 2 (planned) — PDF upload

User can upload a Quizlet-style PDF and have it parsed server-side into a new topic. Implementation will add:
- `api/parse-pdf` Vercel Python function running PyMuPDF (no `pdftotext` dep — Vercel functions don't ship poppler)
- Vercel Blob storage for per-card images (`BLOB_READ_WRITE_TOKEN` env var)
- File-upload variant of `topic-creator.tsx` that posts to the function and stores the returned topic in localStorage

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

`src/data/decks.ts` is **generated** from `public/study-materials/pig-dissection.pdf` by `scripts/parse-pdf.py`, which writes one `Topic` literal (the builtin pig dissection topic). Do NOT hand-edit `decks.ts`; corrections belong in the PDF (or in the parser if the issue is structural). To regenerate:

```bash
pdftotext -bbox-layout public/study-materials/pig-dissection.pdf /tmp/bbox.html
python3 scripts/parse-pdf.py /tmp/bbox.html public/study-materials/pig-dissection.pdf src/data/decks.ts
```

The parser uses `defusedxml` for safe XML parsing of `pdftotext -bbox-layout` output, plus PyMuPDF for image extraction (deduped by xref) and image-to-card matching (image `yMin` falls between an entry's `yMin` and the next entry's `yMin`; spillover images at the top of a page belong to the last entry on the previous page). Text parsing works at the **word** level — words are grouped into rows by y-coordinate and split into term/definition columns by `xMin >= 185`. This handles two structural quirks in the Quizlet PDF: (a) 3-digit numbered cards collapse number+term into one block, and (b) wide terms like `tensor fascia lata` push individual words past the visual term column.

To add a new builtin topic from a *different* PDF: extend the parser to take a topic id/name via CLI args, or write a sibling script — don't manually author `decks.ts`. For *user-created* topics see "Topics & groups (localStorage)" below.

### Topics & groups (localStorage)

User-created topics live in `localStorage` under `bio:topics:v1`; groups under `bio:groups:v2`. The store modules (`src/lib/topics.ts`, `src/lib/groups.ts`) expose CRUD functions plus React hooks (`useTopics`, `useTopic`, `useGroups`, `useGroup`, `useGroupsForTopic`). Builtin topics are NOT stored — they come from `builtinTopics` in `src/data/decks.ts` and are merged into `useTopics()` results so the UI sees one combined list.

URL contract:
- Active topic: `?topic=<topicId>` on most pages (defaults to the first builtin topic when missing).
- Active group: `?group=<groupId>` on the home page (scoped to the active topic).
- Switching topic clears the group filter automatically.

If the deck is regenerated and a card id changes, groups silently drop the missing ids — the home page shows "(N missing)" in the description so you notice.

Storage keys are versioned (`v1`, `v2`). Bumping the version intentionally wipes earlier data (`groups:v1` is removed on first read of `groups:v2`).

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
