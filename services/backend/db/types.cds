namespace de.budgetbuddy;

type Description  : LargeString default null;

type UserID       : String @assert.notNull
                           @cds.on.insert: $user;
// Automatically set to the user ID of the current user
// This may not even be necessary, as the user ID is already set by the framework when the entity inherits the `managed` aspect.

type ISIN         : String(12) @assert.notNull;
type CurrencyCode : String(3) @assert.notNull;

type BudgetType   : String(1) enum {
  INCLUDE = 'i';
  EXCLUDE = 'e';
}

type MetalUnit    : String(7) enum {
  TROY_OUNCE = 'troy_oz';
  OUNCE = 'oz';
}

aspect AssetDividend {
      type            : String;
      security        : String;
      price           : Double;
      currency        : String;
      date            : Date;
      datetime        : Date;
      paymentDate     : Date;
      declarationDate : Date;
      recordDate      : Date;
  key exDate          : Date;
      isEstimated     : Boolean;
}

aspect FiftyTwoWeekRange {
  ![from] : Double;
  to      : Double;
}

aspect FinancialRelease {
      currency    : String;
  key date        : Date;
      revenue     : Double;
      grossProfit : Double;
      netIncome   : Double;
      ebitda      : Double;
}

aspect IncomeStatementGrowth {
  date            : Date;
  growthRevenue   : Double;
  growthNetIncome : Double;
}

aspect AssetSymbol {
  key exchange : String;
  key symbol   : String
}

// Used for regions, countries, sectors, industries
aspect StaticAssetMapping {
  key id    : String;
      name  : String;
      share : Double
}

aspect AnalystRecommendation {
  strongBuy  : Integer;
  buy        : Integer;
  hold       : Integer;
  sell       : Integer;
  strongSell : Integer;
}

aspect MediaAnalysis {
  analysisDate : Date;
  mediaType    : String;
  ratingCount  : Double;
  rating       : Double;
  author       : String;
  title        : String;
  url          : String;
}

aspect NewsArticle {
  title       : String;
  description : String;
  url         : String;
  publishedAt : Date;
}

aspect PriceTargetConsensus {
  currency  : String;
  high      : Double;
  low       : Double;
  consensus : Double;
  median    : Double;
}

aspect AssetAnalysisScoring {
  source     : String;
  type       : String;
  value      : Integer;
  maxValue   : Integer;
  badgeColor : String;
}

aspect AssetDividendKPIs {
  cagr3Y                     : Double;
  cagr5Y                     : Double;
  cagr10Y                    : Double;
  dividendYieldPercentageTTM : Double;
  dividendPerShareTTM        : Double;
}

aspect AssetYearlyDividendTTM {
  key year     : String;
      dividend : Double;
}

aspect EtfHolding {
  key name           : String;
      share          : Double;
      marketValue    : Double;
      amountOfShares : Double;
}
