// This file will get all of the free leetcode questions and put them into my database. 
const User = require("./userModule");

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require("mongoose");
const url = process.env.DB_URL;
const LeetCode = require("leetcode-query");
const { randomFill } = require("crypto");

let leet = new LeetCode.LeetCode();  
const tags = new Map([["Array", 0], ["Math", 1], ["Sorting", 2], ["Greedy", 3], ["Depth-First Search", 4], ["Database", 5], ["Binary Search", 6], ["Breadth-Frist Search", 7], ["Tree", 8], ["Matrix", 9]])
const problemSchema = new mongoose.Schema({
    questionFrontendId: { type: Number, required: true },
    acRate: { type: Number, required: true }, 
    difficulty: { type: String, required: true }, 
    title: { type: String, required: true }, 
    titleSlug: { type: String, required: true },
    tags: { type: Array, required: true },
    free: { type: Boolean, required: true },
});

const tagSchema = new mongoose.Schema({
    title: { type: String, required: true }, 
    list: { type: Array, required: true }
}); 

const difficultySchema = new mongoose.Schema({
    difficulty: { type: String, required: true }, // Easy || Medium || Hard
    list: { type: Array, required: true },
    tags: { type: [tagSchema] }
});

const userBankSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
});

const Problem = mongoose.model("Problem", problemSchema); 
const Tag = mongoose.model("Tag", tagSchema);
const Difficulty = mongoose.model("Difficulty", difficultySchema);

const Monday = mongoose.model("Monday", userBankSchema); 
const Tuesday = mongoose.model("Tuesday", userBankSchema); 
const Wednesday = mongoose.model("Wednesday", userBankSchema); 
const Thursday = mongoose.model("Thursday", userBankSchema); 
const Friday = mongoose.model("Friday", userBankSchema); 
const Saturday = mongoose.model("Saturday", userBankSchema); 
const Sunday = mongoose.model("Sunday", userBankSchema);

async function setUpTagMap(withData=true) {

    const Tag = await mongoose.model("Tag", tagSchema);

    let dataHolder = new Map(); 

    const documents = await Tag.find({});

    documents.forEach( (t) => {

        if (withData) {
            dataHolder.set(t.title, t.list);
        } else 
        {
            dataHolder.set(t.title, []);
        }
        
    });

    return dataHolder; 
}

async function setUpDifficultyMap() {

    const Difficulty = await mongoose.model("Difficulty",  difficultySchema);  

    const dataHolder = new Map();

    const documents = await Difficulty.find({}); 

    documents.forEach( (d) => {

        const tempTags = new Map(); 

        d.tags.forEach((tag) => {
            tempTags.set(tag.title, tag.list);
        });

        dataHolder.set(d.difficulty, { list: d.list, tags: tempTags });
    });

    return dataHolder;
}

// This function will update the database with new leetcode questions 
async function update() {
    try 
    {
        const have = await Problem.estimatedDocumentCount(); 

        let dummy = await leet.problems({ limit: 1}); 
        var need = dummy.total;
        
        console.log("Total number of leetCode questions: " + need); 
        console.log("New questions needed: " + (need-have)); 

        const problemList = [];
        const tagMap = await setUpTagMap();
        const difficultyMap = await setUpDifficultyMap(); 
        
        for (let i = have; i < need; i += 25) {

            console.log("Current index: "+i);

            const query = await leet.problems({ offset: i, limit: 25 }); 
        
            query.questions.forEach( (q) => {

                const tempTagList = []; 

                if (!q.isPaidOnly) {

                    const difficultyData = difficultyMap.get(q.difficulty); 

                    difficultyData.list.push(q.questionFrontendId); 
        
                    q.topicTags.forEach( (t) => {
                        tempTagList.push(t.name); 
                    
                        if (tagMap.has(t.name)) {
                            const  difficultyDataTagValue = difficultyData.tags.get(t.name); 
                            difficultyDataTagValue.push(q.questionFrontendId); 
                            difficultyData.tags.set(t.name, difficultyDataTagValue);

                            const tempTagMapValue = tagMap.get(t.name);
                            tempTagMapValue.push(q.questionFrontendId); 
                            tagMap.set(t.name, tempTagMapValue); 
                        }
                        
                    });

                    difficultyMap.set(q.difficulty, difficultyData);
                }

                problemList.push({
                    questionFrontendId: q.questionFrontendId, 
                    acRate: q.acRate, 
                    difficulty: q.difficulty,
                    title: q.title, 
                    titleSlug: q.titleSlug,
                    tags: tempTagList,
                    free: !q.isPaidOnly
                });

            });
        }

        const tagMapToArrayForBulk = [];

        tagMap.forEach( ( value, key) => {
            tagMapToArrayForBulk.push({
                updateOne: {
                    filter: { title: key }, 
                    update: { list: value }
                }
            });
        });

        const diffMapToArrayForBulk = []; 

        difficultyMap.forEach( (value, key) => {

            const temp = []; 
            
            value.tags.forEach((value, key) => {
                temp.push({
                    title: key, 
                    list: value
                });
            });

            diffMapToArrayForBulk.push({
                updateOne: {
                    filter: { difficulty: key },
                    update: { list: value.list, tags: temp }
                }
            })
        });

        const problemRes = await Problem.insertMany(problemList); 
        console.log(problemRes);
        const difficultyRes = await Difficulty.bulkWrite(diffMapToArrayForBulk);
        console.log(difficultyRes);
        const tagRes = await Tag.bulkWrite(tagMapToArrayForBulk);
        console.log(tagRes);
       
        console.log("Done");
    }

    catch(e) {
        console.log(e.message);
    }
};

async function getRandomProblem(difficulty=null) {
    try {

        if (difficulty) { // difficulty = "Easy" || "Medium" || "Hard"
            const temp = await Difficulty.findOne({ difficulty: difficulty }); 

            const randomValue = Math.floor(Math.random() * temp.list.length);
            const questionFrontendId = temp.list[randomValue];

            const question = await Problem.find({ questionFrontendId: questionFrontendId });

            return question;
        } else 
        {
            const res = await Problem.aggregate([{ $sample: { size: 1 } }]);

            console.log(res);
        }
        
    } catch(err) {
        console.log(err);
    }
}

async function getRandomProblemFromUser(user){
    try {
        // Get a random difficulty 
        const randomDifficulty = user.diffs[Math.floor(Math.random() * user.diffs.length)]; 

        if (user.tags.length > 0) {
            const randomTag = user.tags[Math.floor(Math.random() * user.tags.length)]; 

            const problems = await Difficulty.findOne({ difficulty: randomDifficulty }); 

            const temp = problems.tags[tags.get(randomTag)]; 

            const questionFrontendId = temp.list[Math.floor(Math.random() * temp.list.length)]; 

            const problem = await Problem.findOne({ questionFrontendId: questionFrontendId }); 

            return problem;

        } else {
            return await getRandomProblem(randomDifficulty); 
        }
 
    } catch(err) {
        console.log(err);
    }
}

module.exports = {
    update, 
    getRandomProblem,
    getRandomProblemFromUser,
    Monday, 
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday
};