'use client';

import {Dialog} from '@base-ui/react/dialog';
import {Search, X} from 'lucide-react';
import {usePathname, useRouter} from 'next/navigation';
import {useEffect, useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {availableCommands, resolveTypedIntent, type ResolvedCommand} from '@/lib/command-registry';

export function CommandPalette({open, onOpenChange}: {open: boolean; onOpenChange: (open: boolean) => void}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [feedback, setFeedback] = useState<{kind: 'success' | 'error'; message: string}>();
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setFeedback(undefined);
    }
  }, [open]);
  const results = useMemo<ResolvedCommand[]>(() => {
    const context = {pathname};
    const typed = resolveTypedIntent(query, context);
    const commands = availableCommands(context, query).map(command => ({
      command,
      href: typeof command.href === 'function' ? command.href(query) : command.href,
    }));
    return typed && !commands.some(item => item.command.id === typed.command.id) ? [typed, ...commands] : commands;
  }, [pathname, query]);
  const execute = (result?: ResolvedCommand) => {
    if (!result) return;
    try {
      router.push(result.href);
      setFeedback({kind: 'success', message: `${result.command.label} executed.`});
      onOpenChange(false);
    } catch {
      setFeedback({kind: 'error', message: `${result.command.label} could not be executed.`});
    }
  };
  return (
    <>
      <span role="status" className="sr-only">
        {feedback?.kind === 'success' ? feedback.message : ''}
      </span>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45" />
          <Dialog.Popup className="fixed left-1/2 top-[12vh] z-50 w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border bg-popover shadow-2xl">
            <Dialog.Title className="sr-only">Command palette</Dialog.Title>
            <div className="flex items-center border-b px-3">
              <Search aria-hidden="true" className="size-4 text-muted-foreground" />
              <input
                autoFocus
                aria-label="Command or intent"
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={event => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActive(current => Math.min(results.length - 1, current + 1));
                  }
                  if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActive(current => Math.max(0, current - 1));
                  }
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    execute(results[active]);
                  }
                }}
                placeholder="Type a command, “transactions rent”, or “report 2026-07”…"
                className="h-12 flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <Dialog.Close render={<Button variant="ghost" size="icon" aria-label="Close command palette" />}>
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>
            {feedback?.kind === 'error' ? (
              <p role="alert" className="bg-destructive/10 p-3 text-sm text-destructive">
                {feedback.message}
              </p>
            ) : null}
            <div role="listbox" aria-label="Available commands" className="max-h-[55vh] overflow-y-auto p-2">
              {results.length ? (
                results.map((result, index) => (
                  <button
                    key={result.command.id}
                    type="button"
                    role="option"
                    aria-selected={active === index}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => execute(result)}
                    className={
                      active === index
                        ? 'flex w-full items-center justify-between rounded-md bg-accent px-3 py-2 text-left text-sm'
                        : 'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent'
                    }
                  >
                    <span>{result.command.label}</span>
                    <span className="text-xs text-muted-foreground">{result.command.group}</span>
                  </button>
                ))
              ) : (
                <p className="p-6 text-center text-sm text-muted-foreground">No matching command.</p>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
