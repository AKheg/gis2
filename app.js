var express = require('express');
var path = require('path');
var passport = require('passport')
var sequelize = require('./database')
var session = require('express-session')
const fs = require('fs')
require('dotenv').config()
const graves = process.env.DATA

sequelize.sync().then(() => console.log('db is ready'))

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var adminRouter = require('./routes/admin')

var app = express();

//app.use(express.json({limit: '50mb'}))
//app.use(express.urlencoded({limit: '50mb'}))
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Middleware function to fetch the JSON data
const fetchGravesData = (req, res, next) => {
    fs.readFile(graves, "utf8", (err, jsonData) => {
      if (err) {
        console.log("error at reading json file:", err)
      }
      req.gravesData = JSON.parse(jsonData)
      next();
    })
}
  
//Use middleware for all routes  
app.use(fetchGravesData);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'SECRETKEY', resave: true, saveUninitialized:true}))
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter)
app.use('/auth', authRouter)
app.use('/admin', adminRouter)
//app.use('/users', usersRouter);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
