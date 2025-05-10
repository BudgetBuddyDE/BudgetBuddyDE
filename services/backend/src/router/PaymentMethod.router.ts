import {Router} from 'express';

import {type TInsertCategory, ZInsertPaymentMethod} from '../db/schema';
import {hasEntityId} from '../middleware';
import {ApiResponse} from '../models/ApiResponse';
import {User} from '../models/User.model';
import {PaymentMethodService} from '../service';

const router = Router();

const paymentMethodService = new PaymentMethodService();

router.get('/search', async (req, res) => {
  const {query} = req.query;
  return ApiResponse.builder()
    .withMessage(`Results for '${query}'`)
    .withData({
      query,
      results: await paymentMethodService.search(query as string, ['name', 'address', 'provider', 'description']),
    })
    .withExpressResponse(res)
    .buildAndSend();
});

router.get('/', async (_req, res) => {
  return ApiResponse.builder()
    .withData(await paymentMethodService.getAll())
    .withExpressResponse(res)
    .buildAndSend();
});

router.get('/:id', hasEntityId, async (req, res) => {
  const {id} = req.params;
  const result = await paymentMethodService.getById(Number(id));
  return ApiResponse.builder()
    .withStatus(result ? 200 : 404)
    .withData(result)
    .withExpressResponse(res)
    .buildAndSend();
});

router.post('/', async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const result = await paymentMethodService.create<TInsertCategory>(
    Array.isArray(payload) ? payload : [payload],
    ZInsertPaymentMethod,
    user as User,
  );
  return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
});

router.put('/:id', hasEntityId, async (req, res) => {
  const {id} = req.params;
  const payload = req.body;
  const result = await paymentMethodService.updateById(Number(id), payload);
  return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
});

router.delete('/:id', hasEntityId, async (req, res) => {
  const {id} = req.params;
  const result = await paymentMethodService.deleteById(Number(id));
  return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
});

export default router;
