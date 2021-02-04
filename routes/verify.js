const express = require("express");
const router = new express.Router();
const { BASE_URL, CLIENT_URL } = require("../config");

const User = require("../models/user");

router.get("/verify-account/:userId/:secretCode", async (req, res, next) => {
    try {
        const { userId, secretCode } = req.params;
        await User.verifyEmailCode(userId, secretCode);
        await User.verifyUser(userId);
        res.redirect(`${CLIENT_URL}/verify/success`);
    } catch (error) {
        if (error.message === "Already verified!") {
            res.redirect(`${CLIENT_URL}/verify/repeat`);
        } else {
            res.redirect(`${CLIENT_URL}/verify/fail`);
        }
    }
});

router.get("/verify", async (req, res, next) => {
    return res.json({ message: "Hello" });
});

module.exports = router;
