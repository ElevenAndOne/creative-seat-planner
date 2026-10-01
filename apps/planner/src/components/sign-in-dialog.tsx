import { Button, Dialog, TextField } from "@creative-seat/ui";
import { useState, type FormEvent } from "react";
import { authClient } from "../lib/auth";

export interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Email + password sign-in (or account creation) against Neon Auth. */
export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { error } =
        mode === "in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name: name || email.split("@")[0]! });
      if (error) setError(error.message ?? "That didn't work. Check your details and try again.");
      else {
        setPassword("");
        onOpenChange(false);
      }
    } catch {
      setError("Can't reach the sign-in service. Check your connection.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "in" ? "Sign in to edit" : "Create an account"}
      description="Anyone can view the plan. Only people on the editor list can change it."
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {mode === "up" && (
          <TextField label="Name" className="max-w-none" value={name} onChange={(e) => setName(e.currentTarget.value)} autoComplete="name" />
        )}
        <TextField
          label="Email"
          type="email"
          required
          className="max-w-none"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          required
          minLength={8}
          className="max-w-none"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
        />
        {error && (
          <p role="alert" className="rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            className="cursor-pointer text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
            onClick={() => {
              setMode(mode === "in" ? "up" : "in");
              setError(null);
            }}
          >
            {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
          <Button type="submit" variant="ink" disabled={pending}>
            {pending ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
