"use client";

import Link from "next/link";
import { use } from "react";
import { GroupEditor } from "@/components/group-editor";
import { useGroup } from "@/lib/groups";
import { useTopic } from "@/lib/topics";

export default function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { group, hydrated: groupHydrated } = useGroup(id);
  const { topic, hydrated: topicHydrated } = useTopic(group?.topicId ?? null);
  const hydrated = groupHydrated && topicHydrated;

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 px-6 py-16 sm:px-10">
        {!hydrated ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : !group || !topic ? (
          <NotFound />
        ) : (
          <GroupEditor mode={{ kind: "edit", topic, group }} />
        )}
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <Link
        href="/groups"
        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← All groups
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Group not found</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        It may have been deleted, or this link is from a different browser.
        Groups live in localStorage on each device.
      </p>
    </div>
  );
}
