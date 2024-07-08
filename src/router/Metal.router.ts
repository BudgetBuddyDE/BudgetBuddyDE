import {ApiResponse, HTTPStatusCode} from '@budgetbuddyde/types';
import express from 'express';

import {Cache} from '../cache';
import {MetalOptions, MetalService} from '../services/Metal.service';

const router = express.Router();

router.get('/quotes', async (req, res) => {
  const metals = Object.keys(MetalOptions);
  const prices = await Promise.all(
    metals
      .map(async metal => {
        const cachedValue = await Cache.getMetalPrice(metal);
        if (cachedValue) return MetalService.getMetalWithQuote(metal, cachedValue);

        const price = await MetalService.getPrice(metal);
        if (!price || !price.success) return null;

        await Cache.setMetalPrice(metal, price.rates);
        return MetalService.getMetalWithQuote(metal, price.rates);
      })
      .filter(Boolean),
  );

  return res.json(ApiResponse.builder().withData(prices).build());
});

router.get('/quote/:metal', async (req, res) => {
  const metal = req.params.metal;
  let prices = {EUR: 0, USD: 0};

  const cachedValue = await Cache.getMetalPrice(metal);

  if (!cachedValue) {
    const price = await MetalService.getPrice(metal);
    if (!price || !price.success) {
      return res
        .status(HTTPStatusCode.NotFound)
        .json(ApiResponse.builder().withStatus(HTTPStatusCode.NotFound).withMessage('Metal not found').build());
    }
    await Cache.setMetalPrice(metal, price.rates);
    prices = price.rates;
  }
  prices = cachedValue || prices;

  return res.json(ApiResponse.builder().withData(MetalService.getMetalWithQuote(metal, prices)).build());
});

router.get('/options', (_req, res) => {
  return res.json(ApiResponse.builder().withData(MetalService.getOptions()).build());
});

export default router;
