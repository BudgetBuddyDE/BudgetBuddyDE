import {type TApiResponse} from '@budgetbuddyde/types';
import {type TStockPosition, type TMaterializedStockPositionTable, type TStockPositionTable} from './Stock.types';
import {TAssetSearchResult} from './StockService.types';

// FIXME: Update me
export type TStockServiceResponseCollection = {
  GET_SearchAsset: TApiResponse<TAssetSearchResult[]>;
  GET_Position: TApiResponse<TStockPosition[]>;
  POST_OpenPosition: TApiResponse<TStockPosition[]>;
  PUT_UpdatePosition: TApiResponse<TMaterializedStockPositionTable[]>;
  DELETE_ClosePosition: TApiResponse<TStockPositionTable[]>;
};

export type TStockServiceResponse<Endpoint extends keyof TStockServiceResponseCollection> =
  TStockServiceResponseCollection[Endpoint];
