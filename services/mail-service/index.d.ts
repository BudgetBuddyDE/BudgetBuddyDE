import {type TRequestOptions} from './src/types';

declare module 'express-serve-static-core' {
  export interface Request extends TRequestOptions {}
}
