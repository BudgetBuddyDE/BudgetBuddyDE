'use client';

import {useContext} from 'react';
import {AppTranslationContext} from '@/components/I18n/AppTranslationContext';

export function useAppTranslations() {
  return useContext(AppTranslationContext);
}
