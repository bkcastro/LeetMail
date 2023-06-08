const express = require("express"); 
const bodyParser = require("body-parser"); 
const nodemailer = require("nodemailer");
const cron =  require("node-cron");
const LeetCode = require("leetcode-query");
const bcrypt = require('bcrypt');

let leet = new LeetCode.LeetCode(); 

let easyQuestions = []; 
let mediumQuestions = []; 
let hardQuestions = [];

// set the timezone to Pacific Daylight Time
process.env.TZ = 'America/Los_Angeles';

const mongoose = require("mongoose");
const { errorMonitor } = require("nodemailer/lib/xoauth2");
var url = 'mongodb+srv://c1brandon626:test123@cluster0.zi9jqhj.mongodb.net/codeMail';

const userProblemSchema = new mongoose.Schema({
    user: { type: String, required: true }, 
    easy: { type: Array, required: true },
    medium: { type: Array, required: true },
    hard: { type: Array, required: true }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true }, 
    password: { type: String, required: true },
    status: {type: String, required: true },
    schedule: { type: Array },
    diffs: { type: Array }
});

const problemSchema = new mongoose.Schema({
    difficulty: { type: String,  required: true },
    list: { type: Array, default: [] }
});

const User = mongoose.model("User", userSchema)
const Problem = mongoose.model("problem", problemSchema);
const UserProblems = mongoose.model("userproblems", userProblemSchema);

let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: 'liljgremlin@gmail.com',
        pass: 'rnnfitdnzvsrputd'
    }
});

async function sendMail(userEmail, userfName) {
     
    let mailDetails = {
        from: mailTransporter.user,
        to: userEmail,
        subject: 'CodeMail: Thank Your for Signing Up '+userfName+'!',
        text: "",
        html: "<h1>Thank you for singing up!</h1><p>You will receive random leetcode question on the days you requested. </p><p>Enjoy the grid!</p>",
    };
     
    mailTransporter.sendMail(mailDetails, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            console.log('Email sent successfully');
        }
    });
};

async function mailRestart(user) {

    let mailDetails = {
        from: mailTransporter.user,
        to: user.Email,
        subject: 'codeMail: The questions have run out!'+user.fName+'!',
        text: "",
        html: "<h1>The questions you requested have run out!</h1><p><br>Dulplicate questions will start to appear. If you wish to stop please unsubscribe or change your frequency of questions to something new.</p><p><br>Thank you for using codeMail</p>",
    };
     
    mailTransporter.sendMail(mailDetails, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            console.log('Email sent successfully');
        }
    });
}

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
            diffs: data.diffs, 
            easy: Array.from(Array(easyQuestions.length).keys()).map(x => x), 
            medium: Array.from(Array(mediumQuestions.length).keys()).map(x => x), 
            hard: Array.from(Array(hardQuestions.length).keys()).map(x => x)
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
                diffs: [false, false, false]
            }); 

            const userProbs = new UserProblems({
                user: newUser.id,
                easy: easyQuestions,
                medium: mediumQuestions, 
                hard: hardQuestions
            });

            await newUser.save();
            await userProbs.save();

            sendMail(req.body.email, req.body.username);

            console.log("User Created");
        
            res.redirect('/');
        } else 
        {
            console.log("user already exists");
            res.render('register', {errorMessage: "That email already has an account"});
        }

    } catch {
        res.redirect('/');
    } 
});

app.post("/update", async( req, res) => {

    try {

        console.log("1");
        console.log(req.body);

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

        console.log(booleanDays);
        console.log(booleanDiffs);

        console.log("2");
        if (booleanDiffs == [false, false, false]) {
            console.log("3");
            res.render("main", {userEmail: req.body.userEmail, errorMessage: "Please pick a difficulty", currentStatus: userStatus, userName: req.body.userName, schedule: booleanDays , diffs: booleanDiffs } );
        } else {
            console.log("4");
            const user = await User.findOneAndUpdate({email: req.body.userEmail}, { status: userStatus, schedule: booleanDays, diffs: booleanDiffs}); 

            console.log(user); 

            res.render("main", {userEmail: req.body.userEmail, errorMessage: "", currentStatus: userStatus, userName: req.body.userName, schedule: booleanDays , diffs: booleanDiffs } );
        }
        
    } catch(error) {
        console.log(error);
        res.redirect('/');
    }
});

app.post("/SignOut", async(req, res)  => {
    res.redirect('/');
});

const temp = async() => {
    const easy = await Problem.findOne({ difficulty: "easy" });
        const medium = await Problem.findOne({ difficulty: "medium" });
        const hard = await Problem.findOne({ difficulty: "hard" }); 

        const userOne = new User({
            name: "liljGremlin", 
            email: "c1brandon626@gmail.com",
            schedule: [ true, true, true, true, true, true, true ], 
            diffs: [ "easy", "medium" ],
            easy: easy, 
            medium: medium, 
            hard: hard
        }); 

        const userTwo = new User({
            name: "bcastro9", 
            email: "bcastro9@ucsc.edu",
            schedule: [ true, true, true, true, true, false, false ],
            diffs: [ "medium", "hard" ], 
            easy: easy, 
            medium: medium, 
            hard: hard
        }); 


        userOne.save(); 
        userTwo.save();

};


function getRandomQuestions(user, diff) {

    switch(diff)
    {
        case "easy": return Math.floor(Math.random()*user.easy.length); 
        break; 
        case "medium": return Math.floor(Math.random()*user.medium.length);
        break;
        default: return Math.floor(Math.random()*user.hard.length); 
    }
};

async function updateUserQuestions(u, index, diffsIndex) {

    switch(u.diffs[diffsIndex]) {
        case "easy": 
            u.easy.splice(index, 1); 
            const a = await User.updateOne({ email: u.email }, { easy: u.easy });
            break;
        case "medium": 
            u.medium.splice(index, 1);
            const b = await User.updateOne({ email: u.email }, { medium: u.medium });
            break;
        default: 
            u.hard.splice(index, 1);
            const c = await User.updateOne({ email: u.email }, { hard: u.hard });
    }

    console.log("User with email: "+u.email+" db was updated.");
};

const sendQuestionsToUsers = async() => {
    const users = await User.find().exec();
    
    users.forEach(function(u) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const date = new Date();
        if (u.subs && u.schedule[date.getDay()]) {
            
            // Generate the questions for the user 

            // ["easy"]
            // ["medium", "hard"]
            // ["easy", "medium", "hard"]

            let question = "";
            let diffsIndex = 0; 
            let index = -1;

            if (u.diffs.length == 2)
            {
                diffsIndex = Math.floor(Math.random()*2);

            } else if (u.diffs.length == 3)
            {
                diffsIndex = Math.floor(Math.random()*3);
            }

            index = getRandomQuestions(u, u.diffs[diffsIndex]);

            // Delete random question from the array and update the db 

            switch(u.diffs[diffsIndex]) {
                case "easy": 
                    question = easyQuestions[u.easy[index]];
                    break;
                case "medium": 
                    question = mediumQuestions[u.medium[index]];
                    break;
                default: 
                    question = hardQuestions[u.hard[index]];
            }

            updateUserQuestions(u, index, diffsIndex);

            let message = "<h2>Question of the  day is: <a href='https://leetcode.com/problems/"+question+"/'>"+question+"</a></h2>";

            let mailDetails = {
                from: mailTransporter.user,
                to:u.email,
                subject: 'LeetCode Question!',
                text: "Stay on the Grid.",
                html: message,
            };

            mailTransporter.sendMail(mailDetails, function(err, data) {
                if(err) {
                    console.log(err);
                } else {
                    console.log('Email sent successfully');
                }
            });
        }
    })
};

const setCron = async() => {
    cron.schedule('* * * * * ', () => {
        sendQuestionsToUsers();
    });
};

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