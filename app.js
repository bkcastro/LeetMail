const express = require("express"); 
const path = require("path");
const bodyParser = require("body-parser"); 
const LeetCode = require("leetcode-query");
const bcrypt = require('bcrypt');
var passport = require('passport'); 
var session = require('express-session'); 
var flash = require('connect-flash');

const User = require("./myModules/userModule");
const Mail = require("./myModules/mailModule");
const Leet = require("./myModules/leetCodeModule");
const cronJob = require('./myModules/cronModule');

var indexRouter  = require('./routes/index');
var authRouter = require('./routes/auth');

// set the timezone to Pacific Daylight Time
process.env.TZ = 'America/Los_Angeles';

const mongoose = require("mongoose");
const url = process.env.DB_URL;

const app = express(); 

const PORT = process.env.PORT || 3030;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(flash()); 
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
    secret: 'mechanical keyboard cat',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

// Set routes 
app.use('/', indexRouter);
app.use('/', authRouter); 

const start = async() => {
    try {

        // 2. set up cron schedule 
        // 3. set up server 

        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: "CodeMail",
        });

        cronJob();

        app.listen(PORT, function() {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch(e) {
        console.log(e.message);
    }
};

start(); 