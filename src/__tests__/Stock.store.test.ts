import StockStore, {type TStockSubscription} from '../core/Stock.store';

// US56035L1044, MainStreet Capital
// US04010L1035, Ares Capital

describe('adding asset-subscriptions', () => {
  beforeEach(() => StockStore.getState().clear());

  it('adding an asset', () => {
    // Act
    StockStore.getState().addSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client1');

    // Assert
    const state = StockStore.getState();
    expect(state.subscriptions.size).toBe(1);
    expect(state.subscriptions.get('LSX')).toEqual([
      {
        exchange: 'LSX',
        isin: 'US56035L1044',
        quote: null,
        subscribers: ['client1'],
      },
    ] as TStockSubscription[]);
  });

  it('adding multiple assets', () => {
    // Act
    StockStore.getState().addSubscription(
      [
        {isin: 'US56035L1044', exchange: 'LSX'},
        {isin: 'US04010L1035', exchange: 'LSX'},
      ],
      'client1',
    );

    // Assert
    const state = StockStore.getState();
    expect(state.subscriptions.size).toBe(1);
    expect(state.subscriptions.get('LSX')).toEqual([
      {
        exchange: 'LSX',
        isin: 'US56035L1044',
        quote: null,
        subscribers: ['client1'],
      },
      {
        exchange: 'LSX',
        isin: 'US04010L1035',
        quote: null,
        subscribers: ['client1'],
      },
    ] as TStockSubscription[]);
  });

  it('adding an an already existing asset', () => {
    // Prepare
    StockStore.getState().addSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client1');

    // Act
    StockStore.getState().addSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client2');

    // Assert
    const state = StockStore.getState();
    expect(state.subscriptions.size).toBe(1);
    expect(state.subscriptions.get('LSX')).toEqual([
      {
        exchange: 'LSX',
        isin: 'US56035L1044',
        quote: null,
        subscribers: ['client1', 'client2'],
      },
    ] as TStockSubscription[]);
  });

  it('adding assets with different exchanges', () => {
    // Act
    StockStore.getState().addSubscription(
      [
        {isin: 'US56035L1044', exchange: 'LSX'},
        {isin: 'US04010L1035', exchange: 'FRA'},
      ],
      'client1',
    );

    // Assert
    const state = StockStore.getState();
    expect(state.subscriptions.size).toBe(2);
    expect(state.subscriptions.get('LSX')).toEqual([
      {
        exchange: 'LSX',
        isin: 'US56035L1044',
        quote: null,
        subscribers: ['client1'],
      },
    ] as TStockSubscription[]);
    expect(state.subscriptions.get('FRA')).toEqual([
      {
        exchange: 'FRA',
        isin: 'US04010L1035',
        quote: null,
        subscribers: ['client1'],
      },
    ] as TStockSubscription[]);
  });
});

describe('removing asset-subscriptions', () => {
  beforeEach(() => StockStore.getState().clear());

  it('removing the last subscription to an asset', () => {
    // Prepare
    StockStore.getState().addSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client1');

    // Act
    StockStore.getState().removeSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client1');

    // Assert
    const state = StockStore.getState();
    expect(state.subscriptions.size).toBeLessThanOrEqual(1);
    expect(state.subscriptions.get('LSX')).toEqual([]);
  });

  it('removing one subscription from an asset', () => {
    // Prepare
    StockStore.getState().addSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client1');
    StockStore.getState().addSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client2');

    // Act
    StockStore.getState().removeSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client1');

    // Assert
    const state = StockStore.getState();
    expect(state.subscriptions.size).toBe(1);
    expect(state.subscriptions.get('LSX')).toEqual([
      {
        exchange: 'LSX',
        isin: 'US56035L1044',
        quote: null,
        subscribers: ['client2'],
      },
    ] as TStockSubscription[]);
  });

  it('removing a non-existing asset 1/2', () => {
    // Act
    StockStore.getState().removeSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client1');

    // Assert
    const state = StockStore.getState();
    expect(state.subscriptions.size).toBe(0);
    expect(state.subscriptions).toEqual(new Map());
  });

  it('removing a non-existing asset 2/2', () => {
    // Prepare
    StockStore.getState().addSubscription(
      [
        {isin: 'US56035L1044', exchange: 'LSX'},
        {isin: 'US04010L1035', exchange: 'LSX'},
      ],
      'client1',
    );

    // Act
    StockStore.getState().removeSubscription([{isin: 'US56035L1040', exchange: 'LSX'}], 'client1');

    // Assert
    const state = StockStore.getState();
    expect(state.subscriptions.size).toBe(1);
    expect(state.subscriptions.get('LSX')).toEqual([
      {
        exchange: 'LSX',
        isin: 'US56035L1044',
        quote: null,
        subscribers: ['client1'],
      },
      {
        exchange: 'LSX',
        isin: 'US04010L1035',
        quote: null,
        subscribers: ['client1'],
      },
    ]);
  });

  it('clearing the store', () => {
    // Prepare
    StockStore.getState().addSubscription([{isin: 'US56035L1044', exchange: 'LSX'}], 'client1');

    // Act
    StockStore.getState().clear();

    // Assert
    const state = StockStore.getState();
    expect(state.subscriptions.size).toBe(0);
    expect(state.subscriptions).toEqual(new Map());
  });
});
