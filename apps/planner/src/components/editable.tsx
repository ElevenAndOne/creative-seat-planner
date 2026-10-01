import { Button, cn, Input, TextArea } from "@creative-seat/ui";
import { useEffect, useState } from "react";

/** Keeps a local draft that resets whenever the saved value changes. */
function useDraft<T>(value: T) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return [draft, setDraft] as const;
}

export interface EditTextProps {
  value: string;
  onSave: (value: string) => void;
  label: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

/** Text input that saves on blur (Enter too, for single-line); Escape reverts. */
export function EditText({ value, onSave, label, multiline, placeholder, className }: EditTextProps) {
  const [draft, setDraft] = useDraft(value);
  const commit = () => {
    if (draft !== value) onSave(draft);
  };
  const shared = {
    "aria-label": label,
    value: draft,
    placeholder,
    className,
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        setDraft(value);
        e.currentTarget.blur();
      }
      if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) e.currentTarget.blur();
    },
  };
  return multiline ? (
    <TextArea {...shared} onChange={(e) => setDraft(e.currentTarget.value)} />
  ) : (
    <Input {...shared} onChange={(e) => setDraft(e.currentTarget.value)} />
  );
}

export interface EditPairsProps {
  rows: [string, string][];
  onSave: (rows: [string, string][]) => void;
  labelPlaceholder: string;
  textPlaceholder: string;
  addLabel: string;
  /** Lay label and text side by side on wide screens. */
  wide?: boolean;
}

/** Editable list of [label, text] rows with add and remove. */
export function EditPairs({ rows, onSave, labelPlaceholder, textPlaceholder, addLabel, wide }: EditPairsProps) {
  const [draft, setDraft] = useDraft(rows);
  const set = (i: number, j: 0 | 1, v: string) =>
    setDraft(draft.map((r, k) => (k === i ? ((j === 0 ? [v, r[1]] : [r[0], v]) as [string, string]) : r)));
  const commit = (next = draft) => {
    if (JSON.stringify(next) !== JSON.stringify(rows)) onSave(next);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {draft.map(([k, v], i) => (
        <div
          key={i}
          className={cn("grid items-start gap-2", wide ? "min-[561px]:grid-cols-[150px_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]")}
        >
          <Input
            aria-label={`${labelPlaceholder} ${i + 1}`}
            placeholder={labelPlaceholder}
            value={k}
            className="font-semibold"
            onChange={(e) => set(i, 0, e.currentTarget.value)}
            onBlur={() => commit()}
          />
          <TextArea
            aria-label={`${textPlaceholder} ${i + 1}`}
            placeholder={textPlaceholder}
            value={v}
            className={wide ? "" : "col-start-1"}
            onChange={(e) => set(i, 1, e.currentTarget.value)}
            onBlur={() => commit()}
          />
          <button
            type="button"
            aria-label={`Remove row ${i + 1}`}
            className={cn(
              "grid size-9 cursor-pointer place-items-center rounded-full border border-line bg-white text-muted hover:border-danger hover:text-danger",
              !wide && "col-start-2 row-start-1",
            )}
            onClick={() => {
              const next = draft.filter((_, k) => k !== i);
              setDraft(next);
              commit(next);
            }}
          >
            ×
          </button>
        </div>
      ))}
      <Button
        className="h-9 self-start border-dashed"
        onClick={() => {
          const next = [...draft, ["", ""] as [string, string]];
          setDraft(next);
        }}
      >
        + {addLabel}
      </Button>
    </div>
  );
}

export interface EditListProps {
  items: string[];
  onSave: (items: string[]) => void;
  label: string;
  placeholder: string;
}

/** Editable list of short strings, one input per item. Empty items are dropped. */
export function EditList({ items, onSave, label, placeholder }: EditListProps) {
  const [draft, setDraft] = useDraft(items);
  const commit = (next = draft) => {
    const clean = next.map((s) => s.trim()).filter(Boolean);
    if (JSON.stringify(clean) !== JSON.stringify(items)) onSave(clean);
  };
  return (
    <div className="flex max-w-[260px] flex-col gap-1.5">
      {draft.map((s, i) => (
        <Input
          key={i}
          aria-label={`${label} ${i + 1}`}
          placeholder={placeholder}
          value={s}
          onChange={(e) => setDraft(draft.map((x, k) => (k === i ? e.currentTarget.value : x)))}
          onBlur={() => commit()}
        />
      ))}
      <button
        type="button"
        className="cursor-pointer self-start text-xs font-medium text-muted hover:text-ink"
        onClick={() => setDraft([...draft, ""])}
      >
        + Add size
      </button>
    </div>
  );
}
