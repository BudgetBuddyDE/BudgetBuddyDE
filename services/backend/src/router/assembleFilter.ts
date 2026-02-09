import {and, eq, gt, gte, ilike, inArray, like, lt, lte, ne, notInArray, or} from 'drizzle-orm';
import type {PgTableWithColumns, TableConfig} from 'drizzle-orm/pg-core';

export type TOwnerFilter<Table extends TableConfig> = {
  ownerColumnName: keyof Table['columns'];
  ownerValue: string;
};

export type TSearchFilter<Table extends TableConfig> = {
  searchTerm?: string;
  searchableColumnName?: (keyof Table['columns'])[];
};

type TBaseValue = string | number | Date;

export type TAdditionalFilter<Table extends TableConfig> =
  | {
      columnName: keyof Table['columns'];
      operator: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'like' | 'ilike' | 'in' | 'notIn';
      value: TBaseValue;
    }
  | {
      columnName: keyof Table['columns'];
      operator: 'in' | 'notIn';
      value: Array<TBaseValue>;
    };

export function assembleFilter<Table extends TableConfig>(
  table: PgTableWithColumns<Table>,
  {ownerColumnName, ownerValue}: TOwnerFilter<Table>,
  {searchTerm, searchableColumnName}: TSearchFilter<Table>,
  additionalFilters: TAdditionalFilter<Table>[] = [],
) {
  const conditions = [eq(table[ownerColumnName], ownerValue)];

  if (searchTerm && searchableColumnName && searchableColumnName.length > 0) {
    if (searchableColumnName.length > 1) {
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: We check the length before
        or(
          ...searchableColumnName.map(columnName => {
            const col = table[columnName];
            return ilike(col, `%${searchTerm}%`);
          }),
        )!,
      );
    } else {
      conditions.push(ilike(table[searchableColumnName[0]], `%${searchTerm}%`));
    }
  }

  if (additionalFilters && additionalFilters.length > 0) {
    additionalFilters.forEach(filter => {
      const col = table[filter.columnName];
      switch (filter.operator) {
        case 'eq':
          conditions.push(eq(col, filter.value));
          break;
        case 'ne':
          conditions.push(ne(col, filter.value));
          break;
        case 'lt':
          conditions.push(lt(col, filter.value));
          break;
        case 'lte':
          conditions.push(lte(col, filter.value));
          break;
        case 'gt':
          conditions.push(gt(col, filter.value));
          break;
        case 'gte':
          conditions.push(gte(col, filter.value));
          break;
        case 'like':
          conditions.push(like(col, filter.value as string));
          break;
        case 'ilike':
          conditions.push(ilike(col, filter.value as string));
          break;
        case 'in':
          conditions.push(inArray(col, filter.value as Array<TBaseValue>));
          break;
        case 'notIn':
          conditions.push(notInArray(col, filter.value as Array<TBaseValue>));
          break;
      }
    });
  }

  return and(...conditions);
}
