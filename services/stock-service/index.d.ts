import {type TUser} from '@budgetbuddyde/types';

declare module 'express-serve-static-core' {
  export interface Request {
    user: TUser;
  }
}
