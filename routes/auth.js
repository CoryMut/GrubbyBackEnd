const express = require("express");
const router = new express.Router();
const { makeToken, makeCookie } = require("../helpers/token");
const { authUser, checkStatus, authRequired } = require("../middleware/auth");
const { googleAuth } = require("../helpers/googleAuth");

const User = require("../models/user");

router.post("/checkToken", authRequired, async (req, res, next) => {
    try {
        // const token = res.locals.token;
        const user = res.locals.username;
        const isAdmin = res.locals.is_admin;
        const name = res.locals.name;
        return res.json({ user, isAdmin, name });
    } catch (error) {
        return res.json({ error });
    }
});

router.get("/logout", async (req, res, next) => {
    try {
        res.cookie("authcookie", "logout", { maxAge: 28800000, httpOnly: true });
        return res.json({ message: "logout successful" });
    } catch (error) {
        return res.json({ error });
    }
});

router.post("/login", authUser, async (req, res, next) => {
    try {
        const user = res.locals.user;
        const token = makeToken(user);
        const cookie = makeCookie(user);
        res.cookie("authcookie", cookie, { maxAge: 28800000, httpOnly: true });

        return res.json({ token, user });
    } catch (error) {
        return next(error);
    }
});

router.post("/auth/google", async (req, res, next) => {
    try {
        const { token } = req.body;
        const { userId, email, fullName, provider } = await googleAuth(token);
        const existingUser = await User.checkEmail(email);
        let newToken;
        if (existingUser) {
            const user = await User.get(email);
            newToken = makeToken(user);
            return res.json({ token: newToken, user });
        } else {
            let data = { userId, email, name: fullName };
            let newUser = await User.register_external_user(data, provider);
            newToken = makeToken(newUser);
            return res.json({ token: newToken, user: newUser });
        }
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
