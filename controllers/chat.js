const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const passport = require('passport')

const validateChatInput = require('../validation/chat')
const ioHandler = require('../ioHandler')

const User = require('../schema/User')
const Chat = require('../schema/Chat')

exports.new = (req, res) => {
    const { errors, isValid } = validateChatInput(req.body)
    let { receiver, content, type, mode } = req.body;
    console.log(req.body)
    const sender = req.user._id;
    if (!isValid)
        return res.json({
            status: 1,
            errors
        })
    if ((sender == receiver && mode == 1) || (!receiver && mode == 1))
        return res.json({
            status: 1,
            errors: { content: "Please select receiver" }
        })

    const newChat = () => {
        if (receiver == -1) receiver = undefined;
        new Chat({
            content, receiver, sender, type, mode
        }).save()
            .then(message => {
                Chat.findById(message._id).populate('sender')
                    .then(message => {
                        ioHandler.newMessage(message)
                        return res.json({
                            status: 0
                        })
                    }).catch(err => {
                        console.log(err)
                        return res.json({
                            status: 1,
                            message: { warning: 'Please try again later' }
                        })
                    })
            }).catch(err => {
                console.log(err)
                return res.json({
                    status: 1,
                    message: { warning: 'Please try again later' }
                })
            })
    }
    if (mode == 0) {
        User.findById(receiver)
            .then(user => {
                if (!user)
                    return res.json({
                        status: 1,
                        message: { warning: 'Invalid receiver' }
                    })
                newChat()
            }).catch(err => {
                return res.json({
                    status: 1,
                    message: { warning: 'Please try again later' }
                })
            })
    } else {
        newChat();
    }
}

exports.messageList = (req, res) => {
    console.log(req.query)
    const { _id, mode = 0 } = req.query;
    if (!_id)
        return res.json({
            status: 1,
            message: { warning: 'Please select contact' }
        });
    (mode == 0 ?
        Chat.find({ $or: [{ sender: req.user._id, receiver: _id }, { sender: _id, receiver: req.user._id }] }).populate('sender')
        : Chat.find({
            mode
        }).populate('sender')).then(messages => {
            return res.json({
                status: 0,
                messages
            })
        }).catch(err => {
            console.log(err)
            return res.json({
                status: 1,
                message: { warning: 'Please try again later' }
            })
        })
}

exports.contactList = (req, res) => {
    User.find({ _id: { $ne: req.user._id } })
        .then(users => {
            users = ioHandler.updateUsersWithConnectedState(users)
            return res.json({
                status: 0,
                users
            })
        }).catch(err => {
            console.log(err)
            return res.json({
                status: 1,
                message: { warning: 'Please try again later' }
            })
        })
}