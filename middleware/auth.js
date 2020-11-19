const User = require("../models/user");
const ExpressError = require("../helpers/expressError");
const { SECRET_KEY, KEY_SECRET } = require("../config");
const jwt = require("jsonwebtoken");

function checkForCookie(req, res, next) {
    try {
        const authCookie = req.cookies.authcookie;

        let cookie = jwt.verify(authCookie, KEY_SECRET);
        console.log(cookie);
        res.locals.user = cookie.user;
        res.locals.is_admin = cookie.is_admin;
        next();
    } catch (error) {
        console.log(error);
        throw new ExpressError("Please log in to view this page", 403);
    }
}

async function authUser(req, res, next) {
    try {
        if (!req.body.email || !req.body.password) {
            throw new ExpressError("Missing credentials. Expecting email and password.", 400);
        } else {
            const user = await User.authenticate(req.body);
            res.locals.user = user;
            next();
        }
    } catch (error) {
        console.error(error);
        return next(error);
    }
}

function authRequired(req, res, next) {
    try {
        if (!req.body._token && !req.query._token) {
            throw new ExpressError("No token found. Please login to authenticate.", 401);
        }

        const receivedToken = req.body._token || req.query._token;
        let token;
        try {
            token = jwt.verify(receivedToken, SECRET_KEY);
        } catch (error) {
            throw new ExpressError("Invalid token. Please re-authenticate.", 401);
        }
        console.log("--------AFTER ERROR----------");
        res.locals.username = token.username;
        res.locals.is_admin = token.is_admin;
        res.locals.token = receivedToken;
        return next();
    } catch (error) {
        return next(error);
    }
}

function checkCorrectUser(req, res, next) {
    try {
        const token = checkForToken(req);
        res.locals.username = token.username;
        if (token.username === req.params.username) {
            return next();
        } else {
            throw new ExpressError("Unauthorized for this route.", 401);
        }
    } catch (error) {
        return next(error);
    }
}

function adminRequired(req, res, next) {
    try {
        const token = checkForToken(req);
        res.locals.username = token.username;
        if (token.is_admin) {
            return next();
        } else {
            throw new ExpressError("Unauthorized for this route. Must be admin.", 401);
        }
    } catch (error) {
        return next(error);
    }
}

module.exports = { authUser, authRequired, checkCorrectUser, adminRequired, checkForCookie };
