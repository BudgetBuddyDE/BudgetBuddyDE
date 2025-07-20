import cds from "@sap/cds";
import {
  CategoryStat,
  CategoryStats,
  Subscriptions,
  Transactions,
} from "#cds-models/BackendService";
import { format } from "date-fns";
import { determineNextExecutionDate } from "./utils";

export class BackendService extends cds.ApplicationService {
  private readonly logger = cds.log("bs", { label: this.name, level: "debug" });
  async init() {
    this.after("READ", Subscriptions, (subscriptions, req) => {
      console.log(req.user);
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
      const categoryStats = await SELECT.from(CategoryStats).where({
        toCategory_ID: { in: categoryList },
      });

      for (const category of categoryStats) {
        const val = stats.get(category.toCategory_ID!);
        if (!val) continue;
        category.income = toDecimal(val.income);
        category.expenses = toDecimal(val.expenses);
        category.balance = toDecimal(val.income - val.expenses);
      }

      return categoryStats;
    });

    // this.after('READ', CategoryStats, async (data, req) => {
    //   const user = req.user;
    //   if (!data) {
    //     this.logger.warn('CategoryStats: No data found for the given query.');
    //     return;
    //   }

    //   const query = req.query.SELECT!;
    //   const queryWhere = query.where || [];
    //   const combinedFilter = [{ ref: ['createdBy'] }, '=', { val: user.id }];
    //   if (queryWhere && queryWhere.length > 0) {
    //     this.logger.debug(
    //       `CategoryStats: Applying additional filters: ${JSON.stringify(queryWhere)}`,
    //       combinedFilter
    //     );
    //     combinedFilter.push('and');
    //     combinedFilter.push(...(queryWhere as any[]));

    //     this.logger.debug(
    //       `CategoryStats: Combined filter: ${JSON.stringify(combinedFilter)}`,
    //       combinedFilter
    //     );
    //   }

    //   const transactions = await SELECT.from(Transactions).where(combinedFilter);
    //   const stats = new Map<CategoryStat['toCategory_ID'], { income: number; expenses: number }>();
    //   for (const transaction of transactions) {
    //     const categoryId = transaction.toCategory_ID as string;

    //     const isIncome = transaction.transferAmount! > 0;
    //     const absoluteTransferAmount = Math.abs(transaction.transferAmount as number);

    //     if (!stats.has(categoryId)) {
    //       stats.set(categoryId, {
    //         income: isIncome ? absoluteTransferAmount : 0,
    //         expenses: isIncome ? 0 : absoluteTransferAmount,
    //       });
    //     } else {
    //       const currentValue = stats.get(categoryId)!;
    //       currentValue[isIncome ? 'income' : 'expenses'] += absoluteTransferAmount;
    //     }
    //   }

    //   console.log();

    //   for (const category of data) {
    //     const val = stats.get(category.toCategory_ID!);
    //     if (!val) continue;
    //     category.income = toDecimal(val.income);
    //     category.expenses = toDecimal(val.expenses);
    //     category.balance = toDecimal(val.income - val.expenses);
    //   }

    //   console.log();
    // });

    return super.init();
  }
}

function toDecimal(num: number, fractionDigits: number = 2): number {
  return Number(num.toFixed(fractionDigits));
}
