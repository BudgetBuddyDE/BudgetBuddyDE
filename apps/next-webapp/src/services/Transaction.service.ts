/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type { ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import { z } from "zod";
import {
	ExpandedTransactionsWithCount,
	ExpandedTransasction,
	MonthlyKPIResponse,
	ReceiverVH,
	type TCreateOrUpdateTransaction,
	type TExpandedTransaction,
	type TExpandedTransactionsWithCount,
	type TMonthlyKPIResponse,
	type TReceiverVH,
	TransactionResponse,
	type TTransactionResponse,
} from "@/types";
import { EntityService } from "./Entity.service";

export class TransactionService extends EntityService {
	static {
		this.entity = "Transaction";
	}

	/**
	 * Creates a new transaction.
	 * @param payload The transaction data to create.
	 * @returns A promise that resolves to the created transaction or an error.
	 */
	static async create(
		payload: TCreateOrUpdateTransaction,
	): Promise<ServiceResponse<TTransactionResponse>> {
		try {
			const record = await this.newOdataHandler()
				.post(this.$entityPath, payload)
				.query();
			const parsingResult = TransactionResponse.safeParse(record);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	/**
	 * Updates an existing transaction.
	 * @param entityId The ID of the transaction to update.
	 * @param payload The updated transaction data.
	 * @returns A promise that resolves to the updated transaction or an error.
	 */
	static async update(
		entityId: string,
		payload: TCreateOrUpdateTransaction,
	): Promise<ServiceResponse<TTransactionResponse>> {
		try {
			const record = await this.newOdataHandler()
				.patch(`${this.$entityPath}(ID=${entityId})`, payload)
				.query();
			const parsingResult = TransactionResponse.safeParse(record);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	/**
	 * Retrieves the list of transactions from the database.
	 * @returns A promise that resolves to an array of TTransaction objects.
	 * @throws If there is an error parsing the retrieved records.
	 */
	static async getTransactions(
		query?: OdataQuery,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TExpandedTransaction[]>> {
		try {
			const records = await this.newOdataHandler(config)
				.get(this.$entityPath)
				.query({
					$expand: "toCategory,toPaymentMethod",
					...query,
				});
			const parsingResult = z.array(ExpandedTransasction).safeParse(records);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	/**
	 * Retrieves the list of transactions from the database with a count of total transactions.
	 * @param query - The OData query parameters.
	 * @param config - The OData configuration options.
	 * @returns A promise that resolves to a ServiceResponse containing the transactions and their count.
	 */
	static async getTransactionsWithCount(
		query?: Omit<OdataQuery, "$count" | "$expand">,
		config?: Partial<Omit<OdataConfig, "fragment">>,
	): Promise<ServiceResponse<TExpandedTransactionsWithCount>> {
		try {
			const records = await this.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(this.$entityPath)
				.query({
					...query,
					$expand: "toCategory,toPaymentMethod",
					$count: true,
				});
			this.logger.debug("Fetched transactions:", records);
			const parsingResult = ExpandedTransactionsWithCount.safeParse(records);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	/**
	 * Retrieves the monthly KPIs from the database.
	 * @returns A promise that resolves to a TMonthlyKPIResponse object containing the monthly KPIs.
	 * @throws If there is an error parsing the retrieved records.
	 */
	static async getMonthlyKPIs(
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TMonthlyKPIResponse>> {
		try {
			const records = await this.newOdataHandler(config)
				.get(`${this.$servicePath}/MonthlyKPI`)
				.query();
			const parsingResult = MonthlyKPIResponse.safeParse(records);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	static async getReceiverVH(
		query?: OdataQuery,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TReceiverVH[]>> {
		try {
			const records = await this.newOdataHandler(config)
				.get(`${this.$servicePath}/Receiver_VH`)
				.query(query);
			const parsingResult = z.array(ReceiverVH).safeParse(records);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}
}
