using {de.budgetbuddy as db} from '../db/schema';

@protocol: ['odata',
// 'rest'
]
service AssetService {

  @plural: 'SearchAssets'
  entity SearchAsset                                    as projection on db.SearchAsset;

  @plural                : 'StockExchanges'
  @cds.redirection.target: 'StockExchange'
  entity StockExchange @(restrict: [{grant: ['READ']}]) as projection on db.StockExchange;

  @readonly
  view StockExchange_VH @(restrict: [{grant: ['READ']}]) as
    select from db.StockExchange {
      symbol,
      name,
      technicalName
    };

  @plural: 'StockWatchlists'
  entity StockWatchlist @(restrict: [{
    grant: [
      'READ',
      'CREATE',
      'UPDATE',
      'DELETE'
    ],
    where: 'createdBy = $user'
  }])                                                   as projection on db.StockWatchlist;

  @plural: 'StockPositions'
  entity StockPosition @(restrict: [{
    grant: [
      'READ',
      'CREATE',
      'UPDATE',
      'DELETE'
    ],
    where: 'createdBy = $user'
  }])                                                   as projection on db.StockPosition;

  @plural: 'StockPositionAllocations'
  entity StockPositionAllocation                        as projection on db.StockPositionAllocation;

  @plural: 'Dividends'
  entity Dividend                                       as projection on db.Dividend;

  @plural: 'StockPositionsKPIs'
  entity StockPositionsKPI                              as projection on db.StockPositionsKPI;

  @plural: 'Metals'
  entity Metal                                          as projection on db.Metal;

  @plural: 'MetalQuotes'
  entity MetalQuote                                     as projection on db.MetalQuote;

  @plural: 'RelatedAssets'
  entity RelatedAsset                                   as projection on db.RelatedAsset;

  // @plural: 'RelatedAssetQuotes'
  // entity RelatedAssetQuote                              as projection on db.RelatedAssetQuote;

  @plural: 'SecuritySectors'
  entity SecuritySector                                 as projection on db.SecuritySector;
}
