const jwt = require("jsonwebtoken");
const { SECRET_KEY, KEY_SECRET, CLIENT_SECRET, ORIGIN1, ORIGIN2, ORIGIN3 } = require("../config");

function makeToken(user) {
    let payload = {
        username: user.username,
        is_admin: user.is_admin,
        displayName: user.displayName,
        id: user.id,
    };

    return jwt.sign(payload, SECRET_KEY, { expiresIn: "72h" });
}

function makeCookie(user) {
    let payload = {
        username: user.username,
        is_admin: user.is_admin,
        id: user.id,
    };

    return jwt.sign(payload, KEY_SECRET);
}

function verifyCookie(cookie) {
    try {
        jwt.verify(cookie, KEY_SECRET);
        return true;
    } catch (error) {
        return false;
    }
}

function verifyClient(token, origin) {
    try {
        if (origin !== ORIGIN1 && origin !== ORIGIN2 && origin !== ORIGIN3) {
            throw Error("Unauthorized Origin");
        } else {
            jwt.verify(token, CLIENT_SECRET);
            return true;
        }
    } catch (error) {
        console.error(error);
        throw Error("Unauthorized Token");
    }
}

module.exports = { makeToken, makeCookie, verifyCookie, verifyClient };
