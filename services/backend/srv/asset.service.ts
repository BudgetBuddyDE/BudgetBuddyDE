import { z } from "zod";
import cds from "@sap/cds";
import {
  StockPositions,
  StockPositionsKPIs,
  SearchAssets,
  SearchAsset,
  Dividends,
  StockPositionAllocations,
  MetalQuotes,
  RelatedAssets,
  SecuritySectors,
  SecurityRegions,
  SecurityIndustries,
  SecurityCountries,
  Assets,
  AssetQuotes,
} from "#cds-models/AssetService";
import assert from "node:assert";
import { Parqet } from "./lib/Parqet";
import { BaseService } from "./lib/BaseService";
import {
  MetalPriceAPI,
  type SuccessMetalQuoteResponse,
} from "./lib/MetalPriceAPI";
import { MetalCache } from "./cache";
import { ApiSchemas } from "./types";
import { AssetCache } from "./cache/AssetCache";
import { ResponseSchemas } from "./types/Asset";

export class AssetService extends BaseService {
  private metalCache = new MetalCache();
  private assetCache = new AssetCache();

  async init() {
    this.after("READ", StockPositions, async (positions) => {
      if (!positions) return;

      const uniqueIsins = [
        ...new Set(positions.map((position) => position.isin)),
      ].filter((isin): isin is string => Boolean(isin));
      const assetDetailsPromises = uniqueIsins.map(async (isin: string) => {
        const [assetDetails, err] = await Parqet.getAsset(isin);
        return { isin, assetDetails, err };
      });
      const assetDetailsResults =
        await Promise.allSettled(assetDetailsPromises);

      // Create a Map for quick access to asset details
      const assetDetailsMap = new Map();
      assetDetailsResults.forEach((result, index) => {
        if (result.status === "fulfilled" && !result.value.err) {
          assetDetailsMap.set(uniqueIsins[index], result.value.assetDetails);
        } else {
          const isin = uniqueIsins[index];
          const error =
            result.status === "rejected" ? result.reason : result.value.err;
          this.logger.error(
            `Error fetching asset details for ISIN ${isin}: ${error.message}`,
          );
        }
      });

      // Update all positions with the fetched data
      for (const position of positions) {
        if (!position.isin || !position.purchasePrice || !position.quantity)
          continue;

        const assetDetails = assetDetailsMap.get(position.isin);
        if (!assetDetails) continue;

        const currentPrice = assetDetails.quote.price;

        const profitPerShare = currentPrice - position.purchasePrice;
        const absoluteProfit = profitPerShare * position.quantity;

        position.logoUrl = assetDetails.asset.logo;
        position.securityName = assetDetails.asset.name;

        position.assetType = assetDetails.asset.assetType;
        position.currentPrice = this.utils.toDecimal(currentPrice);
        position.absoluteProfit = this.utils.toDecimal(absoluteProfit);
        position.relativeProfit = this.utils.toDecimal(
          (profitPerShare / position.purchasePrice) * 100,
        );
        position.positionValue = this.utils.toDecimal(
          currentPrice * position.quantity,
        );
      }
    });

    this.after("READ", StockPositionAllocations, async (positions) => {
      if (!positions) return;

      const uniqueIdentifiers = Array.from(
        new Set<string>(
          positions
            .filter((position) => position && typeof position.isin === "string")
            .map((position) => position.isin as string),
        ),
      );

      const assetDetailsPromises = uniqueIdentifiers.map(
        async (isin: string) => {
          const [assetDetails, err] = await Parqet.getAsset(isin);
          return { isin, assetDetails, err };
        },
      );
      const assetDetailsResults =
        await Promise.allSettled(assetDetailsPromises);

      // Create a Map for quick access to asset details
      const assetDetailsMap = new Map();
      assetDetailsResults.forEach((result, index) => {
        if (result.status === "fulfilled" && !result.value.err) {
          assetDetailsMap.set(
            uniqueIdentifiers[index],
            result.value.assetDetails,
          );
        } else {
          const isin = uniqueIdentifiers[index];
          const error =
            result.status === "rejected" ? result.reason : result.value.err;
          this.logger.error(
            `Error fetching asset details for ISIN ${isin}: ${error.message}`,
          );
        }
      });

      for (const position of positions) {
        const assetDetails = assetDetailsMap.get(position.isin);
        if (!assetDetails) continue;

        // I did something a little bit sketchy and selected the "quantity" as "absolutePositionSize" in order to "access" the value here withou any more work :/
        const quantity = position.absolutePositionSize;
        const currentPrice = assetDetails.quote.price;
        position.securityName = assetDetails.asset.name;
        position.absolutePositionSize = (quantity as number) * currentPrice;
        position.relativePositionSize = 0;
      }

      const totalPositionsValue = positions.reduce((value, curr) => {
        assert(
          curr.absolutePositionSize,
          "The absolute position size should be defined",
        );
        return value + curr.absolutePositionSize;
      }, 0);

      for (const position of positions) {
        assert(
          position.absolutePositionSize,
          "The absolute position size should be defined",
        );
        position.relativePositionSize = this.utils.toDecimal(
          (position.absolutePositionSize * 100) / totalPositionsValue,
        );
      }
    });

    // TODO: Write tests for this
    this.on("READ", StockPositionsKPIs, async (req) => {
      const DEFAULT_STATS = {
        absoluteCapitalGains: 0,
        totalPositionValue: 0,
        unrealisedProfit: 0,
        freeCapitalOnProfitablePositions: 0,
        unrealisedLoss: 0,
        boundCapitalOnLosingPositions: 0,
        upcomingDividends: 0,
      };

      this.assertRequestValueIsSet(req, "user");

      const stockPositions = await SELECT.from(StockPositions)
        .columns("isin", "purchasePrice", "purchaseFee", "quantity")
        .where({ owner: req.user.id });
      if (stockPositions.length === 0) {
        return DEFAULT_STATS;
      }

      const assetIdentifiers = new Set(
        stockPositions.map((position) => {
          assert(position.isin, "ISIN should be an string");
          return { identifier: position.isin };
        }),
      );
      const [assetQuotes, err] = await Parqet.getQuotes(
        Array.from(assetIdentifiers),
      );
      if (err) {
        req.error(err);
        return;
      }

      const [fetchedDividends, fetchDividendErr] = await Parqet.getDividends(
        Array.from(assetIdentifiers),
        {
          future: true,
          historical: true,
        },
      );
      if (fetchDividendErr) {
        req.error(fetchDividendErr);
        return;
      }
      const upcomingDividendPayments = new Map<string, number>();
      for (const details of Object.values(fetchedDividends.dividendDetails)) {
        const futureDividends = details.futureDividends;
        if (!futureDividends || futureDividends.length === 0) continue;

        const totalUpcomingDividends = futureDividends.reduce(
          (sum, dividend) => sum + dividend.price,
          0,
        );
        upcomingDividendPayments.set(
          details.identifier,
          totalUpcomingDividends,
        );
      }

      // REVISIT: Implement logic to calculate upcoming dividends after Dvidends are supported by this backend
      return stockPositions.reduce((stats, position) => {
        assert(position.isin, "ISIN should be a string");
        assert(position.quantity, "Quantity should be number");
        assert(position.purchasePrice, "Purchase Price should be a number");

        const fetchedAssetQuotes = assetQuotes.get(position.isin);
        if (!fetchedAssetQuotes) {
          this.logger.warn(`No quotes found for ISIN ${position.isin}`);
          return stats;
        }

        const priceHistory = fetchedAssetQuotes.quotes.sort(
          (a, b) => b.date.getTime() - a.date.getTime(),
        );
        const latestPrice = priceHistory[0].price;

        const positionBuyIn = position.quantity * position.purchasePrice;
        const currentPositionValue = position.quantity * latestPrice;
        const capitalGains = currentPositionValue - positionBuyIn;
        const isProfitable = capitalGains > 0;

        stats.totalPositionValue = this.utils.toDecimal(
          stats.totalPositionValue + currentPositionValue,
        );
        stats.absoluteCapitalGains = this.utils.toDecimal(
          stats.absoluteCapitalGains + capitalGains,
        );
        stats[isProfitable ? "unrealisedProfit" : "unrealisedLoss"] =
          this.utils.toDecimal(
            stats[isProfitable ? "unrealisedProfit" : "unrealisedLoss"] +
              Math.abs(capitalGains),
          );
        stats[
          isProfitable
            ? "freeCapitalOnProfitablePositions"
            : "boundCapitalOnLosingPositions"
        ] = this.utils.toDecimal(
          stats[
            isProfitable
              ? "freeCapitalOnProfitablePositions"
              : "boundCapitalOnLosingPositions"
          ] + currentPositionValue,
        );

        const dividendPayment = upcomingDividendPayments.has(position.isin)
          ? (upcomingDividendPayments.get(position.isin) as number)
          : 0;
        stats.upcomingDividends =
          stats.upcomingDividends + dividendPayment * position.quantity;

        return stats;
      }, DEFAULT_STATS);
    });

    // REVISIT:Check if there is an more "standard" way to do this in CAP
    this.on("READ", Dividends, async (req) => {
      this.assertRequestValueIsSet(req, "user");

      let options = {
        identifiers: [] as string[],
        future: true,
        historical: false,
      };
      const reqQuery = this.getReqQuery(req);
      // Determine which identifiers to fetch dividends for
      if (
        "identifier" in reqQuery &&
        (typeof reqQuery.identifier === "string" ||
          Array.isArray(reqQuery.identifier))
      ) {
        if (typeof reqQuery.identifier === "string") {
          options.identifiers.push(reqQuery.identifier);
        } else if (Array.isArray(reqQuery.identifier)) {
          for (const identifier of reqQuery.identifier) {
            if (typeof identifier !== "string") {
              this.logger.warn(
                `Invalid identifier value '%s'. Skipping...`,
                identifier,
              );
            }
            options.identifiers.push(identifier);
          }
        }

        this.logger.debug("Using provided identifiers for dividend fetch", {
          requestId: req.id,
          identifiers: options.identifiers,
        });
      } else {
        const identifiers = await SELECT.distinct
          .from(StockPositions)
          .columns("isin")
          .where({ owner: req.user.id });

        for (const identifier of identifiers) {
          if (!identifier.isin) {
            this.logger.warn(
              `Invalid identifier value '%s'. Skipping...`,
              identifier,
            );
            continue;
          }
          options.identifiers.push(identifier.isin);
        }
      }

      if (options.identifiers.length === 0) {
        this.logger.warn("No target identifiers found", { requestId: req.id });
        return [];
      }

      // Determine if future dividends should be fetched
      if ("future" in reqQuery) {
        options.future = reqQuery.future === "true" || reqQuery.future === true;
      }

      // Determine if historical dividends should be fetched
      if ("historical" in reqQuery) {
        options.historical =
          reqQuery.historical === "true" || reqQuery.historical === true;
      }

      if (!options.future && !options.historical) {
        this.logger.error("Neither future nor historical dividends requested", {
          requestId: req.id,
          options,
        });
        req.reject(
          400,
          "At least one of future or historical dividends must be requested",
        );
      }

      this.logger.debug("Fetching dividends with options", {
        requestId: req.id,
        options,
      });
      const [fetchedDividends, err] = await Parqet.getDividends(
        options.identifiers.map((identifier) => ({ identifier })),
        { future: options.future, historical: options.historical },
      );
      if (err) {
        req.error(err);
        return;
      }

      const mergedDividends = Object.entries(
        fetchedDividends.dividendDetails,
      ).flatMap(([, details]) => {
        const mergedDividends = [
          ...(details.futureDividends || []),
          ...(details.historicalDividends || []),
        ];
        return mergedDividends.flatMap((dividend) => ({
          identifier: details.identifier,
          payoutInterval: details.payoutInterval,
          price: dividend.price,
          currency: dividend.currency,
          date: dividend.date,
          datetime: dividend.datetime,
          paymentDate: dividend.paymentDate,
          recordDate: dividend.recordDate,
          exDate: dividend.exDate,
          isEstimated: dividend.isEstimated,
        }));
      });

      // REVISIT: Implement sorting using $sortby query option of OData V4
      return mergedDividends.sort(
        (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime(),
      );
    });

    // REVISIT: Make this more safe and add proper error handling
    this.on("READ", SearchAssets, async (req) => {
      const searchQuery = req.query.SELECT?.search;
      if (!searchQuery || searchQuery.length === 0) {
        this.logger.warn(
          "SearchAssets: No search query provided.",
          searchQuery,
        );
        return [];
      }
      const searchTerm = searchQuery[0].val;
      this.logger.debug(
        `SearchAssets: Searching for assets with term "${searchTerm}"`,
      );
      const [searchResults, error] = await Parqet.search(searchTerm);
      if (error) {
        this.logger.error(
          `Error searching for assets with term "${searchTerm}": ${error.message}`,
        );
        return [];
      }

      return searchResults?.map(
        (result) =>
          ({
            isin: result.assetId.identifier,
            name: result.name,
            assetType: result.assetId.assetType,
            // On securities, the logo can be undefined under the "asset"-node but when handling a commodity, the logo should always be present
            logoUrl:
              result.assetType === "Security"
                ? result.security.logo
                : result.asset.logo,
          }) as SearchAsset,
      );
    });

    this.after("READ", MetalQuotes, async (metals) => {
      if (!metals) return;

      const symbols = Array.from(
        new Set(metals.map((metal) => metal.symbol as string)),
      );

      const prices = new Map<
        string,
        SuccessMetalQuoteResponse<string>["rates"]
      >();
      await Promise.all(
        symbols.map(async (symbol) => {
          const CacheServicedValue = await this.metalCache.get(symbol);
          if (CacheServicedValue) {
            this.logger.debug(`Metal price for ${symbol} served from cache`);
            prices.set(symbol, CacheServicedValue);
            return true;
          }

          const price = await MetalPriceAPI.getPrice(symbol);
          if (!price || !price.success) return false;

          await this.metalCache.set(symbol, price.rates);
          this.logger.debug(
            `Metal price for ${symbol} fetched from API and cached`,
          );
          prices.set(symbol, price.rates);

          return true;
        }),
      );

      for (const metal of metals) {
        if (!metal.symbol) continue;
        if (!prices.has(metal.symbol)) {
          this.logger.warn(`No price found for metal symbol ${metal.symbol}`);
          continue;
        }

        const price = prices.get(metal.symbol);
        assert(price, "Price should be defined if prices has the symbol");
        metal.eur = price.EUR;
        metal.usd = price.USD;
      }
    });

    this.on("READ", RelatedAssets, async (req) => {
      this.assertRequestValueIsSet(req, "user");

      const reqQuery = this.getReqQuery(req);
      if (!("identifier" in reqQuery)) {
        req.reject(400, 'Query parameter "identifier" is required');
        return;
      }
      this.logger.info(reqQuery);

      const parsingResult = ApiSchemas.ISIN.safeParse(reqQuery.identifier);
      if (!parsingResult.success) {
        req.reject(
          400,
          `Query parameter "identifier" is not a valid ISIN: ${JSON.stringify(parsingResult.error.issues)}`,
        );
        return;
      }

      const [relatedAssets, err] = await Parqet.getRelatedAssets(
        parsingResult.data,
        6,
      );
      if (err) {
        req.error(err);
        return;
      }

      type AssetQuote = {
        identifier: string;
        date: Date;
        currency: string;
        price: number;
      };
      const assetQuoteMap = new Map<string, AssetQuote[]>();
      const shouldExpandQuotes =
        "$expand" in reqQuery && reqQuery.$expand === "quotes";
      if (shouldExpandQuotes) {
        this.logger.debug(
          "Fetching quotes for related assets as they were requested via $expand=quotes",
          reqQuery,
        );
        const [quotes, err] = await Parqet.getQuotes(
          relatedAssets.map(({ asset }) => ({
            identifier: asset._id.identifier,
          })),
          "1m",
        );
        if (err) {
          this.logger.error("Error fetching quotes for related assets", err);
          req.error(err);
          return;
        }

        for (const [identifier, details] of quotes.entries()) {
          const currency = details.currency;
          const relatedAssetQuotes = details.quotes.map((quote) => ({
            identifier: identifier,
            date: quote.date,
            currency: currency,
            price: quote.price,
          }));
          assetQuoteMap.set(identifier, relatedAssetQuotes);
        }
      }

      return relatedAssets.map(({ asset }) => {
        const identifier = asset._id.identifier;
        const securityType =
          asset.assetType === "Security"
            ? asset.security.type
            : asset.assetType === "Crypto"
              ? "Crypto"
              : "Commodity";

        let assetObj = {
          identifier: identifier,
          assetType: asset.assetType,
          securityName: asset.name,
          securityType,
          logoUrl: asset.logo,
        } as {
          identifier: string;
          assetType: string;
          securityName: string;
          securityType: string;
          logoUrl: string;
          quotes?: AssetQuote[];
        };

        if (shouldExpandQuotes) {
          assetObj.quotes = assetQuoteMap.get(identifier) || [];
        }

        return assetObj;
      });
    });

    this.on("READ", SecuritySectors, this.handleSecurityMappingRequest);
    this.on("READ", SecurityRegions, this.handleSecurityMappingRequest);
    this.on("READ", SecurityIndustries, this.handleSecurityMappingRequest);
    this.on("READ", SecurityCountries, async (req) => {
      const cachedValues = await this.assetCache.getCountries();
      if (cachedValues) {
        this.logger.debug("Returning cached country values", {
          count: cachedValues.length,
        });
        return cachedValues;
      }

      const [countries, err] = await Parqet.getCountries();
      if (err) {
        this.handleError(err, req);
        return;
      }

      await this.assetCache.setCountries(countries);
      return countries;
    });

    this.on("READ", Assets, async (req) => {
      const reqQuery = this.getReqQuery(req);
      // Determine which identifiers to fetch dividends for
      if (!("identifier" in reqQuery)) {
        req.reject(400, 'Query parameter "identifier" is required');
        return;
      }

      const rawIdentifiers = Array.isArray(reqQuery.identifier)
        ? reqQuery.identifier
        : [reqQuery.identifier];
      const identifiers = z
        .array(ApiSchemas.AssetIdentifier)
        .safeParse(rawIdentifiers);
      if (!identifiers.success) {
        req.reject(
          400,
          `One or more provided identifiers are invalid: ${JSON.stringify(
            identifiers.error.issues,
          )}`,
        );
        return;
      }

      // Retrieve static mappings
      const [countries, regions, sectors, industries] = await Promise.all([
        Parqet.getCountries().then(([countries, err]) => {
          if (err) throw err;
          return countries;
        }),
        this.getSecurityMapping("regions"),
        this.getSecurityMapping("sectors"),
        this.getSecurityMapping("industries"),
      ]);

      // Retrieve asset details
      this.logger.debug("Fetching assets with identifiers", { identifiers });
      const assetPromises: Promise<z.infer<
        typeof ResponseSchemas.Asset
      > | null>[] = identifiers.data.map(async (identifier) => {
        const [assetDetails, err] = await Parqet.getAsset(identifier);
        if (err) {
          this.logger.error(
            `Error fetching asset details for identifier ${identifier}: ${err.message}`,
          );
          return null;
        }

        const assetType = assetDetails.asset.assetType;
        const securityType: z.infer<
          typeof ResponseSchemas.Asset
        >["securityType"] =
          assetType === "Security"
            ? assetDetails.asset.security.type
            : assetType === "Crypto"
              ? "Crypto"
              : "Commodity";
        const assetSecurity =
          assetType === "Security" ? assetDetails.asset.security : null;
        const assetRegions = assetSecurity?.regions || [];
        const assetIndustries = assetSecurity?.industries || [];
        const assetSectors = assetSecurity?.sectors || [];
        const assetCountries = assetSecurity?.countries || [];
        const currency = assetDetails.details.securityDetails?.currency || null;
        const marketCap =
          assetDetails.details.securityDetails?.marketCap || null;
        const shares = assetDetails.details.securityDetails?.shares || null;
        const beta = assetDetails.details.securityDetails?.beta || null;
        const priceSalesRatioTTM =
          assetDetails.details.securityDetails?.priceSalesRatioTTM || null;
        const priceToBookRatioTTM =
          assetDetails.details.securityDetails?.priceToBookRatioTTM || null;
        const peRatioTTM =
          assetDetails.details.securityDetails?.peRatioTTM || null;
        const pegRatioTTM =
          assetDetails.details.securityDetails?.pegRatioTTM || null;
        const priceFairValueRatio =
          assetDetails.details.securityDetails?.priceFairValueTTM || null;
        const dividendYieldPercentageTTM =
          assetDetails.details.securityDetails?.dividendYielPercentageTTM ||
          null;
        const dividendPerShareTTM =
          assetDetails.details.securityDetails?.dividendPerShareTTM || null;
        const payoutRatioTTM =
          assetDetails.details.securityDetails?.payoutRatioTTM || null;
        const fiftyTwoWeekRange =
          assetDetails.details.securityDetails?.fiftyTwoWeekRange || null;
        const dividendPayoutInterval =
          assetDetails.details.payoutInterval ?? "none";
        const historicalDividends =
          assetDetails.details.historicalDividends || [];
        const futureDividends = assetDetails.details.futureDividends || [];
        const dividendKPIs = assetDetails.details.dividendKPIs || null;
        const dividendYearlyTTM = assetDetails.details.dividendYearlyTTM;
        const etfDetails = assetDetails.details.etfDetails;
        const etfBreakdown = assetDetails.details.etfBreakdown;
        const combinedEtfDetails: z.infer<
          typeof ResponseSchemas.Asset
        >["etfDetails"] =
          etfDetails && etfBreakdown
            ? {
                ...etfDetails,
                breakdown: {
                  updatedAt: etfBreakdown.updatedAt,
                  holdings: etfBreakdown.holdings,
                },
              }
            : null;

        const result: z.infer<typeof ResponseSchemas.Asset> = {
          identifier: assetDetails.asset._id.identifier,
          wkn:
            assetDetails.asset.assetType === "Security"
              ? assetDetails.asset.security.wkn
              : null,
          name: assetDetails.asset.name,
          etfDomicile:
            assetDetails.asset.assetType === "Security" &&
            assetDetails.asset.security.type === "ETF" &&
            assetDetails.asset.security.etfDomicile
              ? assetDetails.asset.security.etfDomicile
              : null,
          etfCompany:
            assetDetails.asset.assetType === "Security" &&
            assetDetails.asset.security.type === "ETF" &&
            assetDetails.asset.security.etfCompany
              ? assetDetails.asset.security.etfCompany
              : null,
          etfDetails: combinedEtfDetails,
          assetType,
          securityType,
          description: assetDetails.details.description || null,
          ipoDate:
            assetDetails.asset.assetType === "Security" &&
            assetDetails.asset.security.type !== "Zertifikat"
              ? assetDetails.asset.security.ipoDate
              : null,
          logoUrl: assetDetails.asset.logo,
          hasDividends: assetSecurity
            ? assetSecurity.type === "Aktie"
              ? assetSecurity.hasDividends
              : false
            : false,
          currency,
          marketCap,
          shares,
          beta,
          peRatioTTM,
          priceSalesRatioTTM,
          priceToBookRatioTTM,
          pegRatioTTM,
          priceFairValueRatio,
          dividendYieldPercentageTTM,
          dividendPerShareTTM,
          payoutRatioTTM,
          fiftyTwoWeekRange,
          financials: {
            annual:
              assetDetails.details.securityDetails?.annualFinancials || [],
            quarterly:
              assetDetails.details.securityDetails?.quarterlyFinancials || [],
            incomeStatementGrowth:
              assetDetails.details.securityDetails?.incomeStatementGrowth || [],
          },
          symbols:
            assetSecurity && assetSecurity.type !== "Zertifikat"
              ? assetSecurity?.symbols
              : [],
          dividends: {
            payoutInterval: dividendPayoutInterval,
            KPIs: dividendKPIs as any,
            yearlyTTM: dividendYearlyTTM
              ? Object.entries(dividendYearlyTTM).map(
                  ([year, dividend]) =>
                    ({
                      year,
                      dividend,
                    }) as { year: string; dividend: number },
                )
              : null,
            future: futureDividends.map((dividend) => ({
              type: dividend.type,
              security: dividend.security,
              price: dividend.price,
              currency: dividend.currency,
              date: dividend.date,
              datetime: dividend.datetime,
              paymentDate: dividend.paymentDate,
              declarationDate: dividend.declarationDate || null,
              recordDate:
                dividend.recordDate instanceof Date
                  ? dividend.recordDate
                  : null,
              exDate: dividend.exDate,
              isEstimated: dividend.isEstimated,
            })),
            historical: historicalDividends.map((dividend) => ({
              type: dividend.type,
              security: dividend.security,
              price: dividend.price,
              currency: dividend.currency,
              date: dividend.date,
              datetime: dividend.datetime,
              paymentDate: dividend.paymentDate,
              declarationDate: dividend.declarationDate || null,
              recordDate:
                dividend.recordDate instanceof Date
                  ? dividend.recordDate
                  : null,
              exDate: dividend.exDate,
              isEstimated: dividend.isEstimated,
            })),
          },
          analysis: {
            scorings: assetDetails.details.scorings || [],
            media: assetDetails.details.analysis?.entries || [],
            priceTargetConsensus:
              assetDetails.details.priceTargetConsensus || null,
            recommendation: assetDetails.details.analystEstimates,
          },
          regions: assetRegions.map((region) => {
            const regionId = region.id;
            const mapping = regions.find((r) => r._id === regionId);
            return {
              id: regionId,
              name: mapping?.labelEN || regionId,
              share: region.share,
            };
          }),
          industries: assetIndustries.map((industry) => {
            const industryId = industry.id;
            const mapping = industries.find((r) => r._id === industryId);
            return {
              id: industryId,
              name: mapping?.labelEN || industryId,
              share: industry.share,
            };
          }),
          sectors: assetSectors.map((sector) => {
            const sectorId = sector.id;
            const mapping = sectors.find((s) => s._id === sectorId);
            return {
              id: sectorId,
              name: mapping?.labelEN || sectorId,
              share: sector.share,
            };
          }),
          countries: assetCountries.map((country) => {
            const countryId = country.id;
            const mapping = countries.find((c) => c._id === countryId);
            return {
              id: countryId,
              name: mapping?.name || countryId,
              share: country.share,
            };
          }),
          news: assetDetails.details.news,
        };

        return result;
      });

      const assets = await Promise.all(assetPromises);
      return (
        assets.filter(
          (asset): asset is z.infer<typeof ResponseSchemas.Asset> =>
            asset !== null,
        ) || []
      );
    });

    this.on("READ", AssetQuotes, async (req) => {
      const reqQuery = this.getReqQuery(req);
      // Determine which identifiers to fetch dividends for
      if (!("identifier" in reqQuery)) {
        req.reject(400, 'Query parameter "identifier" is required');
        return;
      }
      if (!("timeframe" in reqQuery)) {
        req.reject(400, 'Query parameter "timeframe" is required');
        return;
      } else if (typeof reqQuery.timeframe !== "string") {
        req.reject(400, 'Query parameter "timeframe" must be a string');
        return;
      }
      const timeframe = reqQuery.timeframe;
      const rawIdentifiers = Array.isArray(reqQuery.identifier)
        ? reqQuery.identifier
        : [reqQuery.identifier];
      const identifiers = z
        .array(ApiSchemas.AssetIdentifier)
        .safeParse(rawIdentifiers);
      if (!identifiers.success) {
        req.reject(
          400,
          `One or more provided identifiers are invalid: ${JSON.stringify(
            identifiers.error.issues,
          )}`,
        );
        return;
      }

      const [quotes, err] = await Parqet.getQuotes(
        identifiers.data.map((identifier) => ({ identifier })),
        // @ts-expect-error
        timeframe,
        "currency" in reqQuery && typeof reqQuery.currency === "string"
          ? reqQuery.currency
          : undefined,
      );
      if (err) {
        this.handleError(err, req);
        return;
      }

      return Array.from(quotes.entries()).map(([identifier, details]) => {
        return {
          identifier: identifier,
          from: details.interval.from,
          to: details.interval.to,
          timeframe: details.interval.timeframe,
          exchange: details.exchange,
          currency: details.currency,
          quotes: details.quotes,
        };
      });
    });

    return super.init();
  }

  private async getSecurityMapping(
    cacheKey: "sectors" | "regions" | "industries",
  ) {
    const cachedValues = await this.assetCache.getMapping(cacheKey);
    if (cachedValues) {
      this.logger.debug(`Returning cached values for '${cacheKey}'`, {
        count: cachedValues.length,
      });
      return cachedValues;
    }

    let fetchedData: z.infer<
      | typeof ApiSchemas.Sector
      | typeof ApiSchemas.Region
      | typeof ApiSchemas.Industry
    >[] = [];
    switch (cacheKey) {
      case "sectors": {
        const [sectors, err] = await Parqet.getSectors();
        if (err) throw err;
        fetchedData = sectors;
        break;
      }
      case "regions": {
        const [regions, err] = await Parqet.getRegions();
        if (err) throw err;
        fetchedData = regions;
        break;
      }
      case "industries": {
        const [industries, err] = await Parqet.getIndustries();
        if (err) throw err;
        fetchedData = industries;
        break;
      }
    }

    await this.assetCache.setMapping(cacheKey, fetchedData);
    return fetchedData;
  }

  private async handleSecurityMappingRequest(
    request: cds.Request<
      | typeof SecurityIndustries
      | typeof SecurityRegions
      | typeof SecuritySectors
    >,
  ) {
    try {
      const cacheKey = this.assetCache.resolveEntityMapping(request.entity);
      return this.getSecurityMapping(cacheKey);
    } catch (error) {
      this.handleError(error, request);
      return []; // Only for linting; this line is never reached due to handleError rejecting the request
    }
  }
}
