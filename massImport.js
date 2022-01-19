const mongoose = require("mongoose");
const data = require("./allResults.json");

mongoose.connect(
    "mongodb+srv://grubby:5cdpW0UVdd6hDUZ7@cluster0.g6ypq.mongodb.net/GrubbyLeaderboards?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);

const mongodb = mongoose.connection;

const schema = mongoose.Schema({
    question: String,
    content: Array,
    correct: String,
    id: Number,
});

const Questions = mongoose.model("questions", schema);

data.forEach(async (d, idx) => {
    const newQuestion = new Questions({ question: d.question, content: d.content, correct: d.correct, id: idx });
    await newQuestion.save();
});

mongoose.connection.on("connected", () => {
    console.log(`Mongoose connected`);
});
mongoose.connection.on("error", (err) => {
    console.log("Mongoose connection error:", err);
});
mongoose.connection.on("disconnected", () => {
    console.log("Mongoose disconnected");
});
