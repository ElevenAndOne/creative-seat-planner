import { Button, SegmentedTabs, Wordmark } from "@creative-seat/ui";
import { useState } from "react";
import { authClient } from "../lib/auth";
import { go } from "../lib/use-hash-route";
import type { Viewer } from "../lib/use-viewer";
import { PluginKeysDialog } from "./plugin-keys-dialog";

export type ListView = "calendar" | "content";

export function TopBar({ view, viewer, onSignIn }: { view: ListView | null; viewer: Viewer; onSignIn: () => void }) {
  const [pluginOpen, setPluginOpen] = useState(false);

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 border-b border-line bg-paper/92 backdrop-blur-sm">
      <div className="wrap flex flex-wrap items-center gap-x-7 gap-y-4 py-3.5">
        <a href="#calendar" aria-label="Creative Seat — calendar" className="rounded-sm">
          <Wordmark className="w-[132px]" />
        </a>
        <SegmentedTabs<ListView>
          aria-label="Views"
          value={view}
          onValueChange={go}
          items={[
            { value: "calendar", label: "Calendar" },
            { value: "content", label: "Content" },
          ]}
        />
        <div className="ml-auto flex items-center gap-3 text-[0.8125rem] text-muted">
          {viewer.loading ? (
            <span>Checking access…</span>
          ) : viewer.email ? (
            <>
              <span className="inline-flex items-center gap-2" title={viewer.email}>
                <i
                  className={
                    viewer.editor
                      ? "size-[7px] rounded-full bg-volt shadow-[0_0_0_3px_rgb(188_228_45/0.25)]"
                      : "size-[7px] rounded-full bg-st-brief"
                  }
                />
                {viewer.editor ? "Editing as" : "View only ·"} <span className="max-w-[22ch] truncate text-ink">{viewer.email}</span>
              </span>
              {viewer.editor && (
                <Button className="h-8 px-3 text-[0.8125rem]" onClick={() => setPluginOpen(true)}>
                  Figma plugin
                </Button>
              )}
              <Button className="h-8 px-3 text-[0.8125rem]" onClick={() => authClient.signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2">
                <i className="size-[7px] rounded-full bg-st-brief" />
                View only
              </span>
              <Button className="h-8 px-3 text-[0.8125rem]" onClick={onSignIn}>
                Sign in to edit
              </Button>
            </>
          )}
        </div>
      </div>
      {viewer.editor && <PluginKeysDialog open={pluginOpen} onOpenChange={setPluginOpen} />}
    </header>
  );
}
