// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../../_')
// User
module.exports.User = createEntityProxy(['de.budgetbuddy', 'User'], { target: { is_singular: true } })
module.exports.Users = createEntityProxy(['de.budgetbuddy', 'User'], { target: { is_singular: false }})
// Category
module.exports.Category = createEntityProxy(['de.budgetbuddy', 'Category'], { target: { is_singular: true } })
module.exports.Categories = createEntityProxy(['de.budgetbuddy', 'Category'], { target: { is_singular: false }})
// PaymentMethod
module.exports.PaymentMethod = createEntityProxy(['de.budgetbuddy', 'PaymentMethod'], { target: { is_singular: true } })
module.exports.PaymentMethods = createEntityProxy(['de.budgetbuddy', 'PaymentMethod'], { target: { is_singular: false }})
// Transaction
module.exports.Transaction = createEntityProxy(['de.budgetbuddy', 'Transaction'], { target: { is_singular: true } })
module.exports.Transactions = createEntityProxy(['de.budgetbuddy', 'Transaction'], { target: { is_singular: false }})
// Subscription
module.exports.Subscription = createEntityProxy(['de.budgetbuddy', 'Subscription'], { target: { is_singular: true } })
module.exports.Subscriptions = createEntityProxy(['de.budgetbuddy', 'Subscription'], { target: { is_singular: false }})
// Budget
module.exports.Budget = createEntityProxy(['de.budgetbuddy', 'Budget'], { target: { is_singular: true }, customProps: ["type"] })
module.exports.Budgets = createEntityProxy(['de.budgetbuddy', 'Budget'], { target: { is_singular: false }})
// Newsletter
module.exports.Newsletter = createEntityProxy(['de.budgetbuddy', 'Newsletter'], { target: { is_singular: true } })
module.exports.Newsletters = createEntityProxy(['de.budgetbuddy', 'Newsletter'], { target: { is_singular: false }})
// NewsletterSubscription
module.exports.NewsletterSubscription = createEntityProxy(['de.budgetbuddy', 'NewsletterSubscription'], { target: { is_singular: true } })
module.exports.NewsletterSubscriptions = createEntityProxy(['de.budgetbuddy', 'NewsletterSubscription'], { target: { is_singular: false }})
// StockExchange
module.exports.StockExchange = createEntityProxy(['de.budgetbuddy', 'StockExchange'], { target: { is_singular: true } })
module.exports.StockExchanges = createEntityProxy(['de.budgetbuddy', 'StockExchange'], { target: { is_singular: false }})
// StockWatchlist
module.exports.StockWatchlist = createEntityProxy(['de.budgetbuddy', 'StockWatchlist'], { target: { is_singular: true } })
module.exports.StockWatchlists = createEntityProxy(['de.budgetbuddy', 'StockWatchlist'], { target: { is_singular: false }})
// StockPosition
module.exports.StockPosition = createEntityProxy(['de.budgetbuddy', 'StockPosition'], { target: { is_singular: true } })
module.exports.StockPositions = createEntityProxy(['de.budgetbuddy', 'StockPosition'], { target: { is_singular: false }})
// Budget.categories
module.exports.Budget.category = createEntityProxy(['de.budgetbuddy', 'Budget.categories'], { target: { is_singular: true } })
module.exports.Budget.categories = createEntityProxy(['de.budgetbuddy', 'Budget.categories'], { target: { is_singular: false }})
// Newsletter.texts
module.exports.Newsletter.text = createEntityProxy(['de.budgetbuddy', 'Newsletter.texts'], { target: { is_singular: true } })
module.exports.Newsletter.texts = createEntityProxy(['de.budgetbuddy', 'Newsletter.texts'], { target: { is_singular: false }})
// StockExchange.texts
module.exports.StockExchange.text = createEntityProxy(['de.budgetbuddy', 'StockExchange.texts'], { target: { is_singular: true } })
module.exports.StockExchange.texts = createEntityProxy(['de.budgetbuddy', 'StockExchange.texts'], { target: { is_singular: false }})
// events
// actions
// enums
module.exports.Budget.type ??= { include: "include", exclude: "exclude" }
