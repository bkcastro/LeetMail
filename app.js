const express = require("express"); 
const bodyParser = require("body-parser"); 
const cron =  require("node-cron");
const LeetCode = require("leetcode-query");
const bcrypt = require('bcrypt');

const User = require("./myModules/userModule");
const Mail = require("./myModules/mailModule");
const Leet = require("./myModules/leetCodeModule");

// set the timezone to Pacific Daylight Time
process.env.TZ = 'America/Los_Angeles';

const mongoose = require("mongoose");
var url = process.env.DB_URL;

const app = express(); 

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/main", function(req, res) {
    res.render("main", {userEmail: "test", errorMessage: "", currentStatus: "Active", userName: "test username", schedule: [false, false, false, false, false, false, false] , diffs: [false, false, false] } );
});

app.get("/", function(req, res) {
    res.render("login", {errorMessage:""});
});

app.get("/register", function(req, res) {
    res.render("register", {errorMessage: ""});
});

app.get("/forgotpassword", function(req, res) {
    res.render("forgotpassword"); 
})
  
app.post("/login", async (req, res) => { 
    // Check if username exist else print error 
    try {
        const user = await User.findOne({email: req.body.email});

        if (user == null) {
            res.render("login", {errorMessage: "Email not registered with an acount."});
        } else 
        {
            bcrypt.compare(req.body.password, user.password, function(err,  result){
                if (err){
                    res.render("login", {errorMessage: "Error occurred try again later."});
                }  else if (result) {
                
                    res.render("main", {userEmail: user.email, errorMessage: "", currentStatus: user.status, userName: user.username, schedule: user.schedule, diffs:  user.diffs });
                }  else 
                {
                    res.render("login", {errorMessage: "Email or password do not match."});
                }
            });
        }
    } catch {
        res.redirect('/');
    }

});

app.post("/register", async (req, res) => {
    // check if user is already created: check email. 
    // create new user 
   
    try {
        // Check if email is in the database if so then email cannot greate new user
        const user = await User.findOne({email: req.body.email});  
    
        if (user == null)
        {
            const hashedPassword = await bcrypt.hash(req.body.password, 10); 

             // Create user. 
            const newUser = new User({
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword,
                status: "Not Active",
                schedule: [false, false, false, false, false, false, false], 
                diffs: [false, false, false],
                tags: [],
                time: "10 am", // Default it 10 am 
            }); 

            await newUser.save();

            Mail.newUser(req.body.email, req.body.username);
        
            res.redirect('/');
        } else 
        {
            res.render('register', {errorMessage: "Email already has an account."});
        }

    } catch {
        res.redirect('/');
    } 
});

app.post("/update", async( req, res) => {

    try {

        let booleanDays = [false, false, false, false, false, false, false]; 

        for (let i = 0; i < req.body.days.length; i++)
        {
            booleanDays[parseInt(req.body.days[i])] = true; 
        }

        let booleanDiffs = [false, false, false]; 

        if (req.body.hasOwnProperty('diffs')) {
            for  (let i = 0; i < req.body.diffs.length; i++)
            {
                booleanDiffs[parseInt(req.body.diffs[i])] = true; 
            }
        }
        
        var userStatus = "Active"; 

        if (booleanDays == [false, false, false, false, false, false, false]) {
            userStatus = "Not Active";
        }

        if (booleanDiffs[0] == false && booleanDiffs[1] == false && booleanDiffs[2] == false) {
            res.render("main", {userEmail: req.body.userEmail, errorMessage: "Please pick a difficulty", currentStatus: userStatus, userName: req.body.userName, schedule: booleanDays , diffs: booleanDiffs } );
        } else {
            const user = await User.findOneAndUpdate({email: req.body.userEmail}, { status: userStatus, schedule: booleanDays, diffs: booleanDiffs } ); 

            res.render("main", {userEmail: user.email, errorMessage: "", currentStatus: userStatus, userName: user.username, schedule: booleanDays , diffs: booleanDiffs } );
        }


        
    } catch(error) {
        console.log(error);
        res.redirect('/');
    }
});

app.post("/SignOut", async(req, res)  => {
    res.redirect('/');
});

const start = async() => {
    try {

        // 2. set up cron schedule 
        // 3. set up server 

        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: "CodeMail",
        });
        
        //setCron(); 

        app.listen(3000, function() {
            console.log("Server running on port 3000");
        });
    }
    catch(e) {
        console.log(e.message);
    }
};

start(); 