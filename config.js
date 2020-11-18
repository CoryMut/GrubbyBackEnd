/** Shared config for application; can be req'd many places. */

require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY || "something_secret_and_secure";
const KEY_SECRET = process.env.KEY_SECRET || "something_secret_and_secure";
const PORT = +process.env.PORT || 5000;

const BCRYPT_WORK_FACTOR = process.env.BCRYPT_WORK_FACTOR || 12;

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;

let DB_URI;

if (process.env.NODE_ENV === "test") {
    DB_URI = "grubby_test";
} else {
    DB_URI = process.env.DATABASE_URL || "grubby";
}
console.log(DB_URI);

module.exports = {
    SECRET_KEY,
    KEY_SECRET,
    PORT,
    DB_URI,
    BCRYPT_WORK_FACTOR,
    secretAccessKey,
    accessKeyId,
};
