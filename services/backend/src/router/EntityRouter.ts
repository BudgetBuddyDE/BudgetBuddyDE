import {Express, Router} from 'express';

import {TInsertCategory, ZInsertCategory} from '../db/schema';
import {hasEntityId} from '../middleware';
import {ApiResponse} from '../models/ApiResponse';
import {User} from '../models/User.model';
import {ICRUDService} from '../service/interfaces';
import {CRUDService} from '../service/interfaces/CRUD.service';

export class EntityRouter<TService extends CRUDService<any, any> & ICRUDService<any, any, any>> {
  private router: Router;
  private service: TService;

  constructor(service: TService) {
    this.router = Router();
    this.service = service;
  }

  init() {
    this.router.get('/search', async (req, res) => {
      const {query} = req.query;
      return ApiResponse.builder()
        .withMessage(`Results for '${query}'`)
        .withData({
          query,
          results: await this.service.search(query as string, ['name', 'description']),
        })
        .withExpressResponse(res)
        .buildAndSend();
    });

    this.router.get('/', async (_req, res) => {
      return ApiResponse.builder()
        .withData(await this.service.getAll())
        .withExpressResponse(res)
        .buildAndSend();
    });

    this.router.get('/:id', hasEntityId, async (req, res) => {
      const {id} = req.params;
      const result = await this.service.getById(Number(id));
      return ApiResponse.builder()
        .withStatus(result ? 200 : 404)
        .withData(result)
        .withExpressResponse(res)
        .buildAndSend();
    });

    this.router.post('/', async (req, res) => {
      const payload = req.body;
      const user = req.user;
      const result = await this.service.create<TInsertCategory>(
        Array.isArray(payload) ? payload : [payload],
        ZInsertCategory,
        user as User,
      );
      return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
    });

    this.router.put('/:id', hasEntityId, async (req, res) => {
      const {id} = req.params;
      const payload = req.body;
      const result = await this.service.updateById(Number(id), payload);
      return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
    });

    this.router.delete('/:id', hasEntityId, async (req, res) => {
      const {id} = req.params;
      const result = await this.service.deleteById(Number(id));
      return ApiResponse.builder().withData(result).withExpressResponse(res).buildAndSend();
    });
  }

  mount(app: Express, path: string) {
    this.init();
    app.use(path, this.router);
    this.service.log.debug(`Mounted ${this.service.tblName} router on ${path}`);
  }
}
