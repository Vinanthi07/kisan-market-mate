import { createFileRoute } from "@tanstack/react-router";
import { ListOrdered, Rat, Recycle, ShieldAlert } from "lucide-react";
import { Page } from "@/components/AppShell";
import { ListenButton } from "@/components/ListenButton";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — KisanMandi" },
      { name: "description", content: "Compost, Lantana leaf storage and how to read market rankings, with audio." },
      { property: "og:title", content: "Learn — KisanMandi" },
      { property: "og:description", content: "Short picture-led farming lessons with voice narration." },
    ],
  }),
  component: Learn,
});

function Learn() {
  const { t } = useSettings();
  const cards = [
    { I: Recycle, title: t.compostT, body: t.compostB, pilot: false },
    { I: Rat, title: t.lantanaT, body: t.lantanaB, pilot: true },
    { I: ListOrdered, title: t.rankingT, body: t.rankingB, pilot: false },
  ];
  return (
    <Page>
      <main className="grid grid-cols-[minmax(0,1fr)] gap-4">
        {cards.map(({ I, title, body, pilot }) => (
          <article key={title} className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex h-36 items-center justify-center bg-primary/10"><I className="size-24 text-primary" aria-hidden /></div>
            <div className="grid gap-2 p-4">
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-lg">{body}</p>
              {pilot && <p className="flex items-center gap-1 text-sm text-muted-foreground"><ShieldAlert className="size-4" />{t.lantanaNote}</p>}
              <ListenButton text={`${title}. ${body}`} />
            </div>
          </article>
        ))}
      </main>
    </Page>
  );
}
