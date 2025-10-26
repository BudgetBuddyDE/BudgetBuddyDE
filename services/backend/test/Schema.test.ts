import { Parqet } from "../srv/lib/Parqet";

describe("Parqet - Retrieve asset details", () => {
  test("assetType = Security and securityType = Aktie", async () => {
    const [asset, error] = await Parqet.getAsset("DE0007664005");
    expect(error).toBeNull();
    expect(asset).not.toBeNull();
    expect(asset?.asset.assetType).toBe("Security");
    expect(
      asset?.asset && asset?.asset.assetType === "Security"
        ? asset.asset.security.type
        : null,
    ).toBe("Aktie");
  });

  test("assetType = Security and securityType = ETF", async () => {
    const [asset, error] = await Parqet.getAsset("IE00B8HGT870");
    expect(error).toBeNull();
    expect(asset).not.toBeNull();
    expect(asset?.asset.assetType).toBe("Security");
    expect(
      asset?.asset && asset?.asset.assetType === "Security"
        ? asset.asset.security.type
        : null,
    ).toBe("ETF");
  });

  test("assetType = Security and securityType = Zertifikat", async () => {
    const [asset, error] = await Parqet.getAsset("DE000VQ553V0");
    expect(error).toBeNull();
    expect(asset).not.toBeNull();
    expect(asset?.asset.assetType).toBe("Security");
    expect(
      asset?.asset && asset?.asset.assetType === "Security"
        ? asset.asset.security.type
        : null,
    ).toBe("Zertifikat");
  });

  test("assetType = Commodity", async () => {
    const [asset, error] = await Parqet.getAsset("Gold");
    expect(error).toBeNull();
    expect(asset).not.toBeNull();
    expect(asset?.asset.assetType).toBe("Commodity");
  });

  test("assetType = Crypto", async () => {
    const [asset, error] = await Parqet.getAsset("BTC");
    expect(error).toBeNull();
    expect(asset).not.toBeNull();
    expect(asset?.asset.assetType).toBe("Crypto");
  });
});

describe("Parqet - Retrieve asset quotes", () => {
  test("should return quotes for securities", async () => {
    const identifier = "DE0007664005";
    const [quotes, error] = await Parqet.getQuotes([{ identifier }]);
    expect(error).toBeNull();
    expect(quotes).not.toBeNull();
    expect(quotes?.has(identifier)).toBe(true);
    expect(quotes?.get(identifier)?.quotes.length).toBeGreaterThan(0);
  });

  test("should return quotes for an commoditiy", async () => {
    const identifier = "Gold";
    const [quotes, error] = await Parqet.getQuotes([{ identifier }]);
    expect(error).toBeNull();
    expect(quotes).not.toBeNull();
    expect(quotes?.has(identifier)).toBe(true);
    expect(quotes?.get(identifier)?.quotes.length).toBeGreaterThan(0);
  });

  test("should return quotes for an crypto asset", async () => {
    const identifier = "BTC";
    const [quotes, error] = await Parqet.getQuotes([{ identifier }]);
    expect(error).toBeNull();
    expect(quotes).not.toBeNull();
    expect(quotes?.has(identifier)).toBe(true);
    expect(quotes?.get(identifier)?.quotes.length).toBeGreaterThan(0);
  });
});

describe("Parqet - Retrieve dividends", () => {
  const asset = "DE0007664005";

  test("should return historical dividends for a given asset", async () => {
    const [dividends, error] = await Parqet.getDividends(
      [{ identifier: asset }],
      {
        future: false,
        historical: true,
      },
    );
    expect(error).toBeNull();
    expect(dividends).not.toBeNull();
    expect(dividends?.dividendDetails[asset].futureDividends).toBeNull();
    expect(
      dividends?.dividendDetails[asset].historicalDividends,
    ).not.toBeNull();
  });

  test("should return future dividends for a given asset", async () => {
    const [dividends, error] = await Parqet.getDividends(
      [{ identifier: asset }],
      {
        future: true,
        historical: false,
      },
    );
    expect(error).toBeNull();
    expect(dividends).not.toBeNull();
    expect(dividends?.dividendDetails[asset].futureDividends).not.toBeNull();
    expect(dividends?.dividendDetails[asset].historicalDividends).toBeNull();
  });

  test("should return historical & future dividends for a given asset", async () => {
    const [dividends, error] = await Parqet.getDividends(
      [{ identifier: asset }],
      {
        future: true,
        historical: true,
      },
    );
    expect(error).toBeNull();
    expect(dividends).not.toBeNull();
    expect(dividends?.dividendDetails[asset].futureDividends).not.toBeNull();
    expect(
      dividends?.dividendDetails[asset].historicalDividends,
    ).not.toBeNull();
  });
});

describe("Parqet - Search asset", () => {
  test("should support searching for an asset by ISIN", async () => {
    const query = "DE0007664005";
    const [results, error] = await Parqet.search(query);
    expect(error).toBeNull();
    expect(results).not.toBeNull();
  });

  test("should support searching for an asset by WKN", async () => {
    const query = "766403";
    const [result, error] = await Parqet.search(query);
    expect(error).toBeNull();
    expect(result).not.toBeNull();
  });

  test("should support searching for an asset by name", async () => {
    const query = "Volkswagen";
    const [results, error] = await Parqet.search(query);
    expect(error).toBeNull();
    expect(results).not.toBeNull();
  });

  test("should support searching for an commodity", async () => {
    const query = "Gold";
    const [results, error] = await Parqet.search(query);
    expect(error).toBeNull();
    expect(results).not.toBeNull();
  });

  test("should support searching for an crypto asset by symbol", async () => {
    const query = "BTC";
    const [results, error] = await Parqet.search(query);
    expect(error).toBeNull();
    expect(results).not.toBeNull();
  });

  test("should support searching for an crypto asset by name", async () => {
    const query = "BitCoin";
    const [results, error] = await Parqet.search(query);
    expect(error).toBeNull();
    expect(results).not.toBeNull();
  });
});

describe("Parqet - Related assets", () => {
  // Check if related assets are fetched and parsed correctly
  ["BTC", "Gold", "DE0007664005"].map((isin) => {
    test(`Asset ${isin} - should fetch and parse related assets correctly`, async () => {
      const limit = 8;
      const [relatedAssets, error] = await Parqet.getRelatedAssets(isin, limit);
      expect(error).toBeNull();
      expect(relatedAssets).not.toBeNull();
      expect(relatedAssets?.length).toBeLessThanOrEqual(limit);
    });
  });
});

describe("Parqet - Fetch static mappings", () => {
  test("should fetch and parse sectors correctly", async () => {
    const [sectors, error] = await Parqet.getSectors();
    expect(error).toBeNull();
    expect(sectors).not.toBeNull();
  });

  test("should fetch and parse regions correctly", async () => {
    const [regions, error] = await Parqet.getRegions();
    expect(error).toBeNull();
    expect(regions).not.toBeNull();
  });

  test("should fetch and parse industries correctly", async () => {
    const [industries, error] = await Parqet.getIndustries();
    expect(error).toBeNull();
    expect(industries).not.toBeNull();
  });

  test("should fetch and parse countries correctly", async () => {
    const [countries, error] = await Parqet.getCountries();
    expect(error).toBeNull();
    expect(countries).not.toBeNull();
  });
});
