const crypto = require("crypto");

function makeUniqueString() {
    return crypto.randomBytes(128).toString("hex");
}

module.exports = { makeUniqueString };
