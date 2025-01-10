import { isIsin } from '../utils/isIsin';

export class TickerBase {
  private ticker: string;
  private isin: string = null;
  private news = [];
  private shares = null;
  private earningDates = {};
  private earings = null;
  private financials = null;
  private priceHistory = [];
  private analysis = null;
  private holders = null;
  private quote = null;
  private fundamentals = null;
  private fundsData = null;
  private fastInfo = null;

  constructor(ticker: string) {
    if (isIsin(ticker)) {
      this.ticker = ticker;
    }
  }
}
