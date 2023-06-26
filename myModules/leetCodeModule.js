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
    list: { type:Array, required: true }
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

// This function will update the database with new leetcode questions added if any. 
async function update() {
    try 
    {
        await mongoose.connect(url);

        const Question = await mongoose.model("Question", questionsSchema); 
        const Tag = await mongoose.model("Tag", tagSchema);

        //const have = await Question.estimatedDocumentCount(); 
        const have = 0 

        let dummy = await leet.problems({ limit: 1}); 
        var need = dummy.total;

        console.log("Total number of leetCode questions: " + need); 
        console.log("New questions needed: " + (need-have)); 

        const questionsList = [];
        const tagMap = await setUpTags(); 

        for (let i = have; i < need; i += 25) {

            console.log("Current index: "+i);

            const query = await leet.problems({ offset: i, limit: 25 }); 
        
            query.questions.forEach( (q) => {

                const tempTagList = []; 
            
                q.topicTags.forEach( (t) => {
                    tempTagList.push(t.name); 
                   
                    if (tagMap.has(t.name)) {
                        const tempTagMapValue = tagMap.get(t.name);
                        tempTagMapValue.push(q.questionFrontendId); 
                        tagMap.set(t.name, tempTagMapValue); 
                    }
                    
                });

                // Difficulty 
                const tempTagMapValue = tagMap.get(q.difficulty);
                tempTagMapValue.push(q.questionFrontendId); 
                tagMap.set(q.difficulty, tempTagMapValue); 

                questionsList.push({
                    questionFrontendId: q.questionFrontendId, 
                    acRate: q.acRate, 
                    difficulty: q.difficulty,
                    title: q.title, 
                    titleSlug: q.titleSlug,
                    tags: tempTagList
                })
            
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

        console.log(tagMapToArrayForBulk);

        try { 
            const bulkResponse = await Tag.bulkWrite(tagMapToArrayForBulk);

            if (bulkResponse) {
                console.log(bulkResponse);
            }
        } catch (err) {
            console.log(err);
        }

        /*
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
    try {
        await mongoose.connect(url);

        const Tag = await mongoose.model("Tag", tagSchema);
        const tagMap = await setUpTags(); 


        const tagMapToArrayForBulk = [];

        tagMap.forEach( ( value, key) => {
            tagMapToArrayForBulk.push({
                updateOne: {
                    filter: { title: key }, 
                    update: { list: [] }
                }
            });
        });

        console.log(tagMapToArrayForBulk);

        try { 
            const bulkResponse = await Tag.bulkWrite(tagMapToArrayForBulk);

            if (bulkResponse) {
                console.log(bulkResponse);
            }
        } catch (err) {
            console.log(err);
        } 

    } catch(err) {
        console.log(err);
    }
}

update();