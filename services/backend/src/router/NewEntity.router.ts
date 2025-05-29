import {PgTable} from 'drizzle-orm/pg-core';
import {type Express, type NextFunction, type Request, type Response, Router} from 'express';

import {type TInsertCategory, ZInsertCategory} from '../db/schema';
import {hasEntityId} from '../middleware';
import {ApiResponse} from '../models/ApiResponse';
import {User} from '../models/User.model';
import {NewCRUDService} from '../service/interfaces/NewCRUD.service';

type TRouteHandler<T = void> = (req: Request, res: Response, next: NextFunction) => T;
type TCustomHandler = TRouteHandler<Promise<void> | void>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export class EntityRouter<Entity extends PgTable> {
  public readonly router: Router;
  public readonly basePath: string;
  public readonly service: NewCRUDService<Entity>;

  constructor(service: NewCRUDService<Entity>, basePath: string) {
    this.service = service;
    this.basePath = basePath;
    this.router = Router();
  }

  static builder<TService extends NewCRUDService<any>>(service: TService, basePath: string) {
    return new EntityRouterBuilder(service, basePath);
  }

  static getDefaultEndpointPath(endpoint: 'search' | 'get_all' | 'get_by_id' | 'create' | 'update' | 'delete'): string {
    switch (endpoint) {
      case 'search':
        return '/search';

      case 'create':
      case 'get_all':
        return '/';

      case 'get_by_id':
      case 'update':
      case 'delete':
        return '/:id';

      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  }

  getDefaultEndpointPath(
    ...params: Parameters<typeof EntityRouter.getDefaultEndpointPath>
  ): ReturnType<typeof EntityRouter.getDefaultEndpointPath> {
    return EntityRouter.getDefaultEndpointPath(...params);
  }

  addMiddleware(middleware: TRouteHandler) {
    this.router.use(middleware);
  }

  addRoute(path: string, method: HttpMethod, handler: TRouteHandler) {
    const lowerCaseMethod = method.toLowerCase() as keyof Router;
    if (typeof this.router[lowerCaseMethod] === 'function') {
      (this.router[lowerCaseMethod] as any)(path, handler);
    } else {
      throw new Error(`Invalid HTTP method: ${method}`);
    }
  }

  mount(app: Express) {
    app.use(this.basePath, this.router);
    this.service.log.debug("Mounted router on '%s' for entity '%s'", this.basePath, this.service.tblName);
  }
}

export class EntityRouterBuilder<Entity extends PgTable> {
  private entityRouter: EntityRouter<Entity>;

  constructor(service: NewCRUDService<Entity>, basePath: string) {
    this.entityRouter = new EntityRouter(service, basePath);
  }

  private isUserAuthenticated(req: Request, res: Response): asserts req is Request & {user: User} {
    if (!req.user) {
      ApiResponse.expressBuilder(res).withStatus(401).withMessage('User is not authenticated').buildAndSend();
    }
  }

  withSearchRoute(customHandler?: TCustomHandler) {
    const defaultHandler: TRouteHandler<Promise<void>> = async (req, res) => {
      this.isUserAuthenticated(req, res);

      const {query} = req.query;
      return ApiResponse.builder()
        .withMessage(`Results for '${query}'`)
        .withData({
          query,
          results: await this.entityRouter.service.search(query as string),
        })
        .withExpressResponse(res)
        .buildAndSend();
    };
    this.entityRouter.router.get(this.entityRouter.getDefaultEndpointPath('search'), customHandler || defaultHandler);
    return this;
  }

  withGetAllRoute(customHandler?: TCustomHandler) {
    const defaultHandler: TRouteHandler<Promise<void>> = async (req, res) => {
      this.isUserAuthenticated(req, res);

      return ApiResponse.builder()
        .withData(await this.entityRouter.service.getAll())
        .withExpressResponse(res)
        .buildAndSend();
    };
    this.entityRouter.router.get(this.entityRouter.getDefaultEndpointPath('get_all'), customHandler || defaultHandler);
    return this;
  }

  withGetByIdRoute(customHandler?: TCustomHandler) {
    const defaultHandler: TRouteHandler<Promise<void>> = async (req, res) => {
      this.isUserAuthenticated(req, res);

      const {id} = req.params;
      const result = await this.entityRouter.service.getById(Number(id));
      return ApiResponse.builder()
        .withStatus(result ? 200 : 404)
        .withData(result)
        .withExpressResponse(res)
        .buildAndSend();
    };
    this.entityRouter.router.get(
      this.entityRouter.getDefaultEndpointPath('get_by_id'),
      hasEntityId,
      customHandler || defaultHandler,
    );
    return this;
  }

  withCreateRoute(customHandler?: TCustomHandler) {
    const defaultHandler: TRouteHandler<Promise<void>> = async (req, res) => {
      this.isUserAuthenticated(req, res);

      const payload = req.body;
      const user = req.user;

      const result = await this.entityRouter.service.create<TInsertCategory>(
        Array.isArray(payload) ? payload : [payload],
        ZInsertCategory,
        user as User,
      );
      return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
    };
    this.entityRouter.router.post(this.entityRouter.getDefaultEndpointPath('create'), customHandler || defaultHandler);
    return this;
  }

  withUpdateByIdRoute(customHandler?: TCustomHandler) {
    const defaultHandler: TRouteHandler<Promise<void>> = async (req, res) => {
      this.isUserAuthenticated(req, res);

      const {id} = req.params;
      const payload = req.body;
      const result = await this.entityRouter.service.updateById(Number(id), payload);
      return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
    };
    this.entityRouter.router.put(
      this.entityRouter.getDefaultEndpointPath('update'),
      hasEntityId,
      customHandler || defaultHandler,
    );
    return this;
  }

  withDeleteByIdRoute(customHandler?: TCustomHandler) {
    const defaultHandler: TRouteHandler<Promise<void>> = async (req, res) => {
      this.isUserAuthenticated(req, res);

      const {id} = req.params;
      const result = await this.entityRouter.service.deleteById(Number(id));
      return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
    };
    this.entityRouter.router.delete(
      this.entityRouter.getDefaultEndpointPath('delete'),
      hasEntityId,
      customHandler || defaultHandler,
    );
    return this;
  }

  withDefaultRoutes() {
    this.withSearchRoute();
    this.withGetAllRoute();
    this.withGetByIdRoute();
    this.withCreateRoute();
    this.withUpdateByIdRoute();
    this.withDeleteByIdRoute();

    return this;
  }

  withMiddleware(middleware: (req: Request, res: Response, next: NextFunction) => void) {
    this.entityRouter.addMiddleware(middleware);
    return this;
  }

  withRoute(path: string, method: HttpMethod, handler: (req: Request, res: Response, next: NextFunction) => void) {
    this.entityRouter.addRoute(path, method, handler);
    return this;
  }

  build() {
    return this.entityRouter;
  }
}
