const express = require("express"); 
const bodyParser = require("body-parser"); 
const cron =  require("node-cron");
const LeetCode = require("leetcode-query");
const bcrypt = require('bcrypt');

const User = require("./myModules/userModule");
const Mail = require("./myModules/mailModule");

let leet = new LeetCode.LeetCode(); 

let easyQuestions = []; 
let mediumQuestions = []; 
let hardQuestions = [];

// set the timezone to Pacific Daylight Time
process.env.TZ = 'America/Los_Angeles';

const mongoose = require("mongoose");

var url = 'mongodb+srv://c1brandon626:test123@cluster0.zi9jqhj.mongodb.net/codeMail';

const problemSchema = new mongoose.Schema({
    difficulty: { type: String,  required: true },
    list: { type: Array, default: [] }
});


const Problem = mongoose.model("problem", problemSchema);

async function addUser(data) {
    const user = await User.findOne({email: data.email});  

    let temp = [false, false, false, false, false, false, false]; 

    data.days.forEach(function(day){
        temp[day] = true;
    });

    if (user == null)
    {
        const easy = await Problem.findOne({ difficulty: "easy" });
        const medium = await Problem.findOne({ difficulty: "medium" });
        const hard = await Problem.findOne({ difficulty: "hard" }); 

        // Create user. 
        const newUser = new User({
            username: data.username,
            email: data.email,
            status: true,
            schedule: temp, 
            diffs: data.diffs
        }); 

        await newUser.save();

        sendMail(data.email, data.fName);

        console.log("User Created");

    } else 
    {
        if (user.email != temp)
        {
            const a = await User.updateOne({ email: data.email }, { schedule: temp });
        } 

        if (user.diffs != data.diffs) 
        {
            const b = await User.updateOne({ email: data.email }, { diffs: data.diffs }); 
        }

        console.log("User Updated");
    }  
}

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

        if (user ==  null) {
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

        // 1. connect to the database and set up questions for fast acces
        // 2. set up cron schedule 
        // 3. set up server 

        await mongoose.connect(url);
        
        // easy = await Problem.findOne({difficulty: "easy"}).exec();
        // medium = await Problem.findOne({difficulty: "medium"}).exec();
        // hard = await Problem.findOne({difficulty: "hard"}).exec();

        // easyQuestions = easy.list; 
        // mediumQuestions = medium.list; 
        // hardQuestions = hard.list; 

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