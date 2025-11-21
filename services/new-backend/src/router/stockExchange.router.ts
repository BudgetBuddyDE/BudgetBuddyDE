import {createSelectSchema} from 'drizzle-zod';
import {Router} from 'express';
import z from 'zod';
import {db} from '../db';
import {stockExchanges} from '../db/schema';
import {validateRequest} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';

export const stockExchangeRouter = Router();

stockExchangeRouter.get('/', async (_req, res) => {
  const records = await db.query.stockExchanges.findMany();

  ApiResponse.builder<typeof records>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage('Fetched stock exchanges successfully')
    .withData(records)
    .withFrom('db')
    .buildAndSend(res);
});

stockExchangeRouter.get(
  '/:symbol',
  validateRequest({
    params: z.object({
      symbol: createSelectSchema(stockExchanges).shape.symbol,
    }),
  }),

  async (req, res) => {
    const symbol = req.params.symbol;
    const record = await db.query.stockExchanges.findFirst({
      where(fields, operators) {
        return operators.eq(fields.symbol, symbol);
      },
    });
    if (!record) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Stock exchange ${symbol} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }
    ApiResponse.builder<typeof record>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Fetched stock exchange successfully')
      .withData(record)
      .withFrom('db')
      .buildAndSend(res);
  },
);
