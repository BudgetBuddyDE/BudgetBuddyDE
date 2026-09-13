import {toNextJsHandler} from 'better-auth/next-js';
import {getAuth} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const {GET, POST, PATCH, PUT, DELETE} = toNextJsHandler(request => getAuth().handler(request));
