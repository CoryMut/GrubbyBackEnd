const jwt = require("jsonwebtoken");
const { SECRET_KEY, KEY_SECRET } = require("../config");

function makeToken(user) {
    let payload = {
        username: user.username,
        is_admin: user.is_admin,
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

module.exports = { makeToken, makeCookie };
