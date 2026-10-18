import {UpdatePreferencePayload} from '@budgetbuddyde/api/preference';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import * as preferenceDomain from '../domain/preference';
import {sendDomainResponse} from '../domain/response';
import {ApiResponse, HTTPStatusCode} from '../models';

export const preferenceRouter = Router();

preferenceRouter.get('/', async (req, res, next) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }
  try {
    sendDomainResponse(res, await preferenceDomain.get(userId));
  } catch (error) {
    next(error);
  }
});

preferenceRouter.put('/', validateRequest({body: UpdatePreferencePayload}), async (req, res, next) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }
  try {
    sendDomainResponse(res, await preferenceDomain.update(userId, req.body));
  } catch (error) {
    next(error);
  }
});
