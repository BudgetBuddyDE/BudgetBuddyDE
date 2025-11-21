/** biome-ignore-all lint/suspicious/noExplicitAny: Can't improve typing because this is a pretty generic middleware */
import type {Request, RequestHandler, Response} from 'express';
import type {ParamsDictionary} from 'express-serve-static-core';
import type {ZodError, ZodType, z} from 'zod';

type NonReadOnly<T> = {-readonly [P in keyof T]: NonReadOnly<T[P]>};

export function stripReadOnly<T>(readOnlyItem: T): NonReadOnly<T> {
  return readOnlyItem as NonReadOnly<T>;
}

export declare type RequestValidation<TParams, TQuery, TBody> = {
  params?: ZodType<TParams>;
  query?: ZodType<TQuery>;
  body?: ZodType<TBody>;
};
export declare type RequestProcessing<TParams, TQuery, TBody> = {
  params?: ZodType<any, TParams>;
  query?: ZodType<any, TQuery>;
  body?: ZodType<any, TBody>;
};

export declare type TypedRequest<
  TParams extends ZodType<any, any>,
  TQuery extends ZodType<any, any>,
  TBody extends ZodType<any, any>,
> = Request<z.infer<TParams>, any, z.infer<TBody>, z.infer<TQuery>>;

export declare type TypedRequestBody<TBody extends ZodType<any, any>> = Request<
  ParamsDictionary,
  any,
  z.infer<TBody>,
  any
>;

export declare type TypedRequestParams<TParams extends ZodType<any, any>> = Request<z.infer<TParams>, any, any, any>;
export declare type TypedRequestQuery<TQuery extends ZodType<any, any>> = Request<
  ParamsDictionary,
  any,
  any,
  z.infer<TQuery>
>;

type ErrorListItem = {type: 'Query' | 'Params' | 'Body'; errors: ZodError<any>};

export const sendErrors: (errors: Array<ErrorListItem>, res: Response) => void = (errors, res) => {
  return res.status(400).send(errors.map(error => ({type: error.type, errors: error.errors})));
};
export const sendError: (error: ErrorListItem, res: Response) => void = (error, res) => {
  return res.status(400).send({type: error.type, errors: error.errors});
};

export function processRequestBody<TBody>(effects: ZodType<TBody>): RequestHandler<ParamsDictionary, any, TBody, any>;
export function processRequestBody<TBody>(
  effects: ZodType<any, TBody>,
): RequestHandler<ParamsDictionary, any, TBody, any>;
export function processRequestBody<TBody>(
  effectsSchema: ZodType<any, TBody> | ZodType<TBody>,
): RequestHandler<ParamsDictionary, any, TBody, any> {
  return (req, res, next) => {
    const parsed = effectsSchema.safeParse(req.body);
    if (parsed.success) {
      req.body = parsed.data;
      return next();
    } else {
      return sendErrors([{type: 'Body', errors: parsed.error}], res);
    }
  };
}

export function processRequestParams<TParams>(effects: ZodType<TParams>): RequestHandler<TParams, any, any, any>;
export function processRequestParams<TParams>(effects: ZodType<any, TParams>): RequestHandler<TParams, any, any, any>;
export function processRequestParams<TParams>(
  effectsSchema: ZodType<any, TParams> | ZodType<TParams>,
): RequestHandler<TParams, any, any, any> {
  return (req, res, next) => {
    const parsed = effectsSchema.safeParse(req.params);
    if (parsed.success) {
      req.params = parsed.data;
      return next();
    } else {
      return sendErrors([{type: 'Params', errors: parsed.error}], res);
    }
  };
}

export function processRequestQuery<TQuery>(
  effects: ZodType<TQuery>,
): RequestHandler<ParamsDictionary, any, any, TQuery>;
export function processRequestQuery<TQuery>(
  effects: ZodType<any, TQuery>,
): RequestHandler<ParamsDictionary, any, any, TQuery>;
export function processRequestQuery<TQuery>(
  effectsSchema: ZodType<any, TQuery> | ZodType<TQuery>,
): RequestHandler<ParamsDictionary, any, any, TQuery> {
  return (req, res, next) => {
    const parsed = effectsSchema.safeParse(req.query);
    if (parsed.success) {
      req.query = parsed.data;
      return next();
    } else {
      return sendErrors([{type: 'Query', errors: parsed.error}], res);
    }
  };
}

export function processRequest<TParams = any, TQuery = any, TBody = any>(
  schemas: RequestProcessing<TParams, TQuery, TBody>,
): RequestHandler<TParams, any, TBody, TQuery>;
export function processRequest<TParams = any, TQuery = any, TBody = any>(
  schemas: RequestValidation<TParams, TQuery, TBody>,
): RequestHandler<TParams, any, TBody, TQuery>;
export function processRequest<TParams = any, TQuery = any, TBody = any>(
  schemas: RequestValidation<TParams, TQuery, TBody> | RequestProcessing<TParams, TQuery, TBody>,
): RequestHandler<TParams, any, TBody, TQuery> {
  return (req, res, next) => {
    const errors: Array<ErrorListItem> = [];
    if (schemas.params) {
      const parsed = schemas.params.safeParse(req.params);
      if (parsed.success) {
        req.params = parsed.data;
      } else {
        errors.push({type: 'Params', errors: parsed.error});
      }
    }
    if (schemas.query) {
      const parsed = schemas.query.safeParse(req.query);
      if (parsed.success) {
        req.query = parsed.data;
      } else {
        errors.push({type: 'Query', errors: parsed.error});
      }
    }
    if (schemas.body) {
      const parsed = schemas.body.safeParse(req.body);
      if (parsed.success) {
        req.body = parsed.data;
      } else {
        errors.push({type: 'Body', errors: parsed.error});
      }
    }
    if (errors.length > 0) {
      return sendErrors(errors, res);
    }
    return next();
  };
}

export const validateRequestBody: <TBody>(
  zodSchema: ZodType<TBody>,
) => RequestHandler<ParamsDictionary, any, TBody, any> = schema => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (parsed.success) {
    return next();
  } else {
    return sendErrors([{type: 'Body', errors: parsed.error}], res);
  }
};

export const validateRequestParams: <TParams>(zodSchema: ZodType<TParams>) => RequestHandler<TParams, any, any, any> =
  schema => (req, res, next) => {
    const parsed = schema.safeParse(req.params);
    if (parsed.success) {
      return next();
    } else {
      return sendErrors([{type: 'Params', errors: parsed.error}], res);
    }
  };

export const validateRequestQuery: <TQuery>(
  zodSchema: ZodType<TQuery>,
) => RequestHandler<ParamsDictionary, any, any, TQuery> = schema => (req, res, next) => {
  const parsed = schema.safeParse(req.query);
  if (parsed.success) {
    return next();
  } else {
    return sendErrors([{type: 'Query', errors: parsed.error}], res);
  }
};

export const validateRequest: <TParams = any, TQuery = any, TBody = any>(
  schemas: RequestValidation<TParams, TQuery, TBody>,
) => RequestHandler<TParams, any, TBody, TQuery> =
  ({params, query, body}) =>
  (req, res, next) => {
    const errors: Array<ErrorListItem> = [];
    if (params) {
      const parsed = params.safeParse(req.params);
      if (!parsed.success) {
        errors.push({type: 'Params', errors: parsed.error});
      }
    }
    if (query) {
      const parsed = query.safeParse(req.query);
      if (!parsed.success) {
        errors.push({type: 'Query', errors: parsed.error});
      }
    }
    if (body) {
      const parsed = body.safeParse(req.body);
      if (!parsed.success) {
        errors.push({type: 'Body', errors: parsed.error});
      }
    }
    if (errors.length > 0) {
      return sendErrors(errors, res);
    }
    return next();
  };
