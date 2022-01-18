const express = require("express");
const { Leaderboards, Questions } = require("../models/trivia");
const { checkForCookie } = require("../middleware/auth");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

router.get("/", async (req, res, next) => {
    try {
        const coins = await Leaderboards.find().sort({ coins: -1 }).limit(10);
        const wins = await Leaderboards.find().sort({ wins: -1 }).limit(10);

        return res.status(200).json({ leaderboards: { wins, coins } });
    } catch (error) {
        console.log(error);
        return next(error);
    }
});

router.get("/question", async (req, res, next) => {
    try {
        const trivia = await Questions.aggregate([{ $sample: { size: 1 } }]);
        console.log(trivia);

        return res.status(200).json({ trivia });
    } catch (error) {
        console.log(error);
        return next(error);
    }
});

router.post("/add", checkForCookie, async (req, res, next) => {
    try {
        let { name, id } = req.body;
        const alreadyTaken = await Leaderboards.find({ name: name });
        if (alreadyTaken.length > 0) {
            throw new ExpressError("Name already taken", 400);
        }
        const newLeaderboard = new Leaderboards({ name: name, user_id: id, coins: 1000, wins: 0 });
        await newLeaderboard.save();
        return res.status(200).json({ info: newLeaderboard });
    } catch (error) {
        console.log(error);
        return next(error);
    }
});

router.get("/:user_id", async (req, res, next) => {
    try {
        let { user_id } = req.params;

        const userInfo = await Leaderboards.find({ user_id: user_id });

        if (userInfo.length === 0) {
            return res.status(200).json({ newPlayer: true, info: {} });
        }

        return res.status(200).json({ info: userInfo[0], newPlayer: false });
    } catch (error) {
        console.log(error);
        return next(error);
    }
});

router.put("/", checkForCookie, async (req, res, next) => {
    try {
        const data = req.body;
        let userRecord = await Leaderboards.findOne({ user_id: res.locals.id });
        if (Object.keys(userRecord).length === 0) {
            return res.status(200).json({ info: [] });
        }
        userRecord.coins = data.coins;
        userRecord.wins = data.wins;
        await userRecord.save();
        return res.status(200).json({ info: userRecord });
    } catch (error) {
        console.log(error);
        return next(error);
    }
});

module.exports = router;
