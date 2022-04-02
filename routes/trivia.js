const express = require("express");
const { Leaderboards, Questions } = require("../models/trivia");
const { checkForCookie } = require("../middleware/auth");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");

async function updateGrubby(bet, direction) {
    try {
        const grubbyInfo = await Leaderboards.findOne({ user_id: -1 });
        let { coins, wins } = grubbyInfo;
        if (direction === "increase") {
            grubbyInfo.coins = Number(coins) + Number(bet);
            grubbyInfo.wins = Number(wins) + 1;
        } else if (direction === "decrease") {
            grubbyInfo.coins = Number(coins) - Number(bet);
        }
        await grubbyInfo.save();
        return;
    } catch (error) {
        throw error;
    }
}

router.get("/", async (req, res, next) => {
    try {
        const coins = await Leaderboards.find().sort({ coins: -1 }).limit(10);
        const wins = await Leaderboards.find().sort({ wins: -1 }).limit(10);

        return res.status(200).json({ leaderboards: { wins, coins } });
    } catch (error) {
        return next(error);
    }
});

router.get("/question", async (req, res, next) => {
    try {
        const trivia = await Questions.aggregate([{ $sample: { size: 1 } }]);
        let newTrivia = trivia[0];
        return res.status(200).json({ trivia: newTrivia });
    } catch (error) {
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
        return next(error);
    }
});

router.put("/", checkForCookie, async (req, res, next) => {
    try {
        const data = req.body;
        let { info, direction, bet } = data;
        let userRecord = await Leaderboards.findOne({ user_id: res.locals.id });
        if (Object.keys(userRecord).length === 0) {
            return res.status(200).json({ info: [] });
        }
        userRecord.coins = info.coins;
        userRecord.wins = info.wins;
        await userRecord.save();
        await updateGrubby(bet, direction);
        return res.status(200).json({ info: userRecord });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
