import { Button, cn, Pill, Select, TextArea, useToast } from "@creative-seat/ui";
import { useState } from "react";
import { COMMENT_ROLES, type Comment, type CommentRole } from "../data/types";
import { api, ApiError } from "../lib/api";
import type { Viewer } from "../lib/use-viewer";

const ROLE_KEY = "cs-role";
const loadRole = (): CommentRole => {
  try {
    const r = localStorage.getItem(ROLE_KEY);
    return (COMMENT_ROLES as readonly string[]).includes(r ?? "") ? (r as CommentRole) : "Designer";
  } catch {
    return "Designer";
  }
};

const ago = (iso: string) => {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export interface FeedbackSectionProps {
  postId: string;
  viewer: Viewer;
  comments: Comment[];
  onChange: () => Promise<void>;
  onSignIn: () => void;
}

/** Comments on a brief. Editors (ADs/CDs) approve comments "to action" for the designer. */
export function FeedbackSection({ postId, viewer, comments, onChange, onSignIn }: FeedbackSectionProps) {
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<CommentRole>(loadRole);
  const [posting, setPosting] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);

  if (!viewer.email) {
    return (
      <p className="text-muted">
        Feedback is shared with the team working on the brief.{" "}
        <button type="button" className="cursor-pointer font-medium text-ink underline underline-offset-4" onClick={onSignIn}>
          Sign in
        </button>{" "}
        to read and leave comments.
      </p>
    );
  }

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    try {
      await fn();
      if (done) toast(done);
      await onChange();
      return true;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "That didn't save. Try again.");
      return false;
    }
  };

  const post = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    if (await run(() => api.addFeedback(postId, draft.trim(), role), "Feedback posted")) setDraft("");
    setPosting(false);
  };

  const remove = (id: string) => {
    if (armed !== id) {
      setArmed(id);
      setTimeout(() => setArmed((a) => (a === id ? null : a)), 4000);
      return;
    }
    setArmed(null);
    void run(() => api.removeFeedback(id), "Comment deleted");
  };

  const open = comments.filter((c) => c.status === "open").length;

  return (
    <div className="flex flex-col gap-4">
      {comments.length ? (
        <>
          <p className="flex gap-4 text-[0.8125rem] text-muted">
            <span>{open} awaiting review</span>
            <span>{comments.length - open} approved to action</span>
          </p>
          <ul className="flex flex-col gap-2.5">
            {comments.map((c) => {
              const done = c.status === "actioned";
              const mine = c.authorId === viewer.id;
              return (
                <li
                  key={c.id}
                  className={cn(
                    "grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-2xl border border-line bg-white p-3.5",
                    done && "border-st-ok/40 bg-st-ok/5",
                  )}
                >
                  <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-chalk text-sm font-semibold">
                    {(c.authorName[0] ?? "?").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm font-semibold">{mine ? "You" : c.authorName}</b>
                      <Pill tone="plain">{c.role}</Pill>
                      <time className="text-xs text-muted" dateTime={c.createdAt}>
                        {ago(c.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap">{c.body}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
                      {done ? (
                        <>
                          <span className="font-medium text-st-ok">✓ To action · approved by {c.actionedBy}</span>
                          {viewer.editor && (
                            <LinkButton onClick={() => run(() => api.setFeedbackStatus(c.id, "open"), "Back to review")}>
                              Undo
                            </LinkButton>
                          )}
                        </>
                      ) : viewer.editor ? (
                        <Button
                          variant="ink"
                          icon="✓"
                          onClick={() => run(() => api.setFeedbackStatus(c.id, "actioned"), "Marked to action")}
                        >
                          Action this
                        </Button>
                      ) : (
                        <span className="text-muted">Waiting for AD / CD review</span>
                      )}
                      {(viewer.editor || mine) && (
                        <LinkButton danger={armed === c.id} onClick={() => remove(c.id)}>
                          {armed === c.id ? "Confirm delete" : "Delete"}
                        </LinkButton>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="text-[0.8125rem] text-muted">
          No feedback yet. Art Directors and Creative Directors can mark any comment “Action this” to send it to the
          designer.
        </p>
      )}

      <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-white p-3.5">
        <TextArea
          aria-label="Your feedback"
          placeholder="Leave feedback on this brief — a question, a change, a reference…"
          value={draft}
          maxLength={4000}
          className="min-h-20 border-0 px-0 focus:border-0"
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void post();
          }}
        />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Select<CommentRole>
            label="Commenting as"
            value={role}
            options={COMMENT_ROLES.map((r) => ({ value: r, label: r }))}
            onValueChange={(r) => {
              setRole(r);
              try {
                localStorage.setItem(ROLE_KEY, r);
              } catch {
                // per-browser convenience only
              }
            }}
          />
          <Button variant="ink" disabled={!draft.trim() || posting} onClick={post}>
            {posting ? "Posting…" : "Post feedback"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LinkButton({ danger, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={cn("cursor-pointer text-muted underline-offset-4 hover:text-ink hover:underline", danger && "font-semibold text-danger")}
      {...props}
    />
  );
}
