const cron = require('node-cron');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require("mongoose");
const Leet = require('./leetCodeModule');
const User = require('./userModule');
const Mail = require('./mailModule');

const daySchema = new mongoose.Schema({
    day: { type: String, required: true },
});

const weekdays = [Leet.Sunday, Leet.Monday, Leet.Tuesday, Leet.Wednesday, Leet.Thursday, Leet.Friday, Leet.Saturday];

async function runCron() {
    cron.schedule('0 6 * * *', async () => {
        await Leet.update();

        const today = new Date(); 
        const dayOfWeek = today.getDay(); 
        const currentDayOfWeek = weekdays[dayOfWeek]; 

        const ids = await currentDayOfWeek.find({}); 

        ids.forEach(async (id) => {
            const user = await User.findById(id); 
            // Send a random question to that user 

            const question = await Leet.getRandomProblemFromUser(user);
            await Mail.mailLeetCodeQuestion(user, question);

        });
    });
}

module.exports = runCron; 
