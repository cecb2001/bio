"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { FlashcardDeck } from "@/components/flashcard-deck";
import { pigAnatomyDeck } from "@/data/decks";
import { useGroup } from "@/lib/groups";

export function HomeDeck() {
  const params = useSearchParams();
  const groupId = params.get("group");
  const { group, hydrated } = useGroup(groupId);

  const { cards, title, description } = useMemo(() => {
    if (!groupId) {
      return {
        cards: pigAnatomyDeck.cards,
        title: pigAnatomyDeck.title,
        description: pigAnatomyDeck.description,
      };
    }
    if (!group) {
      return {
        cards: [],
        title: "Group not found",
        description: undefined as string | undefined,
      };
    }
    const byId = new Map(pigAnatomyDeck.cards.map((c) => [c.id, c]));
    const subset = group.cardIds
      .map((id) => byId.get(id))
      .filter((c): c is (typeof pigAnatomyDeck.cards)[number] => Boolean(c));
    const missing = group.cardIds.length - subset.length;
    const desc =
      missing > 0
        ? `${subset.length} cards · ${missing} missing (deck regenerated since save)`
        : `${subset.length} cards · saved group`;
    return { cards: subset, title: group.name, description: desc };
  }, [groupId, group]);

  if (groupId && !hydrated) {
    return <p className="text-sm text-zinc-500">Loading group…</p>;
  }

  return (
    <FlashcardDeck cards={cards} title={title} description={description} />
  );
}
