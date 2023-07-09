const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
    username: { type: String, required: true }, 
    email: { type: String, required: true }, 
    password: { type: String, required: true }, 
    status: { type: String, required: true },
    schedule: { type: Array, required: true }, 
    diffs: { type: Array, required: true }, 
    tags: { type: Array, required: true }, 
    time: { type: String, required: true }
});

const User = mongoose.model("User", userSchema); 

async function getUserData(id) {
    try {
        return await User.findById(id); 
    } catch(err) {
        console.log(err);
    }
     
};

module.exports = { 
    getUserData,
}
