import {StockStore, type TStockSubscription} from '../core';
import {logger} from '../logger';
import {ELogCategory} from '../middleware';
import {StockService} from '../services';

export const AssetSubscriptionHandler = {
  UpdateAssetSubscriptions,
};

async function UpdateAssetSubscriptions(): Promise<
  {
    exchange: string;
    isin: string;
    quote: {
      datetime: Date;
      currency: string;
      price: number;
    };
    subscribers: string[];
  }[]
> {
  logger.info('Updating stock subscriptions', {category: ELogCategory.STOCK_SUBSCRIPTION});
  const updatedSubscriptions = [] as {
    exchange: string;
    isin: string;
    quote: {datetime: Date; currency: string; price: number};
    subscribers: string[];
  }[];
  const stockStore = StockStore.getState();
  const groupedStocks = stockStore.getSubscriptionsGroupedByExchange();

  logger.info(
    'Fetching stock prices for ' +
      groupedStocks.map(({exchange, assets}) => assets.map(asset => `${exchange}:${asset}`).join(',')) +
      ' exchange/s',
    {category: ELogCategory.STOCK},
  );
  const promises = await Promise.allSettled(
    groupedStocks.map(({assets, exchange}) =>
      StockService.getQuotes(
        assets.map(isin => ({isin, exchange})),
        '1d',
      ),
    ),
  );
  for (const resolvedPromise of promises) {
    if (resolvedPromise.status === 'rejected') return [];

    const [quotes, error] = resolvedPromise.value;
    if (error) logger.warn(`Error fetching stock prices: ${error.message}`, {category: ELogCategory.STOCK, error});
    if (!quotes) {
      logger.info(`No quotes found`, {category: ELogCategory.STOCK});
      return [];
    }
    logger.info(`Received ${quotes.length} quote/s`, {category: ELogCategory.STOCK});

    quotes.forEach(quote => {
      const subscription = stockStore.getSubscription(quote.assetIdentifier, quote.exchange);
      if (!subscription) return;
      const newestPriceUpdate = quote.quotes.slice(-1)[0];

      logger.info(`Comparing ({isin}) ${subscription.quote?.price} with ${newestPriceUpdate.price}`, {
        category: ELogCategory.STOCK_SUBSCRIPTION,
        isin: quote.assetIdentifier,
        exchange: quote.exchange,
      });
      if (subscription.quote?.price === newestPriceUpdate.price) return;

      const updatedSubscription: TStockSubscription = {
        ...subscription,
        quote: {
          cachedAt: quote.interval.to,
          datetime: quote.interval.to,
          currency: quote.currency,
          price: newestPriceUpdate.price,
        },
      };
      stockStore.updateSubscription({isin: quote.assetIdentifier, exchange: quote.exchange}, updatedSubscription);
      updatedSubscriptions.push({
        exchange: quote.exchange,
        isin: quote.assetIdentifier,
        quote: {
          datetime: updatedSubscription.quote!.datetime,
          currency: updatedSubscription.quote!.currency,
          price: updatedSubscription.quote!.price,
        },
        subscribers: subscription.subscribers,
      });
    });
  }

  logger.info(
    'Updated subscriptions: ' +
      (updatedSubscriptions.length > 0
        ? updatedSubscriptions.map(({exchange, isin}) => `${exchange}:${isin}`).join(', ')
        : 'none'),
    {category: ELogCategory.STOCK_SUBSCRIPTION},
  );
  return updatedSubscriptions;
}
