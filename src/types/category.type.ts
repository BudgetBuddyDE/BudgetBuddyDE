import type { uuid } from './profile.interface';

/**
 * Object like it's stored in our database
 */
export interface IBaseCategory {
  id: number;
  name: string;
  description: string | null;
  created_by: uuid;
  updated_at: string | Date;
  inserted_at: string | Date;
}

/**
 * Object with resolved foreign-keys
 */
export interface ICategory extends IBaseCategory {}

/**
 * Object that will be avaiable for export
 */
export interface IExportCategory extends IBaseCategory {}

/**
 * Object used in views
 */
export interface ICategoryView {
  id: number;
  name: string;
  description: string | null;
}
