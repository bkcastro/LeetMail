const nodemailer = require("nodemailer");

const { errorMonitor } = require("nodemailer/lib/xoauth2");

let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: 'liljgremlin@gmail.com',
        pass: 'rnnfitdnzvsrputd'
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
            console.log('Email sent successfully');
        }
    });
};

module.exports = {
    newUser
}
