import {User} from 'better-auth/types';
import {type Express, type NextFunction, type Request, type Response, Router} from 'express';

import {type TInsertCategory, ZInsertCategory} from '../db/schema';
import {hasEntityId} from '../middleware';
import {ApiResponse} from '../models/ApiResponse';
import {type ICRUDService} from '../service/interfaces';
import {CRUDService} from '../service/interfaces/CRUD.service';

type TRouteHandler<T = void> = (req: Request, res: Response, next: NextFunction) => T;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export class EntityRouter<TService extends CRUDService<any, any> & ICRUDService<any, any, any>> {
  public readonly router: Router;
  public readonly basePath: string;
  public readonly service: TService;

  constructor(service: TService, basePath: string) {
    this.service = service;
    this.basePath = basePath;
    this.router = Router();
  }

  static builder<TService extends CRUDService<any, any> & ICRUDService<any, any, any>>(
    service: TService,
    basePath: string,
  ) {
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

export class EntityRouterBuilder<TService extends CRUDService<any, any> & ICRUDService<any, any, any>> {
  private er: EntityRouter<TService>;

  constructor(service: TService, basePath: string) {
    this.er = new EntityRouter(service, basePath);
  }

  withSearchRoute() {
    this.er.router.get(this.er.getDefaultEndpointPath('search'), async (req, res) => {
      const {query} = req.query;
      return ApiResponse.builder()
        .withMessage(`Results for '${query}'`)
        .withData({
          query,
          results: await this.er.service.search(query as string, ['name', 'description']),
        })
        .withExpressResponse(res)
        .buildAndSend();
    });
    return this;
  }

  withGetAllRoute() {
    this.er.router.get(this.er.getDefaultEndpointPath('get_all'), async (_req, res) => {
      return ApiResponse.builder()
        .withData(await this.er.service.getAll())
        .withExpressResponse(res)
        .buildAndSend();
    });
    return this;
  }

  withGetByIdRoute() {
    this.er.router.get(this.er.getDefaultEndpointPath('get_by_id'), hasEntityId, async (req, res) => {
      const {id} = req.params;
      const result = await this.er.service.getById(Number(id));
      return ApiResponse.builder()
        .withStatus(result ? 200 : 404)
        .withData(result)
        .withExpressResponse(res)
        .buildAndSend();
    });
    return this;
  }

  withCreateRoute() {
    this.er.router.post(this.er.getDefaultEndpointPath('create'), async (req, res) => {
      const payload = req.body;
      const user = req.user;
      const result = await this.er.service.create<TInsertCategory>(
        Array.isArray(payload) ? payload : [payload],
        ZInsertCategory,
        user as User,
      );
      return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
    });
    return this;
  }

  withUpdateByIdRoute() {
    this.er.router.put(this.er.getDefaultEndpointPath('update'), hasEntityId, async (req, res) => {
      const {id} = req.params;
      const payload = req.body;
      const result = await this.er.service.updateById(Number(id), payload);
      return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
    });
    return this;
  }

  withDeleteByIdRoute() {
    this.er.router.delete(this.er.getDefaultEndpointPath('delete'), hasEntityId, async (req, res) => {
      const {id} = req.params;
      const result = await this.er.service.deleteById(Number(id));
      return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
    });
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
    this.er.addMiddleware(middleware);
    return this;
  }

  withRoute(path: string, method: HttpMethod, handler: (req: Request, res: Response, next: NextFunction) => void) {
    this.er.addRoute(path, method, handler);
    return this;
  }

  build() {
    return this.er;
  }
}
