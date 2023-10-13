const { Schema, Types, model } = require('mongoose')

const Chat = new Schema({
    content: String,
    sender: {
        type: Types.ObjectId,
        ref: 'User'
    },
    receiver: {
        type: Types.ObjectId,
        ref: 'User'
    },
    read: {
        type: Number,
        default: 0
    },
    type: {
        type: Number,
        default: 0
    },
    mode: {
        type: Number,
        default: 0
    }
})

module.exports = model('Chat', Chat);