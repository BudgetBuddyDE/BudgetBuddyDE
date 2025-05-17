ALTER TABLE "stock_exchange" ALTER COLUMN "symbol" SET DATA TYPE varchar(11);--> statement-breakpoint
ALTER TABLE "stock_position" ALTER COLUMN "exchange" SET DATA TYPE varchar(11);--> statement-breakpoint
ALTER TABLE "stock_watchlist" ALTER COLUMN "exchange" SET DATA TYPE varchar(11);