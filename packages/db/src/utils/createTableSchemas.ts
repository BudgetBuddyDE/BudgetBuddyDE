import type { Table } from "drizzle-orm";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";

export function createTableSchemas<T extends Table>(table: T) {
	return {
		select: createSelectSchema(table),
		insert: createInsertSchema(table),
		update: createUpdateSchema(table),
	};
}
