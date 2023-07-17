const cron = require('node-cron');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require("mongoose");

const daySchema = new mongoose.Schema({
    day: { type: String, required: true },
});

function runCron() {
    cron.schedule('* * * * *', () => {
        console.log('This runs every minute');
    });
}

module.exports = runCron; 
