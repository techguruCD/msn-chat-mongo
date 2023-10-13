const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const passport = require('passport')
const path = require('path')
const fs = require('fs')

const ioHandler = require('../ioHandler')
const User = require('../schema/User')
const validateRegisterInput = require('../validation/register')
const validateLoginInput = require('../validation/login')

exports.register = (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body)
    const { name, password } = req.body

    if (!isValid)
        return res.json({
            status: 1,
            errors
        })

    User.findOne({ name })
        .then(user => {
            if (user)
                return res.json({
                    status: 1,
                    errors: { name: "Name is already in use" }
                })
            new User({ name, password }).save()
                .then(user => {
                    return res.json({
                        status: 0,
                        user
                    })
                }).catch(err => {
                    console.log(err)
                    return res.json({
                        status: 1,
                        errors: { name: "Please try again later" },
                        message: {
                            warning: "Please try again later"
                        }
                    })
                })
        }).catch(err => {
            console.log(err)
            return res.json({
                status: 1,
                errors: { name: "Please try again later" },
                message: {
                    warning: "Please try again later"
                }
            })
        })
}

exports.login = (req, res) => {
    const { errors, isValid } = validateLoginInput(req.body)
    const { name, password } = req.body

    if (!isValid)
        return res.json({
            status: 1,
            errors
        })
    User.findOne({ name, password })
        .then(user => {
            if (!user)
                return res.json({
                    status: 1,
                    errors: { name: "Invalid User Info" },
                    message: {
                        warning: "Invalid User Info"
                    }
                })

            const payLoad = { _id: user._id, name: user.name, avatar: user.avatar }
            jwt.sign(
                payLoad,
                process.env.SECRET_OR_KEY,
                { expiresIn: 360000 },
                (err, token) => {
                    return res.json({
                        status: 0,
                        user,
                        token: 'Bearer ' + token
                    })
                })
        }).catch(err => {
            console.log(err)
            return res.json({
                status: 1,
                errors: { name: "Please try again later" },
                message: {
                    warning: "Please try again later"
                }
            })
        })
}

exports.updateAvatar = (req, res) => {
    User.findOne({ _id: req.user._id })
        .then(user => {
            if (!user)
                return res.json({
                    status: 1,
                    errors: { name: 'Invalid user' },
                    message: { warning: 'Invalid user' }
                })
            let filePath = null;
            let uploadPath = null;
            const saveUser = () => {
                user.avatar = filePath
                user.save().then(user => {
                    user = JSON.parse(JSON.stringify(user))
                    ioHandler.sendUserStatus({ ...user, online: true })
                    return res.json({
                        status: 0,
                        user: user
                    })
                }).catch(err => {
                    return res.json({
                        status: 1,
                        errors: { name: 'Please try again later' },
                        message: { warning: 'Please try again later' }
                    })
                })
            }

            if (req.files && req.files && req.files.avatar) {
                const file = req.files.avatar;

                let timestamp = new Date().getTime()
                fileName = file.name;
                uploadPath = path.join(__dirname, `..\\upload\\avatar\\${timestamp}`)
                if (!fs.existsSync(uploadPath))
                    fs.mkdirSync(uploadPath)
                uploadPath += `\\${file.name}`
                filePath = `/upload/avatar/${timestamp}/${file.name}`
                file.mv(uploadPath, function (err) {
                    if (err) {
                        return res.json({
                            status: 1,
                            errors: { name: 'Please try again later' },
                            message: { warning: 'Please try again later' }
                        })
                    }
                    saveUser()
                })
            } else {
                saveUser()
            }
        }).catch(err => {
            console.log(err)
            return res.json({
                status: 1,
                errors: { name: 'Please try again later' },
                message: { warning: 'Please try again later' }
            })
        })
}