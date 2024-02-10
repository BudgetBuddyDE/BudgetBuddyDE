import express from 'express';
import type {TUser} from '@budgetbuddyde/types';

declare module 'express-serve-static-core' {
  export interface Request {
    user: TUser | null; // replace 'any' with your desired type
  }
}
