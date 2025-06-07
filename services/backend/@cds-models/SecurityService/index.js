// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../_')
// service
const SecurityService = { name: 'SecurityService' }
module.exports = SecurityService
module.exports.SecurityService = SecurityService
// User
module.exports.User = createEntityProxy(['SecurityService', 'User'], { target: { is_singular: true } })
module.exports.Users = createEntityProxy(['SecurityService', 'User'], { target: { is_singular: false }})
// StockExchange
module.exports.StockExchange = createEntityProxy(['SecurityService', 'StockExchange'], { target: { is_singular: true } })
module.exports.StockExchanges = createEntityProxy(['SecurityService', 'StockExchange'], { target: { is_singular: false }})
// StockWatchlist
module.exports.StockWatchlist = createEntityProxy(['SecurityService', 'StockWatchlist'], { target: { is_singular: true } })
module.exports.StockWatchlists = createEntityProxy(['SecurityService', 'StockWatchlist'], { target: { is_singular: false }})
// StockPosition
module.exports.StockPosition = createEntityProxy(['SecurityService', 'StockPosition'], { target: { is_singular: true } })
module.exports.StockPositions = createEntityProxy(['SecurityService', 'StockPosition'], { target: { is_singular: false }})
// Currencies
module.exports.Currency = createEntityProxy(['SecurityService', 'Currencies'], { target: { is_singular: true } })
module.exports.Currencies = createEntityProxy(['SecurityService', 'Currencies'], { target: { is_singular: false }})
// StockExchange.texts
module.exports.StockExchange.text = createEntityProxy(['SecurityService', 'StockExchange.texts'], { target: { is_singular: true } })
module.exports.StockExchange.texts = createEntityProxy(['SecurityService', 'StockExchange.texts'], { target: { is_singular: false }})
// Currencies.texts
module.exports.Currencies.text = createEntityProxy(['SecurityService', 'Currencies.texts'], { target: { is_singular: true } })
module.exports.Currencies.texts = createEntityProxy(['SecurityService', 'Currencies.texts'], { target: { is_singular: false }})
// events
// actions
// enums
