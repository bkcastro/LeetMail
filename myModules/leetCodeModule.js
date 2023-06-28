// This file will get all of the free leetcode questions and put them into my database. 
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require("mongoose");
const url = process.env.DB_URL;
const LeetCode = require("leetcode-query");
const { constrainedMemory } = require('process');
const { bulkSave } = require('./userModule');

let leet = new LeetCode.LeetCode();  

const questionsSchema = new mongoose.Schema({
    questionFrontendId: { type: Number, required: true },
    acRate: { type: Number, required: true }, 
    difficulty: { type: String, required: true }, 
    title: { type: String, required: true }, 
    titleSlug: { type: String, required: true },
    tags: { type: Array, required: true }
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

async function setUpTags() {

    const Tag = await mongoose.model("Tag", tagSchema);

    let dataHolder = new Map(); 

    const documents = await Tag.find({});

    documents.forEach( (t) => {
        dataHolder.set(t.title, t.list);
    });

    return dataHolder; 
}

async function setUpDifficulties() {
    const Difficulty = mongoose.model.apply("Difficulty",  difficultySchema); 

    let dataHolder = new Map(); 

    const documents = await Difficulty.find({}); 

    documents.forEach( (d) => {
        dataHolder.set(d.title, { list: d.list, tags: d.tags });
    });
}

// This function will update the database with new leetcode questions added if any. 
async function update() {
    try 
    {
        await mongoose.connect(url);

        const Question = mongoose.model("Question", questionsSchema); 
        const Tag = mongoose.model("Tag", tagSchema);
        const Difficulty = mongoose.model("Difficulty", difficultySchema);
        //const have = await Question.estimatedDocumentCount(); 
        const have = 0 

        let dummy = await leet.problems({ limit: 1}); 
        var need = dummy.total;

        console.log("Total number of leetCode questions: " + need); 
        console.log("New questions needed: " + (need-have)); 

        const questionsList = [];
        const tagMap = await setUpTags();
        const difficultyMap = await setUpDifficulties(); 

        for (let i = have; i < need; i += 25) {

            console.log("Current index: "+i);

            const query = await leet.problems({ offset: i, limit: 25 }); 
        
            query.questions.forEach( (q) => {

                if (!q.isPaidOnly) {

                    const tempTagList = []; 
                    const difficultyData = difficultyMap.get(q.difficulty); 

                    difficultyData.list.push(q.questionFrontendId); 
        
                    q.topicTags.forEach( (t) => {
                        tempTagList.push(t.name); 
                    
                        if (tagMap.has(t.name)) {
                            difficultyData.tags.set()
                            const tempTagMapValue = tagMap.get(t.name);
                            tempTagMapValue.push(q.questionFrontendId); 
                            tagMap.set(t.name, tempTagMapValue); 
                        }
                        
                    });

                    

                
                    // Difficulty 
                    difficultyMap.set(q.difficulty,  )
                    

                    questionsList.push({
                        questionFrontendId: q.questionFrontendId, 
                        acRate: q.acRate, 
                        difficulty: q.difficulty,
                        title: q.title, 
                        titleSlug: q.titleSlug,
                        tags: tempTagList
                    });
                }
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


        /*
        try { 
            const bulkResponse = await Tag.bulkWrite(tagMapToArrayForBulk);

            if (bulkResponse) {
                console.log(bulkResponse);
            }
        } catch (err) {
            console.log(err);
        }

        try {
            const insertManyResponse = await Question.insertMany(questionsList); 

            if (insertManyResponse) {
                console.log(insertManyResponse);
            }
        } catch (err) {
            console.log(err);
        } */

        console.log("Done");
    }

    catch(e) {
        console.log(e.message);
    }
};


async function testing() {

    await mongoose.connect(url); 

    const Tag = mongoose.model("Tag", tagSchema); 
    const Difficulty = mongoose.model("Difficulty", difficultySchema);

    const tagMap = await setUpTags();
    const tagArray = []  
    
    tagMap.forEach( (value, key) => {
        tagArray.push(
            {
                title: key, 
                list: []
            }
        )
    }); 

    const r = await Difficulty.bulkWrite([
        {
            updateOne: {
                filter: { difficulty: "Easy" }, 
                update: { tags: tagArray, list: [1, 2,3 ] }
            }
        },
        {
            updateOne: {
                filter: { difficulty: "Medium" }, 
                update: { tags: tagArray }
            }
        },
        {
            updateOne: {
                filter: { difficulty: "Hard" }, 
                update: { tags: tagArray }
            }
        }
    ]);

    console.log(r);
}

testing();
