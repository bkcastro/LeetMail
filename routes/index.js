var express = require('express'); 
const User = require('../myModules/userModule');
const Leet = require('../myModules/leetCodeModule');
var router = express.Router(); 

async function setup() {
    for (let i = 6; i < 13; i++) {
        
    }
}

async function fetchUserData(req, res, next) {
    try {
        const user = await User.findById(req.user.id); 

        res.locals.time = user.time; 
        res.locals.scheduleSet = new Set(user.schedule);
        res.locals.difficultySet = new Set(user.diffs);   
        res.locals.tagSet = new Set(user.tags);

        next();
    } catch(err) {
        next(err); 
    }
};

router.get('/', function(req, res, next) {
    if (!req.user) { return res.render('home'); }
    next();
}, fetchUserData,  function(req, res, next) {
    console.log(res.locals);
    res.render('index', { user: req.user, errorMessage: "" });
});

async function updateUserData(req, res, next) {
    // This function updates the user data once to the data base and returns a render of index 
    
    
}

router.post('/update', function(req, res, next) {
    if (!req.user) { return res.render('home'); }
    next();
}, async function(req, res, next) {   
    console.log(req.body);
    res.render('index', { user: req.user, errorMessage: "" });
});

router.get('/test', async function(req, res, next) {
    

    res.render('validate', {username: "liljgremlin", email: "c1brandon626@gmail.com"})
});

module.exports = router; 
