// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../_')
// service
const DataService = { name: 'DataService' }
module.exports = DataService
module.exports.DataService = DataService
// User
module.exports.User = createEntityProxy(['DataService', 'User'], { target: { is_singular: true } })
module.exports.Users = createEntityProxy(['DataService', 'User'], { target: { is_singular: false }})
// Category
module.exports.Category = createEntityProxy(['DataService', 'Category'], { target: { is_singular: true } })
module.exports.Categories = createEntityProxy(['DataService', 'Category'], { target: { is_singular: false }})
// PaymentMethod
module.exports.PaymentMethod = createEntityProxy(['DataService', 'PaymentMethod'], { target: { is_singular: true } })
module.exports.PaymentMethods = createEntityProxy(['DataService', 'PaymentMethod'], { target: { is_singular: false }})
// Transaction
module.exports.Transaction = createEntityProxy(['DataService', 'Transaction'], { target: { is_singular: true } })
module.exports.Transactions = createEntityProxy(['DataService', 'Transaction'], { target: { is_singular: false }})
// Subscription
module.exports.Subscription = createEntityProxy(['DataService', 'Subscription'], { target: { is_singular: true } })
module.exports.StockWatchlists = createEntityProxy(['DataService', 'Subscription'], { target: { is_singular: false }})
// Budget
module.exports.Budget = createEntityProxy(['DataService', 'Budget'], { target: { is_singular: true }, customProps: ["type"] })
module.exports.Budgets = createEntityProxy(['DataService', 'Budget'], { target: { is_singular: false }})
// Budget.categories
module.exports.Budget.category = createEntityProxy(['DataService', 'Budget.categories'], { target: { is_singular: true } })
module.exports.Budget.categories = createEntityProxy(['DataService', 'Budget.categories'], { target: { is_singular: false }})
// events
// actions
// enums
module.exports.Budget.type ??= { include: "include", exclude: "exclude" }
