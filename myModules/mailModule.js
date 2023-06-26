const nodemailer = require("nodemailer");

const { errorMonitor } = require("nodemailer/lib/xoauth2");

let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

async function newUser(userEmail, userfName) {
     
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
            //console.log('Email sent successfully');
        }
    });
};

async function sendLeetCodeQuestion(email, question) {

    const questionURL = question; 

    let mailDetails = {
        from: mailTransporter.user,
        to: userEmail,
        subject: 'CodeMail: Time for you LeetCode '+userfName+'!',
        text: "",
        html: '<a href="'+questionURL+'"><h1>'+question+'</h1></a>',
    };
     
    mailTransporter.sendMail(mailDetails, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            //console.log('Email sent successfully');
        }
    });
};

module.exports = {
    newUser
}
