// This file will get all of the free leetcode questions and put them into my database. 
const mongoose = require("mongoose");
var url = 'mongodb+srv://c1brandon626:test123@cluster0.zi9jqhj.mongodb.net/codeMail';
const LeetCode = require("leetcode-query");
let leet = new LeetCode.LeetCode();  

const problemSchema = new mongoose.Schema({
    difficulty: { type: String,  required: true },
    list: { type: Array, default: [] }
});

async function update() {

    try 
    {
        await mongoose.connect(url);

        const Problem = await mongoose.model("problem", problemSchema);

        //2617

        let easy = await Problem.findOne({difficulty: "easy"}).exec();
        let medium = await Problem.findOne({difficulty: "medium"}).exec(); 
        let hard = await Problem.findOne({difficulty: "hard"}).exec();

        for (let i = 0; i < 2638; i += 25)
        {
            let query = await leet.problems({ offset: i, limit: 25 });

            query.questions.forEach(function(q) {
                if (!q.isPaidOnly) {
                    console.log(q.title); 
                    switch(q.difficulty)
                    {
                        case "Easy": easy.list.push(q.titleSlug);
                        break;
                        case "Medium": medium.list.push(q.titleSlug); 
                        break;
                        case "Hard": hard.list.push(q.titleSlug);      
                    }
                }
            });

        }

        const updateEasy = await Problem.findOneAndUpdate( { difficulty:  'easy' }, { list:  easy.list } );
        const updateMedium = await Problem.updateOne( { difficulty: 'medium' }, { list:  medium.list });
        const updateHard =  await Problem.updateOne( { difficulty: 'hard' }, { list:  hard.list });

        console.log("Done");
    }
    catch(e) {
        console.log(e.message);
    }
};