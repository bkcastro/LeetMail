const nodemailer = require("nodemailer");

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, 
        pass: process.env.PASSWORD
    } 
});

async function newUser(email, username, token) {

    var link = 'http://localhost:3000/login/email/verify?token=' + token;
     
    const mailDetails = {
        from: 'LeetMail dave@leetmail.com',
        to: email,
        subject: 'LeetMail: Confirm your sign up!',
        text: "",
        html: '<h1>Welcome to LeetMail, '+username+'!</h1><h3>To complete your signup:</h3><p>Click this link to comfirm your email <a href="'+link+'">'+link+'</a></p>',
    };
     
    transporter.sendMail(mailDetails, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            console.log('Email sent: '+data.response);
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

//newUser('c1brandon626@gmail.com', 'liljgremlin', '1029dkhcasdfadskljttj3i0dc89d0');

module.exports = {
    newUser
}
