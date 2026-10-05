import type {Response} from 'express';
import {ZodError} from 'zod';
import {ApiResponse} from '../models';

/** Matches the existing REST wire representation without requiring an HTTP response. */
export function normalizeResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
  if (!response.message) delete (response as Partial<ApiResponse<T>>).message;
  if (!response.error) delete (response as Partial<ApiResponse<T>>).error;
  if (!response.from) delete (response as Partial<ApiResponse<T>>).from;
  return response;
}

export function sendDomainResponse<T>(res: Response, response: ApiResponse<T>): void {
  res.locals.domainMutationHandled = true;
  res.status(response.status).json(normalizeResponse(response)).end();
}

export async function executeDomain<T>(res: Response, operation: () => Promise<ApiResponse<T>>): Promise<void> {
  try {
    sendDomainResponse(res, await operation());
  } catch (error) {
    const response =
      error instanceof ZodError
        ? ApiResponse.builder().withStatus(400).withMessage('Validation Error').withData(error.issues).build()
        : ApiResponse.builder()
            .fromError(error instanceof Error ? error : new Error(String(error)))
            .build();
    sendDomainResponse(res, response);
  }
}
