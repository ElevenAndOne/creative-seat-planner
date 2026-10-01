import { Toast } from "@base-ui/react/toast";
import { useCallback, type ReactNode } from "react";

/**
 * App-level toast host: a single ink pill, bottom-centre. Wrap the app in
 * `<ToastProvider>` and call `useToast()` to show a message.
 */
export function ToastProvider({ children, timeout = 2600 }: { children: ReactNode; timeout?: number }) {
  return (
    <Toast.Provider timeout={timeout} limit={1}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed bottom-[calc(20px+env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex w-max max-w-[calc(100%-32px)] -translate-x-1/2 flex-col items-center outline-none">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((t) => (
    <Toast.Root
      key={t.id}
      toast={t}
      className="rounded-full bg-ink px-4 py-2.5 text-sm text-paper transition-[opacity,translate] duration-250 data-starting-style:translate-y-5 data-starting-style:opacity-0 data-ending-style:translate-y-5 data-ending-style:opacity-0 data-limited:hidden"
    >
      <Toast.Content>
        <Toast.Title />
      </Toast.Content>
    </Toast.Root>
  ));
}

export function useToast() {
  const manager = Toast.useToastManager();
  return useCallback(
    (message: string) => {
      manager.close();
      manager.add({ title: message });
    },
    [manager],
  );
}
