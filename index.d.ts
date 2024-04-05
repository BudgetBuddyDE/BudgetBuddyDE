import {type TUser} from './src/types/Pocketbase.types';

declare module 'express-serve-static-core' {
  export interface Request {
    user: TUser;
  }
}
