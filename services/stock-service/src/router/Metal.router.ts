import {ApiResponse, HTTPStatusCode} from '@budgetbuddyde/types';
import express from 'express';

import {MetalCache, MetalOptions, MetalService} from '../services';

const router = express.Router();
const MetCache = new MetalCache();

router.get('/quotes', async (req, res) => {
  const metals = Object.keys(MetalOptions);
  const prices = await Promise.all(
    metals
      .map(async metal => {
        const CacheServicedValue = await MetCache.get(metal);
        if (CacheServicedValue) return MetalService.getMetalWithQuote(metal, CacheServicedValue);

        const price = await MetalService.getPrice(metal);
        if (!price || !price.success) return null;

        await MetCache.set(metal, price.rates);
        return MetalService.getMetalWithQuote(metal, price.rates);
      })
      .filter(Boolean),
  );

  return res.json(ApiResponse.builder().withData(prices).build());
});

router.get('/quote/:metal', async (req, res) => {
  const metal = req.params.metal;
  let prices = {EUR: 0, USD: 0};

  const CacheServicedValue = await MetCache.get(metal);

  if (!CacheServicedValue) {
    const price = await MetalService.getPrice(metal);
    if (!price || !price.success) {
      return res
        .status(HTTPStatusCode.NotFound)
        .json(ApiResponse.builder().withStatus(HTTPStatusCode.NotFound).withMessage('Metal not found').build());
    }
    await MetCache.set(metal, price.rates);
    prices = price.rates;
  }
  prices = CacheServicedValue || prices;

  return res.json(ApiResponse.builder().withData(MetalService.getMetalWithQuote(metal, prices)).build());
});

router.get('/options', (_req, res) => {
  return res.json(ApiResponse.builder().withData(MetalService.getOptions()).build());
});

export default router;
