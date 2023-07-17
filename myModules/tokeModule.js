const mongoose = require('mongoose'); 

const tokenSchema = new mongoose.Schema({
    token: { type: String, requierd: true },
    userId: { type: String, required: true }
});

module.exports = mongoose.model("Token", tokenSchema);