import {
  StockPositions,
  StockPositionsKPIs,
  SearchAssets,
  SearchAsset,
  Dividends,
  StockPositionAllocations,
} from "#cds-models/AssetService";
import assert from "node:assert";
import { Parqet } from "./lib/Parqet";
import { BaseService } from "./lib/BaseService";

export class AssetService extends BaseService {
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

    return super.init();
  }
}
