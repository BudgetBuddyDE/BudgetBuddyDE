import {db} from '../../db/drizzleClient';
import {Transactions} from '../../db/schema';
import {NewCRUDService} from './NewCRUD.service';

export class DemoService extends NewCRUDService<typeof Transactions> {
  constructor() {
    super(DemoService.name, db, Transactions, ['receiver', 'description']);
  }
}
