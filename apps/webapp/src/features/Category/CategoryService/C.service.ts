import {OdataQuery, o} from '@tklein1801/o.js';

import {type IEntityService, type TEntityServiceOptions} from '@/newTypes/Service.interface';
import {odata} from '@/odata.client';

class CategoryService implements IEntityService {
  $servicePath: string;
  $entityPath: string;
  $valueHelpPath: string | undefined;

  constructor(options: TEntityServiceOptions) {
    this.$servicePath = options.$servicePath;
    this.$entityPath = options.$entityPath;
    this.$valueHelpPath = options.$valueHelpPath;
  }

  create<Payload, Response>(payload: Payload): Promise<Response> {
    throw new Error('Method not implemented.');
  }
  getAll<Query extends OdataQuery, Response>(query?: Query): Promise<Response[]> {
    throw new Error('Method not implemented.');
  }
  getById<IdType, Query extends OdataQuery, Response>(id: IdType, query?: Query): Promise<Response> {
    throw new Error('Method not implemented.');
  }
  updateById<IdType, Payload, Response>(id: IdType, payload: Payload): Promise<Response> {
    throw new Error('Method not implemented.');
  }
  deleteById<IdType>(id: IdType): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

const categoryService = new CategoryService({
  $entityPath: '/odata/v4/backend',
  $servicePath: '/Category',
  $valueHelpPath: '/Category_VH',
});
