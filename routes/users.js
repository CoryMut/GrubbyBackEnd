const express = require("express");

const User = require("../models/user");
const ExpressError = require("../helpers/expressError");
const { validateSchema } = require("../middleware/user");
const router = new express.Router();
const { makeToken, makeCookie } = require("../helpers/token");
const { sendEmail } = require("../helpers/sendEmail");

const { BASE_URL } = require("../config");

router.post("/register", validateSchema, async (req, res, next) => {
    try {
        const user = await User.register(req.body);
        const { id, email_token, email, username } = user;
        sendEmail({
            to: `${email}`,
            name: `${username}`,
            url: `${BASE_URL}/verify-account/${id}/${email_token}`,
            type: "verification",
        });
        const token = makeToken(user);
        const cookie = makeCookie(user);
        res.cookie("authcookie", cookie, { maxAge: 28800000, httpOnly: true });

        return res.status(201).json({ token, user: { username: user.username, is_admin: user.is_admin } });
    } catch (error) {
        if (error.code === "23505") {
            if (error.constraint === "users_email_key") {
                return res.status(409).json({ error: new ExpressError(`Email already in use.`, 409) });
            } else {
                return res.status(409).json({ error: new ExpressError("Username not available", 409) });
            }
        } else {
            console.log(error);
            return res.status(409).json({ error: new ExpressError("Something went wrong. Try again?", 409) });
        }
    }
});

router.get("/favorites/:username", async (req, res, next) => {
    try {
        const { username } = req.params;
        const favorites = await User.favorites(username);
        return res.status(200).json({ favorites });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
