import {Router} from 'express';

import {type TInsertCategory, ZInsertCategory} from '../db/schema';
import {ApiResponse} from '../models/ApiResponse';
import {CategoryService} from '../service';

const router = Router();

const categoryService = new CategoryService();

router.get('/search', async (req, res) => {
  const {query} = req.query;
  const matches = await categoryService.search(query as string);
  return ApiResponse.builder()
    .withMessage(`Results for '${query}'`)
    .withData({query, results: matches})
    .withExpressResponse(res)
    .buildAndSend();
});

router.get('/', async (_req, res) => {
  const results = await categoryService.getAll();
  return ApiResponse.builder().withData(results).withExpressResponse(res).buildAndSend();
});

router.get('/:id', async (req, res) => {
  const {id} = req.params;
  const parsedId = Number(id);
  if (isNaN(parsedId)) {
    return ApiResponse.builder()
      .withStatus(400)
      .withMessage('Invalid ID format')
      .withExpressResponse(res)
      .buildAndSend();
  }
  const result = await categoryService.getById(parsedId);
  return ApiResponse.builder()
    .withStatus(result ? 200 : 404)
    .withData(result)
    .withExpressResponse(res)
    .buildAndSend();
});

router.post('/', (req, res) => {
  const payload = req.body;
  const result = categoryService.create<TInsertCategory>(payload, ZInsertCategory);
  return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
});

router.put('/:id', (req, res) => {
  const entityId = req.params;
  const payload = req.body;

  const parsedId = Number(entityId);
  if (isNaN(parsedId)) {
    return ApiResponse.builder()
      .withStatus(400)
      .withMessage('Invalid ID format')
      .withExpressResponse(res)
      .buildAndSend();
  }

  const result = categoryService.updateById(parsedId, payload);
  return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
});

router.delete('/:id', (req, res) => {
  const {id} = req.params;
  const parsedId = Number(id);
  if (isNaN(parsedId)) {
    return ApiResponse.builder()
      .withStatus(400)
      .withMessage('Invalid ID format')
      .withExpressResponse(res)
      .buildAndSend();
  }

  const result = categoryService.deleteById(parsedId);
  return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
});

export default router;
