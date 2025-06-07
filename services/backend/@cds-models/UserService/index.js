// This is an automatically generated file. Please do not change its contents manually!
const { createEntityProxy } = require('./../_')
// service
const UserService = { name: 'UserService' }
module.exports = UserService
module.exports.UserService = UserService
// User
module.exports.User = createEntityProxy(['UserService', 'User'], { target: { is_singular: true } })
module.exports.User_ = createEntityProxy(['UserService', 'User'], { target: { is_singular: false }})
// events
// actions
// enums
