'use client';

import type {TUpdatePreferencePayload} from '@budgetbuddyde/api';
import {Autocomplete, Alert, Box, Button, CircularProgress, MenuItem, Stack, TextField} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {useSnackbarContext} from '@/components/Snackbar';
import {usePreferences} from '@/hooks/usePreferences';
import {CURRENCY_OPTIONS, LANGUAGE_OPTIONS, TIME_ZONE_OPTIONS} from '@/lib/preferences/constants';

type PreferenceDraft = {
  language: string;
  currency: string;
  timeZone: string;
};

const toDraft = (value: {language: string; currency: string; timeZone: string}): PreferenceDraft => ({
  language: value.language,
  currency: value.currency,
  timeZone: value.timeZone,
});

export function Preferences() {
  const {preferences, isLoading, isSaving, error, reloadPreferences, updatePreferences} = usePreferences();
  const {showSnackbar} = useSnackbarContext();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<PreferenceDraft | null>(null);

  React.useEffect(() => {
    if (!editing && preferences) setDraft(toDraft(preferences));
  }, [editing, preferences]);

  const saved = preferences && toDraft(preferences);
  const changed = Boolean(
    saved &&
    draft &&
    (draft.language !== saved.language || draft.currency !== saved.currency || draft.timeZone !== saved.timeZone),
  );

  const saveChanges = async () => {
    if (!draft || !saved || !changed) return;
    const payload: TUpdatePreferencePayload = {};
    if (draft.language !== saved.language) payload.language = draft.language;
    if (draft.currency !== saved.currency) payload.currency = draft.currency;
    if (draft.timeZone !== saved.timeZone) payload.timeZone = draft.timeZone;
    try {
      await updatePreferences(payload);
      setEditing(false);
      showSnackbar({message: 'Preferences saved.'});
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Preferences could not be saved.';
      showSnackbar({message, action: <Button onClick={() => void saveChanges()}>Try again</Button>});
    }
  };

  const languageOption = draft
    ? (LANGUAGE_OPTIONS.find(option => option.value === draft.language) ?? {
        value: draft.language,
        label: `Unsupported (${draft.language})`,
      })
    : null;
  const timeZoneOption = draft
    ? (TIME_ZONE_OPTIONS.find(option => option.value === draft.timeZone) ?? {
        value: draft.timeZone,
        label: `Unsupported (${draft.timeZone})`,
      })
    : null;
  const languageOptions =
    languageOption && !LANGUAGE_OPTIONS.some(option => option.value === languageOption.value)
      ? [...LANGUAGE_OPTIONS, languageOption]
      : LANGUAGE_OPTIONS;
  const timeZoneOptions =
    timeZoneOption && !TIME_ZONE_OPTIONS.some(option => option.value === timeZoneOption.value)
      ? [...TIME_ZONE_OPTIONS, timeZoneOption]
      : TIME_ZONE_OPTIONS;

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Preferences</Card.Title>
          <Card.Subtitle>Manage your personal preferences</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        <Stack spacing={2} sx={{pt: 1}}>
          <Alert severity="info">
            These preferences are saved to your account. Their effect across the app will follow.
          </Alert>
          {isLoading && !preferences ? (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 3}}>
              <CircularProgress aria-label="Loading preferences" />
            </Box>
          ) : error && !preferences ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => void reloadPreferences()}>
                  Try again
                </Button>
              }
            >
              Preferences could not be loaded: {error}
            </Alert>
          ) : preferences && draft ? (
            <>
              {error && <Alert severity="warning">Preferences may be out of date: {error}</Alert>}
              <Autocomplete
                options={languageOptions}
                value={languageOption}
                getOptionLabel={option => option.label}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                getOptionDisabled={option => !LANGUAGE_OPTIONS.some(supported => supported.value === option.value)}
                readOnly={!editing || isSaving}
                onChange={(_, option) => option && setDraft(current => current && {...current, language: option.value})}
                renderInput={params => <TextField {...params} label="Language" />}
              />
              <TextField
                select
                fullWidth
                label="Currency"
                value={draft.currency}
                disabled={!editing || isSaving}
                onChange={event => setDraft(current => current && {...current, currency: event.target.value})}
                helperText={
                  CURRENCY_OPTIONS.some(option => option.value === draft.currency)
                    ? undefined
                    : `Unsupported saved value: ${draft.currency}`
                }
              >
                {!CURRENCY_OPTIONS.some(option => option.value === draft.currency) && (
                  <MenuItem value={draft.currency}>Unsupported ({draft.currency})</MenuItem>
                )}
                {CURRENCY_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                options={timeZoneOptions}
                value={timeZoneOption}
                getOptionLabel={option => option.label}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                getOptionDisabled={option => !TIME_ZONE_OPTIONS.some(supported => supported.value === option.value)}
                readOnly={!editing || isSaving}
                onChange={(_, option) => option && setDraft(current => current && {...current, timeZone: option.value})}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Time zone"
                    helperText={
                      TIME_ZONE_OPTIONS.some(option => option.value === draft.timeZone)
                        ? undefined
                        : `Unsupported saved value: ${draft.timeZone}`
                    }
                  />
                )}
              />
            </>
          ) : null}
        </Stack>
      </Card.Body>
      {preferences && draft && (
        <Card.Footer sx={{display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1}}>
          {editing ? (
            <>
              <Button
                disabled={isSaving}
                onClick={() => {
                  setDraft(toDraft(preferences));
                  setEditing(false);
                }}
              >
                Discard
              </Button>
              <Button variant="contained" disabled={!changed || isSaving} onClick={() => void saveChanges()}>
                {isSaving ? <CircularProgress size={18} color="inherit" /> : 'Save changes'}
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </Card.Footer>
      )}
    </Card>
  );
}
