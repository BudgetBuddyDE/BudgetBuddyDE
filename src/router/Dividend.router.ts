import {z} from 'zod';
import express from 'express';
import {ApiResponse, HTTPStatusCode} from '@budgetbuddyde/types';
import {StockService} from '../services';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = req.query;
  if (!query || !query.assets) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.BadRequest)
          .withMessage("Missing 'assets' query parameter")
          .build(),
      );
  } else if (!z.array(z.string()).or(z.string()).safeParse(query.assets).success) {
    return res
      .status(HTTPStatusCode.BadRequest)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.BadRequest).withMessage("Invalid 'assets' provided").build(),
      );
  }

  const assets = query.assets as string | string[];
  const [dividends, error] = await StockService.getDividends(Array.isArray(assets) ? assets : [assets]);
  if (error) {
    return res
      .status(HTTPStatusCode.InternalServerError)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.InternalServerError).withMessage(error.message).build());
  }
  return res.json(ApiResponse.builder().withData(dividends).build());
});

export default router;
