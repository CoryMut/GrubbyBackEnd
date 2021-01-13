const jwt = require("jsonwebtoken");
const { SECRET_KEY, KEY_SECRET } = require("../config");

function makeToken(user) {
    let payload = {
        username: user.username,
        is_admin: user.is_admin,
        displayName: user.displayName,
    };

    return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
}
function makeCookie(user) {
    let payload = {
        username: user.username,
        is_admin: user.is_admin,
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

module.exports = { makeToken, makeCookie, verifyCookie };
