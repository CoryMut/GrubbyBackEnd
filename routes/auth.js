const express = require("express");
const router = new express.Router();
const { makeToken, makeCookie } = require("../helpers/token");
const { authUser, authRequired } = require("../middleware/auth");
const { googleAuth } = require("../helpers/googleAuth");
const { sendEmail } = require("../helpers/sendEmail");
const { BASE_URL, CLIENT_URL } = require("../config");
const User = require("../models/user");

router.post("/checkToken", authRequired, async (req, res, next) => {
    try {
        const user = res.locals.username;
        const isAdmin = res.locals.is_admin;
        const name = res.locals.name;
        const cookie = makeCookie({ username: user, is_admin: isAdmin, displayName: name });
        res.cookie("authcookie", cookie, { maxAge: 259200500, httpOnly: true });
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
            const cookie = makeCookie(user);
            res.cookie("authcookie", cookie, { maxAge: 28800000, httpOnly: true });
            return res.json({ token: newToken, user });
        } else {
            let data = { userId, email, name: fullName };
            let newUser = await User.register_external_user(data, provider);
            console.log(newUser);
            newToken = makeToken(newUser);
            const cookie = makeCookie(newUser);
            res.cookie("authcookie", cookie, { maxAge: 28800000, httpOnly: true });
            return res.json({ token: newToken, user: { ...newUser, displayName: newUser.display_name } });
        }
    } catch (error) {
        return next(error);
    }
});

router.get("/resend-email", async (req, res, next) => {
    try {
        let { email } = req.query;
        let { username, id, email_token } = await User.resendEmail(email);
        sendEmail({
            to: `${email}`,
            name: `${username}`,
            url: `${BASE_URL}/verify-account/${id}/${email_token}`,
            type: "verification",
        });
        return res.json({ message: `Verification email sent to ${email}` });
    } catch (error) {
        return next(error);
    }
});

router.get("/resend-email/password", async (req, res, next) => {
    try {
        let { email } = req.query;
        let { username, id } = await User.get(email);
        if (!username) {
            return res.json({
                message: "If a user with that email exists, instructions for resetting your password have been sent.",
            });
            // } else if (external_login) {
            //     return res.json({
            //         message: "Reset password not possible, you used Login with Google!",
            //     });
            // } else {
        } else {
            let reset_token = await User.preparePasswordReset(id);
            sendEmail({
                to: `${email}`,
                name: `${username}`,
                url: `${CLIENT_URL}/reset-password/${id}/${reset_token}`,
                type: "password",
            });
            return res.json({
                message: "If a user with that email exists, instructions for resetting your password have been sent.",
            });
        }
    } catch (error) {
        return next({ message: "Something went wrong, please try again" });
    }
});

router.post("/reset-password", async (req, res, next) => {
    try {
        const { token, password, id } = req.body;
        // let { username } = await User.verifyCode(id, token, "password");
        await User.verifyPasswordCode(id, token);
        await User.resetPassword(id, password);
        return res.status(201).json({ message: `Password change successful.` });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
