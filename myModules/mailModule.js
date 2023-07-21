const nodemailer = require("nodemailer");

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const rootURL = process.rootURL

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, 
        pass: process.env.PASSWORD
    } 
});

async function newUser(email, username, token) {

    var link = rootURL+'login/email/verify?token=' + token;
     
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

async function mailLeetCodeQuestion(user, question) {

    let mailDetails = {
        from: 'LeetMail dave@leetmail.com',
        to: user.email,
        subject: 'LeetMail: '+question.title+'.',
        text: "",
        html: '<a href='+rootURL+'problems/'+question.titleSlug+'/"><h1>'+question.title+'</h1></a><p>Click on the question above to be re-direct to the leetcode problem. </p><p>Good luck '+user.username+'!</p>',
    };
     
    transporter.sendMail(mailDetails, function(err, data) {
        if(err) {
            console.log(err);
        }
    });
};

module.exports = {
    newUser,
    mailLeetCodeQuestion,
}
