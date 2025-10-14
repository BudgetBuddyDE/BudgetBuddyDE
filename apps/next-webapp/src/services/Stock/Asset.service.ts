import { DividendService } from './Dividend.service';
import { MetalService } from './Metal.service';
import { StockExchangeService } from './StockExchange.service';
import { StockPositionService } from './StockPosition.service';

export class AssetService {
  public static exchange = StockExchangeService;
  public static positions = StockPositionService;
  public static dividends = DividendService;
  public static metal = MetalService;
}
