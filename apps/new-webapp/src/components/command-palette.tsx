'use client';

import {Command, CornerDownLeft, Search} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useEffect, useMemo, useRef, useState} from 'react';
import {authClient} from '@/authClient';
import {DialogShell} from '@/components/ui/primitives';
import {CORE_INTENTS, filterIntents, objectEditIntents, type AppIntent} from '@/lib/intents';
import {useFinance} from '@/lib/finance-provider';

export function CommandPalette({open, onOpenChange}: {open: boolean; onOpenChange: (open: boolean) => void}) {
  const router = useRouter();
  const {data} = useFinance();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const intents = useMemo(() => [...CORE_INTENTS, ...objectEditIntents(data)], [data]);
  const matches = useMemo(() => filterIntents(intents, query).slice(0, 18), [intents, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [onOpenChange, open]);

  const execute = async (intent: AppIntent) => {
    onOpenChange(false);
    if (intent.kind === 'account') {
      await authClient.signOut();
      router.replace('/sign-in');
      return;
    }
    router.push(intent.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => Math.min(index + 1, Math.max(0, matches.length - 1)));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && matches[activeIndex]) {
      event.preventDefault();
      void execute(matches[activeIndex]);
    }
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Command centre"
      description="Navigate or start a workflow without leaving the keyboard."
    >
      <div className="command-search">
        <Search size={18} aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search pages, actions, or objects…"
          aria-label="Search commands"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-results"
          aria-activedescendant={matches[activeIndex] ? `command-${matches[activeIndex].id}` : undefined}
        />
        <kbd>Esc</kbd>
      </div>
      <div id="command-results" className="command-results" role="listbox" aria-label="Commands">
        {matches.length === 0 ? (
          <div className="command-empty">No matching command. Try a page or object name.</div>
        ) : (
          matches.map((intent, index) => (
            <button
              key={intent.id}
              id={`command-${intent.id}`}
              className={index === activeIndex ? 'command-item active' : 'command-item'}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => void execute(intent)}
            >
              <span className="command-icon">
                <Command size={16} />
              </span>
              <span>
                <strong>{intent.label}</strong>
                <small>{intent.group}</small>
              </span>
              <CornerDownLeft className="command-enter" size={15} />
            </button>
          ))
        )}
      </div>
      <div className="command-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> move
        </span>
        <span>
          <kbd>↵</kbd> open
        </span>
      </div>
    </DialogShell>
  );
}
