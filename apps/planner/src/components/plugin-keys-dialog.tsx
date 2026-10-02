import { Button, Dialog, Input, useToast } from "@creative-seat/ui";
import { useEffect, useState } from "react";
import type { PluginKey } from "../data/types";
import { api, ApiError, PLUGIN_API_URL } from "../lib/api";

export interface PluginKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Create and revoke keys for the Creative Seat Figma plugin. */
export function PluginKeysDialog({ open, onOpenChange }: PluginKeysDialogProps) {
  const toast = useToast();
  const [keys, setKeys] = useState<PluginKey[]>([]);
  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .pluginKeys()
      .then(setKeys)
      .catch(() => setKeys([]));

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    void load();
  }, [open]);

  const create = async () => {
    setBusy(true);
    try {
      const { key } = await api.createPluginKey(label.trim() || "Figma plugin");
      setCreated(key);
      setLabel("");
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't create a key. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${what} copied`);
    } catch {
      toast("Select the text and press Ctrl/Cmd+C to copy");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Figma plugin"
      description="The Creative Seat plugin publishes slide artwork and animated MP4s from Figma to each brief. Paste a key and the API address into it once."
      className="w-[min(560px,calc(100vw-32px))]"
    >
      <div className="flex flex-col gap-5">
        {created ? (
          <div className="rounded-2xl bg-volt p-4">
            <p className="eyebrow mb-2">Your new key · shown once</p>
            <code className="block rounded-lg bg-white/70 px-3 py-2 text-sm break-all">{created}</code>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ink" icon={null} onClick={() => copy(created, "Key")}>
                Copy key
              </Button>
              <Button onClick={() => copy(PLUGIN_API_URL, "API address")}>Copy API address</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs text-muted">Label (which computer or Figma account)</span>
              <Input value={label} placeholder="e.g. Craig's MacBook" maxLength={60} onChange={(e) => setLabel(e.currentTarget.value)} />
            </label>
            <Button variant="ink" disabled={busy} onClick={create}>
              {busy ? "Creating…" : "Create key"}
            </Button>
          </div>
        )}

        <div>
          <p className="mb-1 text-xs text-muted">API address for the plugin</p>
          <code className="block rounded-lg border border-line bg-white px-3 py-2 text-xs break-all">{PLUGIN_API_URL}</code>
        </div>

        {keys.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-muted">Your keys</p>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
              {keys.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                  <span className="min-w-0">
                    <b className="block truncate font-medium">{k.label || "Figma plugin"}</b>
                    <span className="text-xs text-muted">
                      Created {date(k.createdAt)} · {k.lastUsedAt ? `last used ${date(k.lastUsedAt)}` : "never used"}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="cursor-pointer text-xs font-medium text-danger underline-offset-4 hover:underline"
                    onClick={async () => {
                      try {
                        await api.revokePluginKey(k.id);
                        toast("Key revoked");
                        await load();
                      } catch (e) {
                        toast(e instanceof ApiError ? e.message : "Couldn't revoke that key.");
                      }
                    }}
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}
