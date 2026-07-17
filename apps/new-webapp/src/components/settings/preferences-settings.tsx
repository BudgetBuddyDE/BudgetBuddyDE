'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {usePreferences} from '@/preferences/preferences-provider';
import {useTheme} from '@/theme/theme-provider';

const timeZones = ['Europe/Berlin', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo'];

export function PreferencesSettings() {
  const {preferences, setPreferences} = usePreferences();
  const {mode, setMode} = useTheme();
  const [draft, setDraft] = useState(preferences);
  const [saved, setSaved] = useState(false);
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">Display preferences</h2>
        <p className="text-sm text-muted-foreground">
          Used for dates, money, reports, and the application theme on this browser.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Locale
          <select
            aria-label="Locale"
            className="block h-9 w-full rounded-md border bg-background px-2"
            value={draft.locale}
            onChange={event => setDraft(current => ({...current, locale: event.target.value as typeof current.locale}))}
          >
            <option value="en-US">English (United States)</option>
            <option value="de-DE">Deutsch (Deutschland)</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Currency
          <select
            aria-label="Currency"
            className="block h-9 w-full rounded-md border bg-background px-2"
            value={draft.currency}
            onChange={event =>
              setDraft(current => ({...current, currency: event.target.value as typeof current.currency}))
            }
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Time zone
          <select
            aria-label="Time zone"
            className="block h-9 w-full rounded-md border bg-background px-2"
            value={draft.timeZone}
            onChange={event => setDraft(current => ({...current, timeZone: event.target.value}))}
          >
            {timeZones.map(zone => (
              <option key={zone}>{zone}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Color mode
          <select
            aria-label="Color mode"
            className="block h-9 w-full rounded-md border bg-background px-2"
            value={mode}
            onChange={event => setMode(event.target.value as typeof mode)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
      <Button
        onClick={() => {
          setPreferences(draft);
          setSaved(true);
        }}
      >
        Save preferences
      </Button>
      {saved ? (
        <p role="status" className="text-sm text-success">
          Preferences saved.
        </p>
      ) : null}
    </section>
  );
}
