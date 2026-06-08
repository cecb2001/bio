"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { FlashcardDeck } from "@/components/flashcard-deck";
import { useGroup } from "@/lib/groups";
import { useTopic } from "@/lib/topics";

export function HomeDeck({ topicId }: { topicId: string }) {
  const params = useSearchParams();
  const groupId = params.get("group");
  const { topic, hydrated: topicHydrated } = useTopic(topicId);
  const { group, hydrated: groupHydrated } = useGroup(groupId);

  const resolved = useMemo(() => {
    if (!topic) {
      return {
        cards: [],
        title: "Topic not found",
        description: "It may have been deleted from this browser.",
      };
    }
    if (!groupId) {
      return {
        cards: topic.cards,
        title: topic.name,
        description: topic.description || `${topic.cards.length} cards`,
      };
    }
    if (!group || group.topicId !== topic.id) {
      return {
        cards: [],
        title: "Group not found",
        description: "Pick another group, or study all cards in the topic.",
      };
    }
    const byId = new Map(topic.cards.map((c) => [c.id, c]));
    const subset = group.cardIds
      .map((id) => byId.get(id))
      .filter((c): c is (typeof topic.cards)[number] => Boolean(c));
    const missing = group.cardIds.length - subset.length;
    const desc =
      missing > 0
        ? `${subset.length} cards · ${missing} missing (topic changed since save)`
        : `${subset.length} cards · saved group in ${topic.name}`;
    return { cards: subset, title: group.name, description: desc };
  }, [topic, group, groupId]);

  if (!topicHydrated || (groupId && !groupHydrated)) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <FlashcardDeck
      cards={resolved.cards}
      title={resolved.title}
      description={resolved.description}
    />
  );
}
