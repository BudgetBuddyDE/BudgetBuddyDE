import path from "path";
import { TestFactory } from "./utils/TestFactory";
import { ODataService } from "./utils/ODataUtil";
import { StockExchange } from "#cds-models/BackendService";

describe("StockExchange", () => {
  const testFactory = new TestFactory(path.join(__dirname, "../"));
  // @ts-expect-error
  const testInstance = testFactory.init({ profile: "test" });
  const util = testFactory.getODataUtil(ODataService.Backend);

  test("it should return an empty list", async () => {
    const result = await util.core.get<StockExchange>(StockExchange.name);
    expect(result.status).toBe(200);
    expect(result.data).toEqual([]);
  });

  test.skip("it should return the list of available stock exchanges", async () => {
    const result = await util.core.get<StockExchange>(StockExchange.name);
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data).toEqual([
      /*ENTER DATA*/
    ]);
  });

  test.skip("it should not be possible to create new stock exchanges", async () => {
    expect(() =>
      util.core.create<StockExchange>(StockExchange.name, {
        symbol: "HM",
        name: "Börse Hamburg",
        technicalName: "hamburg",
      }),
    ).toThrow(/unauthorized/i);
  });

  test.skip("it should not be possible to update an stock exchanges", async () => {
    expect(() =>
      util.core.update<StockExchange>(StockExchange.name, "HM", {
        name: "Börse Hamburg",
      }),
    ).toThrow(/unauthorized/i);
  });

  test.skip("it should not be possible to delete an stock exchanges", async () => {
    expect(() => util.core.delete(StockExchange.name, "HM")).toThrow(
      /unauthorized/i,
    );
  });
});
