'use client';

import {createContext} from 'react';
import {englishTranslator} from '@/i18n/translate';

export const AppTranslationContext = createContext(englishTranslator);
