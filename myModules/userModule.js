const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
    username: { type: String, required: true }, 
    email: { type: String, required: true }, 
    password: { type: String, required: true }, 
    status: { type: Boolean, required: true },
    schedule: { type: Array, required: true }, 
    diffs: { type: Array, required: true }, 
    tags: { type: Array, required: true }, 
});

module.exports = mongoose.model("User", userSchema); 