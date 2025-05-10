import {Router} from 'express';

import {type TInsertCategory, ZInsertCategory} from '../db/schema';
import {hasEntityId} from '../middleware';
import {ApiResponse} from '../models/ApiResponse';
import {User} from '../models/User.model';
import {CategoryService} from '../service';

const router = Router();

const categoryService = new CategoryService();

router.get('/search', async (req, res) => {
  const {query} = req.query;
  return ApiResponse.builder()
    .withMessage(`Results for '${query}'`)
    .withData({
      query,
      results: await categoryService.search(query as string, ['name', 'description']),
    })
    .withExpressResponse(res)
    .buildAndSend();
});

router.get('/', async (_req, res) => {
  return ApiResponse.builder()
    .withData(await categoryService.getAll())
    .withExpressResponse(res)
    .buildAndSend();
});

router.get('/:id', hasEntityId, async (req, res) => {
  const {id} = req.params;
  const result = await categoryService.getById(Number(id));
  return ApiResponse.builder()
    .withStatus(result ? 200 : 404)
    .withData(result)
    .withExpressResponse(res)
    .buildAndSend();
});

router.post('/', async (req, res) => {
  const payload = req.body;
  const user = req.user;
  const result = await categoryService.create<TInsertCategory>(
    Array.isArray(payload) ? payload : [payload],
    ZInsertCategory,
    user as User,
  );
  return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
});

router.put('/:id', hasEntityId, async (req, res) => {
  const {id} = req.params;
  const payload = req.body;
  const result = await categoryService.updateById(Number(id), payload);
  return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
});

router.delete('/:id', hasEntityId, async (req, res) => {
  const {id} = req.params;
  const result = await categoryService.deleteById(Number(id));
  return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
});

export default router;
