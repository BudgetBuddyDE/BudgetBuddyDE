import {and, eq, ilike, or} from 'drizzle-orm';
import type {PgTableWithColumns, TableConfig} from 'drizzle-orm/pg-core';

export function assembleFilter<Table extends TableConfig>(
  table: PgTableWithColumns<Table>,
  {ownerColumnName, ownerValue}: {ownerColumnName: keyof Table['columns']; ownerValue: string},
  {searchTerm, searchableColumnName}: {searchTerm?: string; searchableColumnName?: (keyof Table['columns'])[]},
) {
  if (searchTerm && searchableColumnName) {
    return searchableColumnName.length > 1
      ? and(
          eq(table[ownerColumnName], ownerValue),
          or(
            ...searchableColumnName.map(columnName => {
              const col = table[columnName];
              return ilike(col, `%${searchTerm}%`);
            }),
          ),
        )
      : and(eq(table[ownerColumnName], ownerValue), ilike(table[searchableColumnName[0]], `%${searchTerm}%`));
  }
  return eq(table[ownerColumnName], ownerValue);
}
