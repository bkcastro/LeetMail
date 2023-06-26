// This file will get all of the free leetcode questions and put them into my database. 
const mongoose = require("mongoose");
var url = 'mongodb+srv://c1brandon626:test123@cluster0.zi9jqhj.mongodb.net/codeMail';
const LeetCode = require("leetcode-query");
let leet = new LeetCode.LeetCode();  

async function setTags() {
    await mongoose.connect(url);

    const tagNames = [ 'Array', 'StringHash', 'Table', 'Dynamic', 'Programming', 'Math', 'Sorting', 'Greedy', 'Depth-First', 'Search', 'Database', 'Binary Search', 'Breadth-First Search', 'Tree', 'Matrix'];

    for (let i = 0; i < tagNames.length; i++) { 

    }
}

async function update() {

    try 
    {
        await mongoose.connect(url);

        const Problem = await mongoose.model("problem", problemSchema);

        //2617

        let easy = await Problem.findOne({difficulty: "easy"}).exec();
        let medium = await Problem.findOne({difficulty: "medium"}).exec(); 
        let hard = await Problem.findOne({difficulty: "hard"}).exec();

        // The only way I know how to get the total number of questons. 
        let dummy = await leet.problems({ limit: 1}); 
        var size = dummy.total;

        for (let i = 0; i < size; i += 25)
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
        console.log("Done");
    }
    catch(e) {
        console.log(e.message);
    }
};

async function test() {

    for (let i = 0; i < 100; i += 25) {
        let query = await leet.problems({ offset: i, limit: 25 });
        console.log(query); 
    }
      
}

test(); 