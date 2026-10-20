'use client';

const activePageTransitions = new Set<Promise<void>>();

/** React invokes the returned cleanup when this boundary's view transition ends. */
export function registerPageTransition(): () => void {
  let finish!: () => void;
  const finished = new Promise<void>(resolve => {
    finish = resolve;
  });
  activePageTransitions.add(finished);

  return () => {
    activePageTransitions.delete(finished);
    finish();
  };
}

// Not all supported browsers (or TypeScript's DOM declarations) expose this yet.
type DocumentWithActiveTransition = Document & {
  activeViewTransition?: {finished: Promise<void>} | null;
};

/** Wait for snapshots to disappear before opening a live portal over the page. */
export async function waitForPageTransitions(signal?: AbortSignal): Promise<void> {
  const settled = new Set<Promise<void>>();

  while (!signal?.aborted) {
    const pending = new Set(activePageTransitions);
    const nativeTransition = (document as DocumentWithActiveTransition).activeViewTransition;
    if (nativeTransition) pending.add(nativeTransition.finished);
    const unfinished = Array.from(pending).filter(finished => !settled.has(finished));
    if (unfinished.length === 0) return;

    await new Promise<void>(resolve => {
      const finish = () => {
        signal?.removeEventListener('abort', finish);
        resolve();
      };
      signal?.addEventListener('abort', finish, {once: true});
      // Skipped/failed transitions must also release the pending intent.
      void Promise.allSettled(unfinished).then(finish);
    });
    unfinished.forEach(finished => settled.add(finished));
    // A second transition may have started while the first one was finishing.
  }
}
