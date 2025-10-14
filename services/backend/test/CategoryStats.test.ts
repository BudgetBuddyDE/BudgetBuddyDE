import path from "path";
import { CategoryStat, CategoryStats } from "#cds-models/BackendService";
import { TestFactory } from "./utils/TestFactory";
import { ODataService } from "./utils/ODataUtil";

describe("CategoryStats", () => {
  const testFactory = new TestFactory(path.join(__dirname, "../"));
  // @ts-expect-error
  const testInstance = testFactory.init({ profile: "test" });
  const util = testFactory.getODataUtil(ODataService.Backend);

  beforeEach(async () => {
    await testFactory.resetData();
  });

  test("it should return all-time statistics when no filter is applied", async () => {
    const result = await util.core.get<CategoryStat>("CategoryStats");
    expect(result).toBeDefined();
    expect(Object.fromEntries(toMap(result.data ?? []))).toEqual({
      "10a84826-b931-4a79-86f2-f47d881df6fb": {
        income: 430.92,
        expenses: 1615.37,
        balance: -1184.45,
      },
      "59386ca2-8583-4fc4-b2e1-761e609c3809": {
        income: 20935.16,
        expenses: 0,
        balance: 20935.16,
      },
      "621dd3aa-5f0c-4d98-b592-30d21861b3d5": {
        income: 212.99,
        expenses: 273.64,
        balance: -60.65,
      },
      "b2182eb0-2e95-4317-917f-86dea1eefdf6": {
        income: 2637.07,
        expenses: 0,
        balance: 2637.07,
      },
      "c1fb96ad-e621-45ec-92ce-9c5231141264": {
        income: 3803.54,
        expenses: 0,
        balance: 3803.54,
      },
      "eab5b0e7-498b-4a5b-9bd0-8657e4cf415c": {
        income: 1017.81,
        expenses: 0,
        balance: 1017.81,
      },
      "ed1e126b-62fb-4557-bea2-312cd0605e31": {
        income: 136.2,
        expenses: 618.44,
        balance: -482.24,
      },
    });
  });

  test("it should still support $expand for 'toCategory'", async () => {
    const date = "2025-07-15";
    const result = await util.core.get<CategoryStat>("CategoryStats", {
      $filter: `processedAt ge ${date}`,
      $expand: "toCategory",
    });

    expect(result).toBeDefined();
    expect(result.data).toEqual([
      {
        balance: 22.97,
        createdBy: "0AwLugmppIVI8A2coTwN2uQ2Tbuxx5t4",
        end: "2025-07-15T08:36:00Z",
        expenses: 0,
        income: 22.97,
        processedAt: "2025-07-15T08:36:00Z",
        start: "2024-05-08T05:05:00Z",
        toCategory: {
          ID: "ed1e126b-62fb-4557-bea2-312cd0605e31",
          createdAt: "2025-07-17T00:44:25.736Z",
          createdBy: "0AwLugmppIVI8A2coTwN2uQ2Tbuxx5t4",
          description: null,
          modifiedAt: "2025-07-17T00:44:25.736Z",
          modifiedBy: "0AwLugmppIVI8A2coTwN2uQ2Tbuxx5t4",
          name: "Lebensmittel",
          owner: "0AwLugmppIVI8A2coTwN2uQ2Tbuxx5t4",
        },
        toCategory_ID: "ed1e126b-62fb-4557-bea2-312cd0605e31",
      },
    ]);
  });

  test("it should return statistics for a specific date range", async () => {
    const startDate = "2025-06-01";
    const endDate = "2025-06-30";
    const result = await util.core.get<CategoryStat>("CategoryStats", {
      $filter: `processedAt ge ${startDate} and processedAt le ${endDate}`,
    });
    expect(result).toBeDefined();
    expect(Object.fromEntries(toMap(result.data ?? []))).toEqual({
      "10a84826-b931-4a79-86f2-f47d881df6fb": {
        income: 114.88,
        expenses: 245.53,
        balance: -130.65,
      },
      "59386ca2-8583-4fc4-b2e1-761e609c3809": {
        income: 5114.55,
        expenses: 0,
        balance: 5114.55,
      },
      "621dd3aa-5f0c-4d98-b592-30d21861b3d5": {
        income: 24.1,
        expenses: 22.81,
        balance: 1.29,
      },
      "b2182eb0-2e95-4317-917f-86dea1eefdf6": {
        income: 1080.57,
        expenses: 0,
        balance: 1080.57,
      },
      "c1fb96ad-e621-45ec-92ce-9c5231141264": {
        income: 1089.66,
        expenses: 0,
        balance: 1089.66,
      },
      "eab5b0e7-498b-4a5b-9bd0-8657e4cf415c": {
        income: 270.7,
        expenses: 0,
        balance: 270.7,
      },
      "ed1e126b-62fb-4557-bea2-312cd0605e31": {
        income: 113.23,
        expenses: 120.06,
        balance: -6.83,
      },
    });
  });

  test("it should return statistics with an defined end date and and open start", async () => {
    const startDate = "2025-07-01";
    const result = await util.core.get<CategoryStat>("CategoryStats", {
      $filter: `processedAt ge ${startDate}`,
    });
    expect(result).toBeDefined();
    expect(Object.fromEntries(toMap(result.data ?? []))).toEqual({
      "10a84826-b931-4a79-86f2-f47d881df6fb": {
        income: 25.84,
        expenses: 310.12,
        balance: -284.28,
      },
      "59386ca2-8583-4fc4-b2e1-761e609c3809": {
        income: 4215.86,
        expenses: 0,
        balance: 4215.86,
      },
      "621dd3aa-5f0c-4d98-b592-30d21861b3d5": {
        income: 11.45,
        expenses: 40.82,
        balance: -29.37,
      },
      "b2182eb0-2e95-4317-917f-86dea1eefdf6": {
        income: 171.07,
        expenses: 0,
        balance: 171.07,
      },
      "c1fb96ad-e621-45ec-92ce-9c5231141264": {
        income: 782.49,
        expenses: 0,
        balance: 782.49,
      },
      "eab5b0e7-498b-4a5b-9bd0-8657e4cf415c": {
        income: 243.75,
        expenses: 0,
        balance: 243.75,
      },
      "ed1e126b-62fb-4557-bea2-312cd0605e31": {
        income: 22.97,
        expenses: 0,
        balance: 22.97,
      },
    });
  });

  test("it should return statistics with an defined end date and and open start", async () => {
    const startDate = "2024-12-31";
    const result = await util.core.get<CategoryStat>("CategoryStats", {
      $filter: `processedAt le ${startDate}`,
    });
    expect(result).toBeDefined();
    expect(Object.fromEntries(toMap(result.data ?? []))).toEqual({
      "10a84826-b931-4a79-86f2-f47d881df6fb": {
        income: 27.4,
        expenses: 488.6,
        balance: -461.2,
      },
      "59386ca2-8583-4fc4-b2e1-761e609c3809": {
        income: 9257.45,
        expenses: 0,
        balance: 9257.45,
      },
      "621dd3aa-5f0c-4d98-b592-30d21861b3d5": {
        income: 72.75,
        expenses: 0,
        balance: 72.75,
      },
      "b2182eb0-2e95-4317-917f-86dea1eefdf6": {
        income: 982.8,
        expenses: 0,
        balance: 982.8,
      },
      "c1fb96ad-e621-45ec-92ce-9c5231141264": {
        income: 1330.85,
        expenses: 0,
        balance: 1330.85,
      },
      "eab5b0e7-498b-4a5b-9bd0-8657e4cf415c": {
        income: 241.99,
        expenses: 0,
        balance: 241.99,
      },
      "ed1e126b-62fb-4557-bea2-312cd0605e31": {
        income: 0,
        expenses: 305.65,
        balance: -305.65,
      },
    });
  });
});

function toMap(
  stats: CategoryStat[] | CategoryStats,
): Map<
  CategoryStat["toCategory_ID"],
  Pick<CategoryStat, "income" | "expenses" | "balance">
> {
  return stats.reduce((map, stat) => {
    map.set(stat.toCategory_ID, {
      income: stat.income,
      expenses: stat.expenses,
      balance: stat.balance,
    });
    return map;
  }, new Map<CategoryStat["toCategory_ID"], Pick<CategoryStat, "income" | "expenses" | "balance">>());
}
