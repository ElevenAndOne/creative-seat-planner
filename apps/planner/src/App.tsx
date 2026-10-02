import { Button, useToast } from "@creative-seat/ui";
import { useEffect, useState } from "react";
import { BriefView } from "./components/brief-view";
import { CalendarView } from "./components/calendar-view";
import { ContentView } from "./components/content-view";
import { Legend } from "./components/legend";
import { SignInDialog } from "./components/sign-in-dialog";
import { Summary } from "./components/summary";
import { TopBar, type ListView } from "./components/top-bar";
import type { PillarKey } from "./data/types";
import { fmt, pad2 } from "./lib/dates";
import { go, useHashRoute } from "./lib/use-hash-route";
import { usePlan } from "./lib/use-plan";
import { useViewer } from "./lib/use-viewer";

export function App() {
  const toast = useToast();
  const plan = usePlan(toast);
  const viewer = useViewer();
  const hash = useHashRoute();
  const [filter, setFilter] = useState<PillarKey | null>(null);
  const [lastView, setLastView] = useState<ListView>("calendar");
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const openSignIn = () => setSignInOpen(true);

  const post = plan.posts.find((p) => p.id === hash);
  const view: ListView = hash === "content" ? "content" : post ? lastView : "calendar";

  useEffect(() => {
    if (!post) setLastView(view);
    else window.scrollTo(0, 0);
  }, [post?.id, view]);

  const addPost = async () => {
    const created = await plan.create({ title: "Untitled post" });
    if (created) {
      setJustCreated(created.id);
      toast(`Added No. ${pad2(created.number)} — it's off the calendar until you give it a date`);
      go(created.id);
    }
  };

  return (
    <>
      <TopBar view={post ? null : view} viewer={viewer} onSignIn={openSignIn} />
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      {!post && <Summary plan={plan} />}
      <main className="wrap pb-16">
        {plan.load.status === "loading" ? (
          <p className="border-t border-line py-16 text-center text-muted">Loading the plan…</p>
        ) : plan.load.status === "error" ? (
          <div className="flex flex-col items-center gap-4 border-t border-line py-16 text-center">
            <p className="text-muted">{plan.load.message}</p>
            <Button onClick={plan.refresh}>Try again</Button>
          </div>
        ) : post ? (
          <BriefView
            key={post.id}
            post={post}
            plan={plan}
            backTo={lastView}
            viewer={viewer}
            onSignIn={openSignIn}
            startEditing={justCreated === post.id}
          />
        ) : (
          <>
            <Legend posts={plan.posts} filter={filter} onFilterChange={setFilter} />
            {view === "calendar" ? (
              <CalendarView
                plan={plan}
                filter={filter}
                canEdit={viewer.editor}
                onAdd={addPost}
                onMove={async (p, date) => {
                  if (await plan.save(p.id, { date }))
                    toast(
                      date
                        ? `No. ${pad2(p.number)} moved to ${fmt(date)}`
                        : `No. ${pad2(p.number)} taken off the calendar`,
                    );
                }}
              />
            ) : (
              <ContentView plan={plan} filter={filter} />
            )}
          </>
        )}
      </main>
    </>
  );
}
