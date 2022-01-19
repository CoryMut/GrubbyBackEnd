const db = require("../mongodb");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
    name: String,
    user_id: Number,
    coins: Number,
    wins: Number,
});

const questionSchema = mongoose.Schema({
    question: String,
    content: Array,
    correct: String,
    id: Number,
});

const Leaderboards = mongoose.model("leaderboards", schema);
const Questions = mongoose.model("questions", questionSchema);

module.exports = { Leaderboards, Questions };
