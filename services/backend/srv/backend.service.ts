import {
  CategoryStat,
  CategoryStats,
  MonthlyKPI,
  Subscription,
  Subscriptions,
  Transaction,
  Transactions,
} from "#cds-models/BackendService";
import { format } from "date-fns";
import { determineNextExecutionDate } from "./utils";
import { BaseService } from "./lib/BaseService";

export class BackendService extends BaseService {
  async init() {
    this.after("READ", Subscriptions, (subscriptions) => {
      if (!subscriptions) return;
      for (const subscription of subscriptions) {
        // @ts-expect-error
        subscription.nextExecution = format(
          determineNextExecutionDate(subscription.executeAt as number),
          "yyyy-MM-dd",
        );
      }
    });

    /**
     * Custom Handler um folgends Verhalten zu erreichen:
     * Beim Abrufen der Kategorie-Statistiken soll immer ein Zeitraum in Form von Filtern `$filter=processedAt ge 2024-01-01 and processedAt le 2024-12-31` geliefert werden, für welchen die Statistiken erhoben werden sollen.
     * Sollte kein Zeitraum angegeben sein, so wird der All-Time-Zeitraum abgerufen.
     * `http://localhost:4004/odata/v4/backend/CategoryStats?$filter=processedAt ge 2025-07-17`
     */
    this.on("READ", CategoryStats, async (req, _next: Function) => {
      const user = req.user;
      if (!user) {
        this.logger.warn("CategoryStats: No user found in request.");
        return req.reject(401, "Unauthorized");
      }

      const query = req.query.SELECT!;
      const queryWhere = query.where || [];
      const combinedFilter = [{ ref: ["createdBy"] }, "=", { val: user.id }];
      if (queryWhere && queryWhere.length > 0) {
        this.logger.debug(
          `CategoryStats: Applying additional filters: ${JSON.stringify(queryWhere)}`,
          combinedFilter,
        );
        combinedFilter.push("and");
        combinedFilter.push(...(queryWhere as any[]));

        this.logger.debug(
          `CategoryStats: Combined filter: ${JSON.stringify(combinedFilter)}`,
          combinedFilter,
        );
      }

      const transactions =
        await SELECT.from(Transactions).where(combinedFilter);
      if (!transactions || transactions.length === 0) {
        this.logger.warn(
          "CategoryStats: No transactions found for the given query.",
        );
        return [];
      }
      const stats = new Map<
        CategoryStat["toCategory_ID"],
        { income: number; expenses: number }
      >();
      for (const transaction of transactions) {
        const categoryId = transaction.toCategory_ID as string;

        const isIncome = transaction.transferAmount! > 0;
        const absoluteTransferAmount = Math.abs(
          transaction.transferAmount as number,
        );

        if (!stats.has(categoryId)) {
          stats.set(categoryId, {
            income: isIncome ? absoluteTransferAmount : 0,
            expenses: isIncome ? 0 : absoluteTransferAmount,
          });
        } else {
          const currentValue = stats.get(categoryId)!;
          currentValue[isIncome ? "income" : "expenses"] +=
            absoluteTransferAmount;
        }
      }

      const categoryList = Array.from(
        new Set(transactions.map((t) => t.toCategory_ID)),
      ) as string[];
      const categoryStats = await SELECT.columns(req.query.SELECT!.columns!)
        .from(CategoryStats)
        .where({
          toCategory_ID: { in: categoryList },
        });

      for (const category of categoryStats) {
        const val = stats.get(category.toCategory_ID!);
        if (!val) continue;
        category.income = this.utils.toDecimal(val.income);
        category.expenses = this.utils.toDecimal(val.expenses);
        category.balance = this.utils.toDecimal(val.income - val.expenses);
      }

      return categoryStats;
    });

    // TODO: Improve code quality and increase test coverage
    this.on("READ", MonthlyKPI, async (req) => {
      this.assertRequestValueIsSet(req, "user");

      const user = req.user;
      const now = new Date();
      const beginOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      // FIXME: Use allSettled instead of Promise.all to handle errors gracefully
      const [
        // @ts-expect-error
        [{ receivedIncome }],
        // @ts-expect-error
        [{ upcomingTransactionIncome }],
        // @ts-expect-error
        [{ upcomingSubscriptionIncome }],
        // @ts-expect-error
        [{ paidExpenses }],
        // @ts-expect-error
        [{ upcomingTransactionExpenses }],
        // @ts-expect-error
        [{ upcomingSubscriptionExpenses }],
      ] = await Promise.all([
        SELECT.columns("COALESCE(SUM(transferAmount), 0) as receivedIncome")
          .from(Transaction)
          .where({
            owner: user.id,
            and: {
              processedAt: { between: beginOfMonth, and: now },
              and: { transferAmount: { ">=": 0 } },
            },
          }),
        SELECT.columns(
          "COALESCE(SUM(transferAmount), 0) as upcomingTransactionIncome",
        )
          .from(Transaction)
          .where({
            owner: user.id,
            and: {
              processedAt: { between: now, and: endOfMonth },
              and: { transferAmount: { ">=": 0 } },
            },
          }),
        SELECT.columns(
          "COALESCE(SUM(transferAmount), 0) as upcomingSubscriptionIncome",
        )
          .from(Subscription)
          .where({
            owner: user.id,
            and: {
              executeAt: { between: now.getDate(), and: endOfMonth.getDate() },
              and: { transferAmount: { ">=": 0 } },
            },
          }),
        SELECT.columns("COALESCE(SUM(transferAmount), 0) as paidExpenses")
          .from(Transaction)
          .where({
            owner: user.id,
            and: {
              processedAt: { between: beginOfMonth, and: now },
              and: { transferAmount: { "<": 0 } },
            },
          }),
        SELECT.columns(
          "COALESCE(SUM(transferAmount), 0) as upcomingTransactionExpenses",
        )
          .from(Transaction)
          .where({
            owner: user.id,
            and: {
              processedAt: { between: now, and: endOfMonth },
              and: { transferAmount: { "<": 0 } },
            },
          }),
        SELECT.columns(
          "COALESCE(SUM(transferAmount), 0) as upcomingSubscriptionExpenses",
        )
          .from(Subscription)
          .where({
            owner: user.id,
            and: {
              executeAt: { between: now.getDate(), and: endOfMonth.getDate() },
              and: { transferAmount: { "<": 0 } },
            },
          }),
      ]);

      const totalFutureIncome = this.utils.toDecimal(
        upcomingTransactionIncome + upcomingSubscriptionIncome,
      );
      const currentBalance = this.utils.toDecimal(
        paidExpenses + receivedIncome,
      );
      const upcomingExpenses = this.utils.toDecimal(
        upcomingTransactionExpenses + upcomingSubscriptionExpenses,
      );
      const structure: MonthlyKPI = {
        receivedIncome,
        upcomingIncome: totalFutureIncome,
        paidExpenses: Math.abs(paidExpenses),
        upcomingExpenses: Math.abs(upcomingExpenses),
        currentBalance,
        estimatedBalance: this.utils.toDecimal(
          currentBalance + totalFutureIncome - Math.abs(upcomingExpenses),
        ),
      };

      return structure;
    });

    return super.init();
  }
}
