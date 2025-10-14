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
