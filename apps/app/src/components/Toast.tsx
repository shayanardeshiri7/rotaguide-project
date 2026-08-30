import { useEffect } from 'react';

/**
 * Transient confirmation. Rendered as a polite live region so screen
 * readers announce it without interrupting whatever is being read.
 */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (message === null) return;
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, [message, onDone]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {message !== null && <div className="toast">{message}</div>}
    </div>
  );
}
