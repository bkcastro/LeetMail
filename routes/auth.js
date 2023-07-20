var express = require('express'); 
var passport = require('passport');
const bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local');

const crypto = require('crypto');
  
const User = require('../myModules/userModule');
const Token = require('../myModules/tokeModule');
const Mail = require('../myModules/mailModule');

var router = express.Router(); 

const maxUsers = process.env.MAXUSERS;

passport.use(new LocalStrategy(async function verify(username, password, cb) {
    try {
        const user = await User.findOne({username: username}); 
        if (user == null) { return cb(null, false, { message: "Incorrect username or password."}); }

        if (user.status == 'false') { return cb(null, false, { message: "User needs to activate account."})}
        bcrypt.compare(password, user.password, function(err,  result) {
            if (err){
                return cb(err);  
            }  else if (result) {
                return cb(null, user); 
            }  else {
                return cb(null, false, { message: "Incorrect username or password."});
            }
        });

    } catch(err) {
        return cb(err);
    }
}));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user._id, username: user.username, status: user.status, schedule: user.schedule, diffs: user.diffs, tags: user.tags });
    });
});
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

router.get('/login', function(req, res, next) {

    var errors = req.flash('error'); 
    if (errors.length > 0) {
        console.log('hi');
        return res.render('login', {errorMessage: errors[0]});
    }

    res.render('login', {errorMessage: ""}); 
}); 

router.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

router.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});

router.get('/login/email/verify', async function(req, res, next) {

    try {
        // Check if token exisits 
        const token = await Token.findOne({ token: req.query.token });
        
        if (token) {
            // Up data user status to true 
            const userPromise = await User.findByIdAndUpdate(token.userId, { status: true });
            // Next we are going to delete the token from the database 
            const tokenPromise = await Token.findByIdAndDelete(token._id); 

            // Now just redirect user to login page
            return res.redirect('/login');
        } else {
            res.render('error'); 
        }

    } catch(err) {
        res.render('error');
    }
});

router.get('/signup',function(req, res, next) {
    res.render('signup', {errorMessage: ""});
});

router.post('/signup', async function(req, res, next) {

    try {

        // Check if max user have been reached which is 100 by default 
        const userCount = await User.estimatedDocumentCount(); 
        if (userCount > maxUsers) {
            return res.render('maxUsers');
        }
        
        // Check if username doesn't exists
        const userOne = await User.findOne({ username: req.body.username }); 
        if (userOne != null) { return res.render('signup', {errorMessage: "Username already taken." }); }
        // Check if email doesn't exist
        const userTwo = await User.findOne({ email: req.body.email }); 
        if (userTwo != null) { return res.render('signup', {errorMessage: "Email already taken."}); }

        // Create user and token, then send email 
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username, 
            email: req.body.email, 
            password: hashedPassword, 
            status: false, 
            schedule: [],
            diffs: [], 
            tags: [],
        }); 

        await newUser.save(); 

        crypto.randomBytes(28, async function(err, buffer) {
            var token = buffer.toString('hex');
            // Add the token to the database 
            var newToken = new Token({
                token: token, 
                userId: newUser._id
            });
            
            const tokenPromise = await newToken.save(); 
            console.log(tokenPromise);

            Mail.newUser(req.body.email, req.body.username, token);
        }); 

        res.render('validate', {username: req.body.username, email: req.body.email});
    } catch(err) {
        console.log(err);
    }

});


module.exports = router; 
