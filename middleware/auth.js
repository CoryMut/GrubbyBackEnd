const User = require("../models/user");
const ExpressError = require("../helpers/expressError");
const { SECRET_KEY, KEY_SECRET } = require("../config");
const { makeToken } = require("../helpers/token");
const jwt = require("jsonwebtoken");

function checkForCookie(req, res, next) {
    try {
        const authCookie = req.cookies.authcookie;
        if (!authCookie) {
            throw new ExpressError("You do not have permission to view this page", 403);
        }
        let cookie = jwt.verify(authCookie, KEY_SECRET);
        res.locals.user = cookie.user;
        res.locals.is_admin = cookie.is_admin;
<<<<<<< HEAD
=======
        res.locals.id = cookie.id;
>>>>>>> trivia-dev
        next();
    } catch (error) {
        console.error(error);
        return next(error);
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
        jwt.verify(receivedToken, SECRET_KEY, function (err, decoded) {
            if (err && err.name === "TokenExpiredError") {
                let decoded = jwt.decode(receivedToken);
<<<<<<< HEAD
                let { username, is_admin, displayName } = decoded;
                let user = { username, is_admin, displayName };
=======
                let { username, is_admin, displayName, id } = decoded;
                let user = { username, is_admin, displayName, id };
>>>>>>> trivia-dev
                token = makeToken(user);
                res.locals.username = username;
                res.locals.is_admin = is_admin;
                res.locals.token = token;
                res.locals.name = displayName;
<<<<<<< HEAD
=======
                res.locals.id = id;
>>>>>>> trivia-dev
            } else if (err) {
                throw new ExpressError("Invalid token. Please re-authenticate.", 401);
            } else if (!err) {
                res.locals.username = decoded.username;
                res.locals.is_admin = decoded.is_admin;
                res.locals.name = decoded.displayName;
<<<<<<< HEAD
=======
                res.locals.id = decoded.id;
>>>>>>> trivia-dev
            }

            next();
        });
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
