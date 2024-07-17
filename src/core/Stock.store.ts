import {type TStockExchange, type TStockQuote} from '@budgetbuddyde/types';
import {createStore} from 'zustand/vanilla';

import {ELogCategory} from '../middleware';
import {logger} from './logger';

export type TStockSubscription = {
  isin: string;
  exchange: TStockExchange['exchange'];
  quote: Pick<TStockQuote, 'datetime' | 'cachedAt' | 'price' | 'currency'> | null;
  /**
   * A list of client IDs that are subscribed toa this stock.
   */
  subscribers: string[];
};

export interface IStockStore {
  /**
   * A map of stock subscriptions.
   *
   * `[exchange extends string]: TStockSubscription[]`
   */
  subscriptions: Map<string, TStockSubscription[]>;
  addSubscription: (
    data: (Pick<TStockSubscription, 'isin' | 'exchange'> & {quote?: TStockQuote})[],
    client: string,
  ) => void;
  removeSubscription: (stock: Pick<TStockSubscription, 'isin' | 'exchange'>[], client: string) => void;
  getSubscriptionsGroupedByExchange: () => {exchange: string; assets: string[]}[];
  updateSubscription: (stock: Pick<TStockSubscription, 'isin' | 'exchange'>, subscription: TStockSubscription) => void;
  getSubscription: (
    asset: TStockSubscription['isin'],
    exchange: TStockSubscription['exchange'],
  ) => TStockSubscription | null;
  clear: () => void;
}

const StockStore = createStore<IStockStore>((set, get) => ({
  subscriptions: new Map(),
  addSubscription: (stocks, client) => {
    const subscriptions = get().subscriptions;

    stocks.forEach(stock => {
      logger.info(`Processing stock: {assetName}`, {
        category: ELogCategory.STOCK_SUBSCRIPTION,
        stock: stock,
        assetName: stock.isin,
      });
      if (subscriptions.has(stock.exchange)) {
        const exchangeSubscriptions = subscriptions.get(stock.exchange);
        logger.info(`Checking if stock ({isin}) is already subscribed`, {
          category: ELogCategory.STOCK_SUBSCRIPTION,
          isin: stock.isin,
        });
        const stockSubscription = exchangeSubscriptions
          ? (exchangeSubscriptions.find(subscription => subscription.isin === stock.isin) ?? null)
          : null;

        if (!stockSubscription) {
          logger.info(`Adding stock ({isin}) with client ({client}) as new subscription`, {
            category: ELogCategory.STOCK_SUBSCRIPTION,
            isin: stock.isin,
            client: client,
          });
          const stockWithQuote = {
            isin: stock.isin,
            exchange: stock.exchange,
            quote: null,
            subscribers: [client],
          };
          exchangeSubscriptions!.push(stockWithQuote);
        } else {
          logger.info('Adding client ({client}) to existing subscription {exchange}:{isin}', {
            category: ELogCategory.STOCK_SUBSCRIPTION,
            client: client,
            exchange: stock.exchange,
            isin: stock.isin,
          });
          stockSubscription.subscribers = [...new Set([...stockSubscription.subscribers, client])];
        }
      } else {
        logger.info(`Adding exchange ({exchange}) with stock ({isin}) as new subscription`, {
          category: ELogCategory.STOCK_SUBSCRIPTION,
          exchange: stock.exchange,
          isin: stock.isin,
        });
        subscriptions.set(stock.exchange, [
          {isin: stock.isin, exchange: stock.exchange, quote: null, subscribers: [client]},
        ]);
      }
    });
  },
  removeSubscription: (stocks, client) => {
    const subscriptions = get().subscriptions;

    stocks.forEach(stock => {
      if (subscriptions.has(stock.exchange)) {
        const exchangeSubscriptions = subscriptions.get(stock.exchange);
        if (!exchangeSubscriptions || !exchangeSubscriptions.some(subscription => subscription.isin === stock.isin))
          return;
        const stockSubscriptionIdx =
          exchangeSubscriptions!.findIndex(subscription => subscription.isin === stock.isin) ?? null;

        if (stockSubscriptionIdx >= 0) {
          const stockSubscription = exchangeSubscriptions![stockSubscriptionIdx];
          if (stockSubscription.subscribers.length > 1) {
            stockSubscription.subscribers.splice(stockSubscription.subscribers.indexOf(client), 1);
          } else {
            exchangeSubscriptions?.splice(stockSubscriptionIdx, 1);
          }
        } else {
          logger.info(`Stock ({isin}) not found in exchange ({exchange})`, {
            category: ELogCategory.STOCK_SUBSCRIPTION,
            isin: stock.isin,
            exchange: stock.exchange,
          });
        }
      }
    });

    set({subscriptions: subscriptions});
  },
  getSubscriptionsGroupedByExchange: () => {
    const subscriptions = get().subscriptions;
    const entries = Array.from(subscriptions.entries());
    return entries.map(([exchange, stocks]) => ({
      exchange: exchange,
      assets: stocks.map(stock => stock.isin),
    }));
  },
  updateSubscription: (stock, subscription) => {
    const subscriptions = get().subscriptions;
    const currentSubscription = get().getSubscription(stock.isin, stock.exchange);

    if (!currentSubscription) {
      logger.warn(`Subscription for stock ({stock.isin}) in exchange ({stock.exchange}) not found`, {
        category: ELogCategory.STOCK_SUBSCRIPTION,
        stock: stock,
      });
      return;
    }

    const exchangeSubscriptions = subscriptions.get(stock.exchange);
    const stockSubscriptionIdx = exchangeSubscriptions!.findIndex(subscription => subscription.isin === stock.isin);
    exchangeSubscriptions![stockSubscriptionIdx] = subscription;
    logger.info(`Updated subscription for stock ({stock.isin}) in exchange ({stock.exchange})`, {
      category: ELogCategory.STOCK_SUBSCRIPTION,
      stock: stock,
    });
  },
  getSubscription: (asset, exchange) => {
    const subscriptions = get().subscriptions;
    if (!subscriptions.has(exchange)) return null;

    const exchangeSubscriptions = subscriptions.get(exchange) as TStockSubscription[];
    const matchedAsset = exchangeSubscriptions.find(({isin}) => isin === asset);

    return matchedAsset || null;
  },
  clear: () => {
    set({subscriptions: new Map()});
  },
}));

export default StockStore;
