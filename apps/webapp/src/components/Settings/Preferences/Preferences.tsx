'use client';

import type {TUpdatePreferencePayload} from '@budgetbuddyde/api';
import {Autocomplete, Alert, Box, Button, CircularProgress, MenuItem, Stack, TextField} from '@mui/material';
import React from 'react';
import {z} from 'zod';
import {Card} from '@/components/Card';
import {useSnackbarContext} from '@/components/Snackbar';
import {useAppTranslations} from '@/hooks/useAppTranslations';
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
  const t = useAppTranslations();
  const {preferences, isLoading, isSaving, error, reloadPreferences, updatePreferences} = usePreferences();
  const {showSnackbar} = useSnackbarContext();
  const fieldId = React.useId();
  const [validationErrors, setValidationErrors] = React.useState<Partial<Record<keyof PreferenceDraft, string>>>({});
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<PreferenceDraft | null>(null);
  const ownerId = preferences?.ownerId ?? null;
  const [ownerScope, setOwnerScope] = React.useState({ownerId});
  const currentOwnerScope = React.useRef(ownerScope);

  // Invalidate retained retry callbacks even when an owner leaves and later returns.
  if (ownerScope.ownerId !== ownerId) {
    const nextScope = {ownerId};
    currentOwnerScope.current = nextScope;
    setOwnerScope(nextScope);
    setDraft(preferences ? toDraft(preferences) : null);
    setEditing(false);
    setValidationErrors({});
  }

  React.useEffect(() => {
    if (!editing && preferences) setDraft(toDraft(preferences));
  }, [editing, preferences]);

  const saved = preferences && toDraft(preferences);
  const hasChanged = Boolean(
    saved &&
    draft &&
    (draft.language !== saved.language || draft.currency !== saved.currency || draft.timeZone !== saved.timeZone),
  );

  const saveChanges = async () => {
    if (!ownerId || currentOwnerScope.current !== ownerScope || !draft || !saved || !hasChanged) return;
    const payload: TUpdatePreferencePayload = {};
    if (draft.language !== saved.language) payload.language = draft.language;
    if (draft.currency !== saved.currency) payload.currency = draft.currency;
    if (draft.timeZone !== saved.timeZone) payload.timeZone = draft.timeZone;
    // Validate changed fields only so unsupported legacy values can stay untouched.
    const schema = z.object({
      language: z
        .string()
        .refine(
          value => LANGUAGE_OPTIONS.some(option => option.value === value),
          t('settings.preferences.chooseASupportedLanguage'),
        )
        .optional(),
      currency: z
        .string()
        .refine(
          value => CURRENCY_OPTIONS.some(option => option.value === value),
          t('settings.preferences.chooseASupportedCurrency'),
        )
        .optional(),
      timeZone: z
        .string()
        .refine(
          value => TIME_ZONE_OPTIONS.some(option => option.value === value),
          t('settings.preferences.chooseASupportedTimeZone'),
        )
        .optional(),
    });
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setValidationErrors(Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0], issue.message])));
      return;
    }
    setValidationErrors({});
    try {
      await updatePreferences(parsed.data);
      if (currentOwnerScope.current !== ownerScope) return;
      setEditing(false);
      showSnackbar({message: t('settings.preferences.preferencesSaved')});
    } catch (saveError) {
      if (currentOwnerScope.current !== ownerScope) return;
      const message =
        saveError instanceof Error ? saveError.message : t('settings.preferences.preferencesCouldNotBeSaved');
      showSnackbar({
        message,
        action: <Button onClick={() => void saveChanges()}>{t('settings.preferences.tryAgain')}</Button>,
      });
    }
  };

  const languageOption = draft
    ? (LANGUAGE_OPTIONS.find(option => option.value === draft.language) ?? {
        value: draft.language,
        label: t('settings.preferences.unsupportedValue', {value: draft.language}),
      })
    : null;
  const timeZoneOption = draft
    ? (TIME_ZONE_OPTIONS.find(option => option.value === draft.timeZone) ?? {
        value: draft.timeZone,
        label: t('settings.preferences.unsupportedValue', {value: draft.timeZone}),
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
          <Card.Title>{t('settings.preferences.preferences')}</Card.Title>
          <Card.Subtitle>{t('settings.preferences.manageYourPersonalPreferences')}</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        <Stack spacing={2} sx={{pt: 1}}>
          <Alert severity="info">
            {t('settings.preferences.languageCurrencyAndTimeZoneAreSavedToYourAccountAndAppliedThroughoutTheApp')}
          </Alert>
          {isLoading && !preferences ? (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 3}}>
              <CircularProgress aria-label={t('settings.preferences.loadingPreferences')} />
            </Box>
          ) : error && !preferences ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => void reloadPreferences()}>
                  {t('settings.preferences.tryAgain')}
                </Button>
              }
            >
              {t('settings.preferences.preferencesCouldNotBeLoadedError', {error})}
            </Alert>
          ) : preferences && draft ? (
            <>
              {error && (
                <Alert severity="warning">{t('settings.preferences.preferencesMayBeOutOfDateError', {error})}</Alert>
              )}
              <Autocomplete
                id={`${fieldId}-language`}
                options={languageOptions}
                value={languageOption}
                getOptionLabel={option => {
                  const supported = LANGUAGE_OPTIONS.find(supported => supported.value === option.value);
                  return supported ? t(supported.labelKey) : 'label' in option ? option.label : t(option.labelKey);
                }}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                getOptionDisabled={option => !LANGUAGE_OPTIONS.some(supported => supported.value === option.value)}
                readOnly={!editing || isSaving}
                onChange={(_, option) => option && setDraft(current => current && {...current, language: option.value})}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('settings.preferences.language')}
                    error={!!validationErrors.language}
                    helperText={validationErrors.language}
                  />
                )}
              />
              <TextField
                select
                fullWidth
                id={`${fieldId}-currency`}
                label={t('settings.preferences.currency')}
                error={!!validationErrors.currency}
                value={draft.currency}
                disabled={!editing || isSaving}
                onChange={event => setDraft(current => current && {...current, currency: event.target.value})}
                helperText={
                  validationErrors.currency ??
                  (CURRENCY_OPTIONS.some(option => option.value === draft.currency)
                    ? undefined
                    : t('settings.preferences.unsupportedSavedValueValue', {value: draft.currency}))
                }
              >
                {!CURRENCY_OPTIONS.some(option => option.value === draft.currency) && (
                  <MenuItem value={draft.currency} disabled>
                    {t('settings.preferences.unsupportedValue', {value: draft.currency})}
                  </MenuItem>
                )}
                {CURRENCY_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                id={`${fieldId}-time-zone`}
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
                    label={t('settings.preferences.timeZone')}
                    error={!!validationErrors.timeZone}
                    helperText={
                      validationErrors.timeZone ??
                      (TIME_ZONE_OPTIONS.some(option => option.value === draft.timeZone)
                        ? undefined
                        : t('settings.preferences.unsupportedSavedValueValue', {value: draft.timeZone}))
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
                  setValidationErrors({});
                  setDraft(toDraft(preferences));
                  setEditing(false);
                }}
              >
                {t('settings.preferences.discard')}
              </Button>
              <Button variant="contained" disabled={!hasChanged || isSaving} onClick={() => void saveChanges()}>
                {isSaving ? <CircularProgress size={18} color="inherit" /> : t('settings.preferences.saveChanges')}
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={() => setEditing(true)}>
              {t('settings.preferences.edit')}
            </Button>
          )}
        </Card.Footer>
      )}
    </Card>
  );
}
