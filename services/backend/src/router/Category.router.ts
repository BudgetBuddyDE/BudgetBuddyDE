import {CategoryService} from '../service';
import {EntityRouter} from './EntityRouter';

export const CategoryRouter = EntityRouter.builder(new CategoryService(), '/api/category').withDefaultRoutes().build();
