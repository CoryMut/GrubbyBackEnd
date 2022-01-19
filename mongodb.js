const mongoose = require("mongoose");
const { MONGO_DB_URI } = require("./config");

mongoose.connect(MONGO_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const mongodb = mongoose.connection;

mongoose.connection.on("connected", () => {
    console.log(`Mongoose connected`);
});
mongoose.connection.on("error", (err) => {
    console.log("Mongoose connection error:", err);
});
mongoose.connection.on("disconnected", () => {
    console.log("Mongoose disconnected");
});

module.exports = mongodb;
