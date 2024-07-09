var express = require('express')
var crypto = require('crypto')
var User = require('../models/User')
var passport = require('passport')
var LocalStrategy = require('passport-local')

var router = express.Router();

passport.use(new LocalStrategy(async function verify(username, password, done) {
    try {
        const user = await User.findOne({where: {username: username}})
        if (!user) {
            return done(null, false, { message: 'Неправильный логин или пароль'})
        }

        crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', async function(err,hashedPassword){
            if (err) {return done(err)}

            if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
                return done(null, false, {message: 'Неправильный логин или пароль'})
            }

            return done(null, user)
        })

    } catch (e) {
        return done(e)
    }
}))

passport.serializeUser(function(user, done) {
    done(null, user.id)
})

passport.deserializeUser(function(id, done) {
    User.findByPk(id).then(function(user) { done(null, user)})
})

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login?failed=1'
}))

router.get('/login', (req, res, next) => {
    const failed = req.query.failed
    res.render('login', {failed:failed})
})

router.post('/signup', (req, res, next) => {
    let salt = crypto.randomBytes(16);
    crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', async function(err, hashedPassword) {
        if (err) {res.redirect('/auth/signup?failed=1')}

        try {
            const user = await User.create({username: req.body.username, password: hashedPassword, salt: salt})

            req.login(user, function(err) {
                if (err) {res.redirect('/auth/signup?failed=3')}
                res.redirect('/')
            })
        } catch (e) {
            res.redirect('/auth/signup?failed=2')
        }
    })
})

router.get('/signup', (req, res, next) => {
    const failed = req.query.failed

    let msg = ''
    switch (failed) {
        case '1':
            msg = 'Что-то пошло не так...'
            break;
        case '2':
            msg = 'Имя пользователя занято.'
            break;
        case '3':
            msg = 'Не получилось зайти...'
            break;
    }
    res.render('signup', {failed:failed, msg:msg})
})

router.post('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) {return next(err)}
        res.redirect('/')
    })
})


module.exports = router;