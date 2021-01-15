const express = require("express");

const User = require("../models/user");
const ExpressError = require("../helpers/expressError");
const { checkForUsername, validateSchema } = require("../middleware/user");
const { checkCorrectUser } = require("../middleware/auth");
const router = new express.Router();
const { makeToken, makeCookie } = require("../helpers/token");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

const sqlForPartialUpdate = require("../helpers/partialUpdate");

router.post("/register", validateSchema, async (req, res, next) => {
    try {
        const user = await User.register(req.body);
        const token = makeToken(user);
        const cookie = makeCookie(user);
        res.cookie("authcookie", cookie, { maxAge: 28800000, httpOnly: true });

        return res.status(201).json({ token, user });

        // return res.status(201).json({ token });
    } catch (error) {
        if (error.code === "23505") {
            if (error.constraint === "users_email_key") {
                return res.status(409).json({ error: new ExpressError(`Email already in use.`, 409) });
            } else {
                return res.status(409).json({ error: new ExpressError("Username not available", 409) });
            }
        }
        return next(error);
    }
});

router.get("/:username", checkForUsername, async (req, res, next) => {
    try {
        const user = res.locals.user;
        return res.status(200).json({ user });
    } catch (error) {
        return next(error);
    }
});

router.patch("/:username", checkCorrectUser, validateSchema, checkForUsername, async (req, res, next) => {
    try {
        const { username } = req.params;
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, BCRYPT_WORK_FACTOR);
        }
        const { query, values } = sqlForPartialUpdate("users", req.body, "username", username);
        const user = await User.save(query, values);
        return res.status(200).json({ message: `Successfully updated user with username: ${username}`, user });
    } catch (error) {
        return next(error);
    }
});

router.delete("/:username", checkCorrectUser, checkForUsername, async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await User.delete(username);
        return res.status(200).json({ message: `Account with username '${username}' successfully deleted` });
    } catch (error) {
        return next(error);
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
