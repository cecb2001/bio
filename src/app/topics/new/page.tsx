import { TopicCreator } from "@/components/topic-creator";

export default function NewTopicPage() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 px-6 py-16 sm:px-10">
        <TopicCreator />
      </main>
    </div>
  );
}
