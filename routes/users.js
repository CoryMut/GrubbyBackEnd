const express = require("express");

const User = require("../models/user");
const ExpressError = require("../helpers/expressError");
const { checkForUsername, validateSchema } = require("../middleware/user");
const { checkCorrectUser } = require("../middleware/auth");
const router = new express.Router();
const { makeToken } = require("../helpers/token");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

const sqlForPartialUpdate = require("../helpers/partialUpdate");

router.get("/", async (req, res, next) => {
    try {
        const users = await User.all();

        if (users.length === 0) {
            return res.status(404).json({
                error: new ExpressError(
                    "Either there are no users or something went wrong. Please try again later.",
                    404
                ),
            });
        }

        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

router.post("/register", validateSchema, async (req, res, next) => {
    try {
        console.log("IN REGISTER POST");
        const user = await User.register(req.body);
        console.log(user);
        const token = makeToken(user);
        // return res.status(201).json({ user });
        return res.status(201).json({ token });
    } catch (error) {
        if (error.code === "23505") {
            if (error.constraint === "users_email_key") {
                return res.status(409).json({ error: new ExpressError(`email already in use.`, 409) });
            } else {
                return res.status(409).json({ error: new ExpressError("User with that username already exists", 409) });
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

module.exports = router;
