import {
  Button,
  cn,
  ConfirmDialog,
  Panel,
  PanelHeader,
  Pill,
  SegmentedTabs,
  Select,
  StatusDot,
  TextField,
  useToast,
} from "@creative-seat/ui";
import { useRef, useState, type ReactNode } from "react";
import { PILLAR_CLASS, PILLAR_KEYS, PILLARS, SERIES_NOTE, STATUSES, statusOf } from "../data/plan";
import type { PillarKey, Post, PostPatch, Series, StatusKey } from "../data/types";
import { fmt, pad2 } from "../lib/dates";
import { go } from "../lib/use-hash-route";
import type { Plan } from "../lib/use-plan";
import { useBriefExtras } from "../lib/use-brief-extras";
import type { Viewer } from "../lib/use-viewer";
import { ArtworkPanel } from "./artwork-panel";
import { EditList, EditPairs, EditText } from "./editable";
import { FeedbackSection } from "./feedback-section";
import { InspirationSection } from "./inspiration-section";
import type { ListView } from "./top-bar";

const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s.k, label: s.name, icon: <StatusDot color={s.color} /> }));
const PILLAR_OPTIONS = PILLAR_KEYS.map((k) => ({ value: k, label: `${PILLARS[k].name} · ${PILLARS[k].role}` }));
const SERIES_OPTIONS: { value: Series | "none"; label: string }[] = [
  { value: "none", label: "No series" },
  ...(Object.keys(SERIES_NOTE) as Series[]).map((s) => ({ value: s, label: s })),
];

export interface BriefViewProps {
  post: Post;
  plan: Plan;
  backTo: ListView;
  viewer: Viewer;
  onSignIn: () => void;
  /** Open straight into edit mode (e.g. a post that was just created). */
  startEditing?: boolean;
}

export function BriefView({ post: p, plan, backTo, viewer, onSignIn, startEditing }: BriefViewProps) {
  // Signed-in editor: may change the date and status, and switch to edit mode.
  const canEdit = viewer.editor;
  const extras = useBriefExtras(p.id, !!viewer.email);
  const toast = useToast();
  const [capTab, setCapTab] = useState<"li" | "ig">("li");
  const [editMode, setEditMode] = useState(!!startEditing);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(0);
  const copyRef = useRef<HTMLUListElement>(null);
  const capRef = useRef<HTMLParagraphElement>(null);

  const editing = canEdit && editMode;
  const i = plan.sorted.indexOf(p);
  const prev = plan.sorted[i - 1];
  const next = plan.sorted[i + 1];
  const pillar = PILLARS[p.pillar];
  const caption = capTab === "li" ? p.captionLinkedIn : p.captionInstagram;

  const save = async (patch: PostPatch, message?: string) => {
    setSaving((n) => n + 1);
    const ok = await plan.save(p.id, patch);
    setSaving((n) => n - 1);
    if (ok && message) toast(message);
  };

  const copy = async (text: string, el: HTMLElement | null) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied");
    } catch {
      if (!el) return;
      const r = document.createRange();
      r.selectNodeContents(el);
      const sel = getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      toast("Selected — press Ctrl/Cmd+C to copy");
    }
  };

  return (
    <>
      <nav className="flex flex-wrap items-center justify-between gap-3 py-[18px]">
        <Button onClick={() => go(backTo)}>← Back to {backTo}</Button>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              {editing && (
                <span className="mr-1 text-xs text-muted" aria-live="polite">
                  {saving ? "Saving…" : "All changes saved"}
                </span>
              )}
              <Button
                variant={editing ? "ink" : "outline"}
                icon={editing ? "✓" : null}
                aria-pressed={editing}
                onClick={() => setEditMode(!editMode)}
              >
                {editing ? "Done editing" : "Edit brief"}
              </Button>
            </>
          )}
          <Button disabled={!prev} onClick={() => prev && go(prev.id)} aria-label="Previous post">
            ← {prev ? `No. ${pad2(prev.number)}` : "Prev"}
          </Button>
          <Button disabled={!next} onClick={() => next && go(next.id)} aria-label="Next post">
            {next ? `No. ${pad2(next.number)}` : "Next"} →
          </Button>
        </div>
      </nav>

      <div className="grid items-end gap-x-10 gap-y-6 border-t border-ink pt-7 pb-8 min-[761px]:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          {editing ? (
            <div className="mb-[18px] flex flex-wrap gap-3">
              <Select<PillarKey>
                label="Pillar"
                value={p.pillar}
                options={PILLAR_OPTIONS}
                onValueChange={(v) => save({ pillar: v })}
              />
              <Select<Series | "none">
                label="Series"
                value={p.series || "none"}
                options={SERIES_OPTIONS}
                onValueChange={(v) => save({ series: v === "none" ? "" : v })}
              />
            </div>
          ) : (
            <div className="mb-[18px] flex flex-wrap gap-1.5">
              <Pill className={PILLAR_CLASS[p.pillar]}>
                {pillar.name} · {pillar.role}
              </Pill>
              {p.series && <Pill tone="plain">Series: {p.series}</Pill>}
              <Pill tone="plain">
                Creative brief · Post {pad2(p.number)} of {plan.posts.length}
              </Pill>
            </div>
          )}
          {editing ? (
            <EditText
              label="Title"
              multiline
              value={p.title}
              onSave={(v) => (v.trim() ? save({ title: v.trim() }) : toast("Title can't be empty."))}
              className="border-dashed bg-transparent px-2 py-1 font-serif text-[clamp(2.2rem,5vw,4.2rem)] leading-none tracking-[-0.015em]"
            />
          ) : (
            <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] leading-none font-normal tracking-[-0.015em] text-balance">
              {p.title}
            </h1>
          )}
          {editing ? (
            <label className="mt-4 block max-w-[52ch]">
              <span className="mb-1 block text-xs text-muted">The job</span>
              <EditText
                label="The job"
                multiline
                value={p.objective}
                placeholder="What should this post achieve?"
                onSave={(v) => save({ objective: v })}
                className="text-lg"
              />
            </label>
          ) : (
            <p className="mt-4 max-w-[52ch] text-lg leading-[1.45]">
              <span className="text-muted">The job:</span> {p.objective || <Empty>Not written yet.</Empty>}
            </p>
          )}
        </div>
        <ArtworkPanel post={p} slides={extras.slides} viewer={viewer} onChange={extras.refresh} />
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] border-y border-line">
        <Spec>
          {canEdit ? (
            <TextField
              label="Post date"
              type="date"
              value={p.date}
              min="2026-10-01"
              max="2027-01-31"
              onChange={(e) => {
                const v = e.currentTarget.value;
                save({ date: v }, v ? `Moved to ${fmt(v)}` : "Taken off the calendar");
              }}
            />
          ) : (
            <ReadSpec term="Post date">{fmt(p.date)}</ReadSpec>
          )}
        </Spec>
        <Spec>
          {canEdit ? (
            <Select<StatusKey>
              label="Status"
              value={p.status}
              options={STATUS_OPTIONS}
              onValueChange={(v) => save({ status: v }, `Status: ${statusOf(v).name}`)}
            />
          ) : (
            <ReadSpec term="Status">
              <span className="inline-flex items-center gap-2">
                <StatusDot color={statusOf(p.status).color} />
                {statusOf(p.status).name}
              </span>
            </ReadSpec>
          )}
        </Spec>
        <Spec>
          <ReadSpec term="Platform">
            {editing ? (
              <EditText label="Platform" value={p.platform} placeholder="LinkedIn + Instagram" onSave={(v) => save({ platform: v })} />
            ) : (
              p.platform || <Empty>—</Empty>
            )}
          </ReadSpec>
        </Spec>
        <Spec>
          <ReadSpec term="Format">
            {editing ? (
              <EditText label="Format" value={p.format} placeholder="Carousel · 6 slides" onSave={(v) => save({ format: v })} />
            ) : (
              p.format || <Empty>—</Empty>
            )}
          </ReadSpec>
        </Spec>
        <Spec>
          <ReadSpec term="Deliver at">
            {editing ? (
              <EditList label="Delivery size" placeholder="1080×1350" items={p.sizes} onSave={(v) => save({ sizes: v })} />
            ) : p.sizes.length ? (
              p.sizes.map((z) => (
                <span key={z} className="block">
                  {z}
                </span>
              ))
            ) : (
              <Empty>—</Empty>
            )}
          </ReadSpec>
        </Spec>
      </dl>

      <div className="grid gap-10 pt-9 pb-16 min-[981px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <Section k="01" title="The idea">
            {editing ? (
              <EditText
                label="The idea"
                multiline
                value={p.idea}
                placeholder="Describe the idea in a few sentences."
                onSave={(v) => save({ idea: v })}
                className="max-w-[60ch] text-[1.1875rem]"
              />
            ) : (
              <p className="max-w-[60ch] text-[1.1875rem] leading-normal tracking-[-0.005em]">
                {p.idea || <Empty>No idea written yet.</Empty>}
              </p>
            )}
            {p.series && <p className="mt-2.5 text-[0.8125rem] text-muted">{SERIES_NOTE[p.series]}</p>}
          </Section>
          <Section k="02" title="Art direction">
            {editing ? (
              <EditPairs
                wide
                rows={p.artDirection}
                onSave={(v) => save({ artDirection: v })}
                labelPlaceholder="Aspect"
                textPlaceholder="Direction"
                addLabel="Add art direction"
              />
            ) : p.artDirection.length ? (
              <ul>
                {p.artDirection.map(([k, v], j) => (
                  <li
                    key={j}
                    className="grid gap-x-5 gap-y-1 border-b border-line py-3.5 first:pt-0 min-[561px]:grid-cols-[150px_minmax(0,1fr)]"
                  >
                    <b className="font-semibold">{k}</b>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No art direction yet.</Empty>
            )}
          </Section>
          <Section k="03" title="Get these right">
            <div className="grid gap-3 min-[561px]:grid-cols-2">
              <div className="rounded-2xl bg-volt p-4">
                <span className="eyebrow mb-2 block">Look here first</span>
                {editing ? (
                  <EditText label="Look here first" multiline value={p.lookHere} onSave={(v) => save({ lookHere: v })} />
                ) : (
                  p.lookHere || <Empty>—</Empty>
                )}
              </div>
              <div className="rounded-2xl border border-line bg-white p-4">
                <span className="eyebrow mb-2 block text-muted">Hold back</span>
                {editing ? (
                  <EditText label="Hold back" multiline value={p.holdBack} onSave={(v) => save({ holdBack: v })} />
                ) : (
                  p.holdBack || <Empty>—</Empty>
                )}
              </div>
            </div>
          </Section>
          <Section k="04" title="Inspiration" note={extras.images.length ? `· ${extras.images.length} image${extras.images.length === 1 ? "" : "s"}` : undefined}>
            <InspirationSection postId={p.id} viewer={viewer} images={extras.images} onChange={extras.refresh} onSignIn={onSignIn} />
          </Section>
          <Section k="05" title="Feedback">
            <FeedbackSection postId={p.id} viewer={viewer} comments={extras.comments} onChange={extras.refresh} onSignIn={onSignIn} />
          </Section>
          {editing && (
            <div className="mt-12 flex items-center justify-between gap-4 rounded-2xl border border-danger/30 p-4">
              <p className="text-sm text-muted">Remove this post from the plan for everyone.</p>
              <Button className="text-danger hover:not-data-disabled:border-danger" onClick={() => setConfirmDelete(true)}>
                Delete post
              </Button>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-5 self-start min-[981px]:sticky min-[981px]:top-[84px]">
          <Panel>
            <PanelHeader
              title="Words on the asset"
              action={
                !editing && (
                  <Button
                    variant="ink"
                    disabled={!p.assetCopy.length}
                    onClick={() => copy(p.assetCopy.map(([k, v]) => `${k}: ${v}`).join("\n"), copyRef.current)}
                  >
                    Copy
                  </Button>
                )
              }
            />
            {editing ? (
              <EditPairs
                rows={p.assetCopy}
                onSave={(v) => save({ assetCopy: v })}
                labelPlaceholder="Label"
                textPlaceholder="Copy"
                addLabel="Add line"
              />
            ) : p.assetCopy.length ? (
              <ul ref={copyRef}>
                {p.assetCopy.map(([k, v], j) => {
                  const headline = /headline|slide 1|line$|end line/i.test(k) && j < 2;
                  return (
                    <li key={j} className="border-t border-line py-2.5 first:border-t-0 first:pt-0">
                      <small className="mb-[3px] block text-[0.6875rem] font-semibold tracking-[0.08em] text-muted uppercase">
                        {k}
                      </small>
                      <p
                        className={cn(
                          "leading-[1.35]",
                          headline ? "font-serif text-2xl leading-[1.1] font-normal" : "text-base font-medium",
                        )}
                      >
                        {v}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>No copy yet.</Empty>
            )}
          </Panel>
          <Panel>
            <PanelHeader
              title="Caption"
              action={
                <SegmentedTabs
                  size="sm"
                  aria-label="Caption platform"
                  value={capTab}
                  onValueChange={setCapTab}
                  items={[
                    { value: "li", label: "LinkedIn" },
                    { value: "ig", label: "Instagram" },
                  ]}
                />
              }
            />
            {editing ? (
              <EditText
                key={capTab}
                label={capTab === "li" ? "LinkedIn caption" : "Instagram caption"}
                multiline
                value={caption}
                onSave={(v) => save(capTab === "li" ? { captionLinkedIn: v } : { captionInstagram: v })}
                className="text-[0.9375rem] leading-[1.55]"
              />
            ) : (
              <p
                ref={capRef}
                className="max-h-[340px] overflow-auto pr-1.5 text-[0.9375rem] leading-[1.55] whitespace-pre-wrap"
              >
                {caption || <Empty>No caption yet.</Empty>}
              </p>
            )}
            <div className="mt-3.5 flex items-center justify-between gap-2.5">
              <span className="text-xs text-muted">{caption.length} characters</span>
              {!editing && (
                <Button variant="ink" disabled={!caption} onClick={() => copy(caption, capRef.current)}>
                  Copy caption
                </Button>
              )}
            </div>
          </Panel>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete No. ${pad2(p.number)}?`}
        description={`“${p.title}” and its whole brief will be removed for everyone. This can't be undone.`}
        confirmLabel="Delete post"
        onConfirm={async () => {
          if (await plan.remove(p.id)) {
            toast(`Deleted No. ${pad2(p.number)}`);
            go(backTo);
          }
        }}
      />
    </>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <span className="text-muted italic">{children}</span>;
}

function Spec({ children }: { children: ReactNode }) {
  return <div className="min-w-0 py-3.5 pr-4">{children}</div>;
}

function ReadSpec({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="mb-1 text-xs text-muted">{term}</dt>
      <dd className="font-medium [overflow-wrap:anywhere]">{children}</dd>
    </>
  );
}

function Section({ k, title, note, children }: { k: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="mb-3.5 flex items-baseline gap-3 border-b border-line pb-2.5 text-[1.0625rem] font-bold">
        <span className="text-xs font-medium text-muted tabular-nums">{k}</span>
        {title}
        {note && <span className="text-[0.8125rem] font-normal text-muted">{note}</span>}
      </h2>
      {children}
    </section>
  );
}
