import {
	boolean,
	doublePrecision,
	integer,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { user } from "../auth";
import { budgetType } from "./enums";
import { backendSchema } from "./schema";

export const paymentMethods = backendSchema.table("payment_method", {
	id: uuid("payment_method_id").primaryKey().defaultRandom(),
	ownerId: varchar("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: varchar({ length: 40 }).notNull(),
	provider: varchar({ length: 32 }).notNull(),
	address: varchar({ length: 32 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const categories = backendSchema.table("category", {
	id: uuid("category_id").primaryKey().defaultRandom(),
	ownerId: varchar("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: varchar({ length: 40 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const transactions = backendSchema.table("transaction", {
	id: uuid("transaction_id").primaryKey().defaultRandom(),
	ownerId: varchar("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	categoryId: uuid("category_id")
		.references(() => categories.id, { onDelete: "cascade" })
		.notNull(),
	paymentMethodId: uuid("payment_method_id")
		.references(() => paymentMethods.id, { onDelete: "cascade" })
		.notNull(),
	processedAt: timestamp("processed_at").notNull(),
	receiver: varchar({ length: 100 }).notNull(),
	transferAmount: doublePrecision("transfer_amount").notNull(),
	information: text(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const recurringPayments = backendSchema.table("recurring_payment", {
	id: uuid("recurring_payment_id").primaryKey().defaultRandom(),
	ownerId: varchar("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	categoryId: uuid("category_id")
		.references(() => categories.id, { onDelete: "cascade" })
		.notNull(),
	paymentMethodId: uuid("payment_method_id")
		.references(() => paymentMethods.id, { onDelete: "cascade" })
		.notNull(),
	executeAt: integer("execute_at").notNull(),
	paused: boolean().default(false).notNull(),
	receiver: varchar({ length: 100 }).notNull(),
	transferAmount: doublePrecision("transfer_amount").notNull(),
	information: text(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const budgets = backendSchema.table("budget", {
	id: uuid("budget_id").primaryKey().defaultRandom(),
	ownerId: varchar("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	type: budgetType("type").notNull(),
	name: varchar({ length: 32 }).notNull(),
	budget: doublePrecision().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const budgetCategories = backendSchema.table(
	"budget_category",
	{
		budgetId: uuid("budget_id")
			.notNull()
			.references(() => budgets.id, { onDelete: "cascade" }),
		categoryId: uuid("category_id")
			.notNull()
			.references(() => categories.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({
			name: "budget_category_pkey",
			columns: [table.budgetId, table.categoryId],
		}),
	],
);

export const attachments = backendSchema.table("attachment", {
	// UUID V7 is used for attachment IDs to embed timestamp information
	// Therefore we set `defaultRandom()` to false and generate the ID manually upon insertion
	id: uuid("attachment_id")
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	ownerId: varchar("owner_id").notNull(),
	fileName: varchar({ length: 255 }).notNull(), // Original file name with extension
	fileExtension: varchar({ length: 16 }).notNull(), // File extension only
	contentType: varchar({ length: 128 }).notNull(), // MIME type
	location: text().notNull().unique(), // Storage location path
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const transactionAttachments = backendSchema.table(
	"transaction_attachment",
	{
		transactionId: uuid("transaction_id").references(() => transactions.id, {
			onDelete: "cascade",
		}),
		attachmentId: uuid("attachment_id").references(() => attachments.id, {
			onDelete: "cascade",
		}),
	},
	(table) => [
		primaryKey({
			name: "transaction_attachment_pkey",
			columns: [table.transactionId, table.attachmentId],
		}),
	],
);
