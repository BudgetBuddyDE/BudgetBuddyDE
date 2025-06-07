// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../_')
// service
const NewsletterService = { name: 'NewsletterService' }
module.exports = NewsletterService
module.exports.NewsletterService = NewsletterService
// User
module.exports.User = createEntityProxy(['NewsletterService', 'User'], { target: { is_singular: true } })
module.exports.Users = createEntityProxy(['NewsletterService', 'User'], { target: { is_singular: false }})
// Newsletter
module.exports.Newsletter = createEntityProxy(['NewsletterService', 'Newsletter'], { target: { is_singular: true } })
module.exports.Newsletters = createEntityProxy(['NewsletterService', 'Newsletter'], { target: { is_singular: false }})
// NewsletterSubscription
module.exports.NewsletterSubscription = createEntityProxy(['NewsletterService', 'NewsletterSubscription'], { target: { is_singular: true } })
module.exports.NewsletterSubscriptions = createEntityProxy(['NewsletterService', 'NewsletterSubscription'], { target: { is_singular: false }})
// Newsletter.texts
module.exports.Newsletter.text = createEntityProxy(['NewsletterService', 'Newsletter.texts'], { target: { is_singular: true } })
module.exports.Newsletter.texts = createEntityProxy(['NewsletterService', 'Newsletter.texts'], { target: { is_singular: false }})
// events
// actions
// enums
