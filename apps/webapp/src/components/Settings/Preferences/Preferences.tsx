'use client';

import {Alert, Autocomplete, Button, Stack, TextField, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Card} from '@/components/Card';
import {normalizeLocale} from '@/i18n/config';
import {setCurrentCurrency} from '@/utils/Formatter/preferenceFormat';

const currencies = ['EUR', 'USD'] as const;

export const Preferences = () => {
  const router = useRouter();
  const t = useTranslations('Preferences');
  const [language, setLanguage] = React.useState('en_US');
  const [currency, setCurrency] = React.useState<(typeof currencies)[number] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const [result, requestError] = await apiClient.backend.preference.get({cache: 'no-store'});
    if (requestError) {
      setError(t('loadError'));
    } else {
      setLanguage(result.data.language === 'en_US' ? 'en_US' : 'en_US');
      setCurrency(
        currencies.includes(result.data.currency as (typeof currencies)[number])
          ? (result.data.currency as (typeof currencies)[number])
          : 'EUR',
      );
      setCurrentCurrency(result.data.currency === 'USD' ? 'USD' : 'EUR');
      document.documentElement.lang = normalizeLocale(result.data.language);
    }
    setLoading(false);
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!currency) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const [result, requestError] = await apiClient.backend.preference.update({
      language,
      currency,
    });
    if (requestError) setError(t('saveError'));
    else {
      setLanguage(result.data.language === 'en_US' ? 'en_US' : 'en_US');
      setCurrency(
        currencies.includes(result.data.currency as (typeof currencies)[number])
          ? (result.data.currency as (typeof currencies)[number])
          : 'EUR',
      );
      setCurrentCurrency(result.data.currency === 'USD' ? 'USD' : 'EUR');
      document.documentElement.lang = normalizeLocale(result.data.language);
      setSuccess(true);
      router.refresh();
    }
    setSaving(false);
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
                <Button color="inherit" size="small" onClick={load}>
                  {t('retry')}
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          {success && <Alert severity="success">{t('saved')}</Alert>}
          <Autocomplete
            options={[{code: 'en_US', label: t('languageEnglish')}]}
            value={{code: language, label: t('languageEnglish')}}
            loading={loading}
            disabled={loading || saving}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            onChange={(_, value) => {
              setLanguage(value?.code ?? 'en_US');
              setSuccess(false);
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
            disabled={loading || saving}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            onChange={(_, value) => {
              setCurrency(value?.code ?? null);
              setSuccess(false);
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
        <Button variant="contained" onClick={save} disabled={loading || saving || !currency}>
          {saving ? t('saving') : t('save')}
        </Button>
      </Card.Footer>
    </Card>
  );
};
