const express = require("express");
const router = new express.Router();
const { makeToken, makeCookie } = require("../helpers/token");
const { authUser, checkStatus, authRequired } = require("../middleware/auth");

router.post("/checkToken", authRequired, async (req, res, next) => {
    try {
        // const token = res.locals.token;
        const user = res.locals.username;
        const isAdmin = res.locals.is_admin;
        return res.json({ user, isAdmin });
    } catch (error) {
        return res.json({ error });
    }
});

router.get("/logout", async (req, res, next) => {
    try {
        console.log("in logout");
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

module.exports = router;
