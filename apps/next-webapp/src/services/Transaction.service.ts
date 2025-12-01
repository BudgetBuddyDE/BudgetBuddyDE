/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type { ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import { z } from "zod";
import {
	ApiResponse,
	ExpandedTransaction,
	ExpandedTransactionsWithCount,
	ReceiverVH,
	type TCreateOrUpdateTransaction,
	type TExpandedTransactionsWithCount,
	type TMonthlyKPIResponse,
	type TReceiverVH,
	Transaction,
} from "@/types";
import {
	type BaseGetAllQuery,
	EntityService,
	NewEntityService,
} from "./Entity.service";

const GetAllTransaction = ApiResponse.extend({
	data: z.array(ExpandedTransaction).nullable(),
});

const GetTransaction = ApiResponse.extend({
	data: ExpandedTransaction.nullable(),
});
const PostTransaction = ApiResponse.extend({
	data: z.array(Transaction).nullable(),
});
const PutTransaction = PostTransaction;
const DeleteTransaction = PostTransaction;

export class _TransactionService extends NewEntityService<
	TCreateOrUpdateTransaction,
	TCreateOrUpdateTransaction,
	typeof GetAllTransaction,
	typeof GetTransaction,
	typeof PostTransaction,
	typeof PutTransaction,
	typeof DeleteTransaction
> {
	constructor() {
		super("/api/transaction", {
			getAll: GetAllTransaction,
			get: GetTransaction,
			create: PostTransaction,
			update: PutTransaction,
			delete: DeleteTransaction,
		});
	}

	async getAll(
		query?: BaseGetAllQuery & {
			$dateFrom?: Date;
			$dateTo?: Date;
		},
		requestConfig?: RequestInit,
	) {
		return super.getAll(query, requestConfig);
	}

	/**
	 * Retrieves the monthly KPIs from the database.
	 * @returns A promise that resolves to a TMonthlyKPIResponse object containing the monthly KPIs.
	 * @throws If there is an error parsing the retrieved records.
	 */
	async getMonthlyKPIs(
		_config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TMonthlyKPIResponse>> {
		return [
			{
				currentBalance: 0,
				estimatedBalance: 0,
				paidExpenses: 0,
				receivedIncome: 0,
				upcomingExpenses: 0,
				upcomingIncome: 0,
			},
			null,
		];
	}

	async getReceiverVH(
		requestConfig?: RequestInit,
	): Promise<ServiceResponse<TReceiverVH[]>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/receiver`,
				this.mergeRequestConfig(
					{
						method: "GET",
						headers: this.enhanceHeadersWithRequestId(
							new Headers(requestConfig?.headers || {}),
						),
					},
					requestConfig,
				),
			);
			if (!response.ok) {
				throw new Error(`Failed to fetch entities: ${response.statusText}`);
			}
			if (!this.isJsonResponse(response)) {
				throw new Error("Response is not JSON");
			}
			const data = await response.json();

			const parsingResult = ApiResponse.extend({
				data: z.array(ReceiverVH).nullable(),
			}).safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data.data ?? [], null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}

export class TransactionService extends EntityService {
	static {
		this.entity = "Transaction";
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
}
