import { useEffect, useState } from "react";
import { api } from "./api";
import { authClient } from "./auth";

export interface Viewer {
  /** Session still resolving. */
  loading: boolean;
  /** Neon Auth user id; matches a comment's authorId. */
  id: string | null;
  email: string | null;
  name: string | null;
  /** Signed in and on the editor list (checked by the API). */
  editor: boolean;
}

export function useViewer(): Viewer {
  const session = authClient.useSession();
  const user = session.data?.user ?? null;
  const [editor, setEditor] = useState<{ for: string; editor: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    let live = true;
    api
      .me()
      .then((me) => live && setEditor({ for: user.id, editor: me.editor }))
      .catch(() => live && setEditor({ for: user.id, editor: false }));
    return () => {
      live = false;
    };
  }, [user?.id]);

  const checked = user && editor?.for === user.id;
  return {
    loading: session.isPending || (!!user && !checked),
    id: user?.id ?? null,
    email: user?.email ?? null,
    name: user?.name ?? null,
    editor: !!checked && editor.editor,
  };
}
