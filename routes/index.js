var express = require('express'); 
const User = require('../myModules/userModule');
const Leet = require('../myModules/leetCodeModule');
var router = express.Router(); 

async function fetchUserData(req, res, next) {

    res.locals.scheduleSet = new Set(req.user.schedule);
    res.locals.difficultySet = new Set(req.user.diffs);   
    res.locals.tagSet = new Set(req.user.tags);

    next();
};

router.get('/', function(req, res, next) {
    if (!req.user) { return res.render('home'); }
    next();
}, fetchUserData,  function(req, res, next) {
    res.render('index', { user: req.user, errorMessage: "" });
});

async function updateUserData(req, res, next) {
    try {
        // This function updates the user data once to the data base and returns a render of index 
        const user = await User.findById(req.user.id); 

        // If the user changes their schedule we have to update the user schedule and the corresponding userBank  

        if (!req.body.hasOwnProperty("days")) {
            console.log("Days is empty");
            req.body.days = [];
        }

        if (user.schedule.join(' ') != req.body.days.join(' ')) {
            var currentSchedule = new Set(user.schedule); 
            var newSchedule = new Set(req.body.days);
            var erase = [] 
            var add = []

            currentSchedule.forEach((value) => {
                if (!newSchedule.has(value)) {
                    erase.push(value);
                }
            });

            newSchedule.forEach((value) => {
                if (!currentSchedule.has(value)) {
                    add.push(value);
                }
            });
            
            erase.forEach(async (value) => {
                switch(value) {
                    case "Monday": 
                        await Leet.Monday.findByIdAndDelete(user.id);
                        break;
                    case "Tuesday":
                        await Leet.Tuesday.findByIdAndDelete(user.id);
                        break;
                    case "Wednesday":
                        await Leet.Wednesday.findByIdAndDelete(user.id);
                        break; 
                    case "Thursday": 
                        await Leet.Thursday.findByIdAndDelete(user.id);
                        break;
                    case "Friday": 
                        await Leet.Friday.findByIdAndDelete(user.id);
                        break; 
                    case "Saturday": 
                        await Leet.Saturday.findByIdAndDelete(user.id);
                        break;
                    case "Sunday":
                        await Leet.Sunday.findByIdAndDelete(user.id);
                }
            });

            add.forEach(async (value) => {
                switch(value) {
                    case "Monday": 
                        const m = new Leet.Monday({ _id: user.id });
                        await m.save();
                        break; 
                    case "Tuesday": 
                        const t = new Leet.Tuesday({ _id: user.id }); 
                        await t.save(); 
                        break; 
                    case "Wednesday": 
                        const w = new Leet.Wednesday({ _id:user.id });
                        await w.save(); 
                        break; 
                    case "Thursday": 
                        const th = new Leet.Thursday({ _id: user.id }); 
                        await th.save(); 
                        break; 
                    case "Friday": 
                        const f = new Leet.Friday({ _id: user.id }); 
                        await f.save(); 
                        break; 
                    case "Saturday": 
                        const s = new Leet.Saturday({ _id: user.id });
                        await s.save(); 
                        break; 
                    case "Sunday": 
                        const su = new Leet.Sunday({ _id: user.id });
                        await su.save(); 
                        break;
                } 
            });

            user.schedule = req.body.days;

        } 

        if (!req.body.hasOwnProperty("diffs")) {
            req.body.diffst = []
        }

        if (!req.body.hasOwnProperty("tags")) {
            req.body.tags = []
        }

        user.diffs = req.body.diffs; 
        user.tags = req.body.tags;

        res.locals.scheduleSet = new Set(user.schedule);
        res.locals.difficultySet = new Set(user.diffs);   
        res.locals.tagSet = new Set(user.tags);

        await user.save();
        next();
    } catch (err) {
        console.log(err);
        return res.render('home');
    } 
}

router.post('/update', function(req, res, next) {
    if (!req.user) { return res.render('home'); }
    next();
}, updateUserData, async function(req, res, next) {   
    res.render('index', { user: req.user, errorMessage: "" });
});

router.get('/test', async function(req, res, next) {

    res.render('validate', {username: "liljgremlin", email: "c1brandon626@gmail.com"})
});

module.exports = router; 
