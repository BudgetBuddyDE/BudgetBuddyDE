import {GenerateGenericStore} from '@/hooks/GenericHook';
import {logger} from '@/logger';

import {MetalService, type TMetalQuote} from './Metal.service';

export const useMetalQuoteStore = GenerateGenericStore<TMetalQuote[]>(async () => {
  const [result, error] = await MetalService.getQuotes();
  if (error) logger.error('Fetching of metal-quotes failed', error);
  return (result ?? []).filter(Boolean);
});
