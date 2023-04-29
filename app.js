const express = require("express"); 
const bodyParser = require("body-parser"); 
const nodemailer = require("nodemailer");
const cron =  require("node-cron");
const LeetCode = require("leetcode-query");

let leet = new LeetCode.LeetCode(); 

let easyQuestions = []; 
let mediumQuestions = []; 
let hardQuestions = [];

// set the timezone to Pacific Daylight Time
process.env.TZ = 'America/Los_Angeles';

const mongoose = require("mongoose");
var url = 'mongodb+srv://c1brandon626:test123@cluster0.zi9jqhj.mongodb.net/codeMail';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, 
    subs: {type: Boolean, required: true },
    schedule: { type: [Boolean], required: true },
    diffs: { type: Array, required: true },
    easy: { type: Array, required: true },
    medium: { type: Array, required: true },
    hard: { type: Array, required: true }
});

const problemSchema = new mongoose.Schema({
    difficulty: { type: String,  required: true },
    list: { type: Array, default: [] }
})

const User = mongoose.model("User", userSchema)
const Problem = mongoose.model("problem", problemSchema);

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
            name: data.fName,
            email: data.email,
            subs: true,
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
    res.render("signup", {errorMessage: ""});
});

app.get("/deleteAccount", function(req, res){
    res.render("deleteAccount");
})

app.get("/deleteSuccess", function(req, res){
    res.render("deleteSuccess");
})

app.post("/", function(req, res) {

    if (req.body.days == undefined || req.body.diffs == undefined)
    {
       res.render("signup", {errorMessage: "Please pick at least one from each section"});
    } else 
    {
        // add the new user or update his schedule. 
        addUser(req.body);
    }

    res.render("success", {message: "Success!"}); 
});

app.post("/failure", function(req, res){
    res.redirect("/");
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

}


function getRandomQuestions(user, diff) {

    switch(diff)
    {
        case "easy": return Math.floor(Math.random()*user.easy.length); 
        break; 
        case "medium": return Math.floor(Math.random()*user.medium.length);
        break;
        default: return Math.floor(Math.random()*user.hard.length); 
    }
}

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
}


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
}

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
        
        easy = await Problem.findOne({difficulty: "easy"}).exec();
        medium = await Problem.findOne({difficulty: "medium"}).exec();
        hard = await Problem.findOne({difficulty: "hard"}).exec();

        easyQuestions = easy.list; 
        mediumQuestions = medium.list; 
        hardQuestions = hard.list; 

        setCron(); 


        app.listen(3000, function() {
            console.log("Server running on port 3000");
        });
    }
    catch(e) {
        console.log(e.message);
    }
};

start(); 