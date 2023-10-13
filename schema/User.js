const { Schema, Types, model } = require('mongoose')

const User = new Schema({
    name: String,
    password: String,
    avatar: String
})

module.exports = model('User', User);