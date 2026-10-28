'use client';

import {Alert, Autocomplete, Button, Stack, TextField, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Card} from '@/components/Card';
import {useSnackbarContext} from '@/components/Snackbar';
import {normalizeLocale, toPreferenceLanguage} from '@/i18n/config';
import {setCurrentCurrency, setCurrentLocale} from '@/utils/Formatter/preferenceFormat';

const currencies = ['EUR', 'USD'] as const;
const languages = ['en-US', 'de-DE'] as const;

function setCurrentLanguage(language: string) {
  const locale = normalizeLocale(language);
  setCurrentLocale(locale);
}

export const UserPreferences = () => {
  const router = useRouter();
  const t = useTranslations('Preferences');
  const {showSnackbar} = useSnackbarContext();
  const [language, setLanguage] = React.useState<(typeof languages)[number]>('en-US');
  const [currency, setCurrency] = React.useState<(typeof currencies)[number] | null>(null);
  const [savedLanguage, setSavedLanguage] = React.useState<(typeof languages)[number]>('en-US');
  const [savedCurrency, setSavedCurrency] = React.useState<(typeof currencies)[number] | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const [result, requestError] = await apiClient.backend.preference.get({cache: 'no-store'});
    if (requestError) {
      setError(t('loadError'));
    } else {
      const nextLanguage = normalizeLocale(result.data.language);
      const nextCurrency = currencies.includes(result.data.currency as (typeof currencies)[number])
        ? (result.data.currency as (typeof currencies)[number])
        : 'EUR';
      setLanguage(nextLanguage);
      setSavedLanguage(nextLanguage);
      setCurrency(nextCurrency);
      setSavedCurrency(nextCurrency);
      setCurrentCurrency(result.data.currency === 'USD' ? 'USD' : 'EUR');
      setCurrentLanguage(nextLanguage);
    }
    setLoading(false);
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!currency || !isEditing) return;
    setSaving(true);
    setError(null);
    const [result, requestError] = await apiClient.backend.preference.update({
      language: toPreferenceLanguage(language),
      currency,
    });
    if (requestError) setError(t('saveError'));
    else {
      const nextLanguage = normalizeLocale(result.data.language);
      const nextCurrency = currencies.includes(result.data.currency as (typeof currencies)[number])
        ? (result.data.currency as (typeof currencies)[number])
        : 'EUR';
      setLanguage(nextLanguage);
      setSavedLanguage(nextLanguage);
      setCurrency(nextCurrency);
      setSavedCurrency(nextCurrency);
      setCurrentCurrency(result.data.currency === 'USD' ? 'USD' : 'EUR');
      setCurrentLanguage(nextLanguage);
      setIsEditing(false);
      showSnackbar({message: t('saved')});
      router.refresh();
    }
    setSaving(false);
  };

  const handleEdit = () => {
    setError(null);
    setIsEditing(true);
  };

  const handleDiscard = () => {
    setLanguage(savedLanguage);
    setCurrency(savedCurrency);
    setError(null);
    setIsEditing(false);
    showSnackbar({message: t('discarded')});
  };

  const handleLoadRetry = async () => {
    await load();
    setIsEditing(false);
  };

  return (
    <Card>
      <Card.Header>
        <div>
          <Card.Title>{t('title')}</Card.Title>
          <Card.Subtitle>{t('description')}</Card.Subtitle>
        </div>
      </Card.Header>
      <Card.Body>
        <Stack spacing={2}>
          {error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={handleLoadRetry}>
                  {t('retry')}
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          <Autocomplete
            options={languages.map(code => ({code, label: t(code === 'en-US' ? 'languageEnglish' : 'languageGerman')}))}
            value={{code: language, label: t(language === 'en-US' ? 'languageEnglish' : 'languageGerman')}}
            loading={loading}
            disabled={loading || saving || !isEditing}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            onChange={(_, value) => {
              setLanguage(value?.code ?? 'en-US');
            }}
            renderInput={params => (
              <TextField
                {...params}
                label={t('language')}
                slotProps={{
                  ...params.slotProps,
                  htmlInput: {...params.slotProps.htmlInput, 'aria-label': t('language')},
                }}
              />
            )}
          />
          <Autocomplete
            options={currencies.map(code => ({code, label: t(code === 'EUR' ? 'currencyEuro' : 'currencyUsd')}))}
            value={currency ? {code: currency, label: t(currency === 'EUR' ? 'currencyEuro' : 'currencyUsd')} : null}
            loading={loading}
            disabled={loading || saving || !isEditing}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            onChange={(_, value) => {
              setCurrency(value?.code ?? null);
            }}
            renderInput={params => (
              <TextField
                {...params}
                label={t('currency')}
                slotProps={{
                  ...params.slotProps,
                  htmlInput: {...params.slotProps.htmlInput, 'aria-label': t('currency')},
                }}
              />
            )}
          />
          {loading && <Typography role="status">{t('loading')}</Typography>}
        </Stack>
      </Card.Body>
      <Card.Footer sx={{justifyContent: 'flex-end', mt: 2}}>
        {isEditing ? (
          <Stack direction="row" spacing={1}>
            <Button variant="text" onClick={handleDiscard} disabled={loading || saving}>
              {t('discard')}
            </Button>
            <Button variant="contained" onClick={save} disabled={loading || saving || !currency}>
              {saving ? t('saving') : t('save')}
            </Button>
          </Stack>
        ) : (
          <Button variant="contained" onClick={handleEdit} disabled={loading || saving || !currency}>
            {t('edit')}
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};
