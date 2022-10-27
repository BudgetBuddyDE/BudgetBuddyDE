import type { uuid } from './profile.type';
import type { ICategoryView } from './category.type';

/**
 * Object like it's stored in our database
 */
export interface IBaseBudget {
  id: number;
  category: number;
  budget: number;
  created_by: uuid;
  updated_at: string | Date;
  inserted_at: string | Date;
}

/**
 * Object that will be avaiable for export
 */
export interface IExportBudget {
  id: number;
  category: ICategoryView;
  budget: number;
  created_by: uuid;
  updated_at: string | Date;
  inserted_at: string | Date;
}

/**
 * Structure of out `BudgetProgress`-view
 */
export interface IBudgetProgressView {
  id: number;
  category: ICategoryView;
  budget: number;
  currentlySpent: number | null;
  created_by: uuid;
  updated_at: string | Date;
  inserted_at: string | Date;
}
