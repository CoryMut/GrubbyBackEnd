/** Shared config for application; can be req'd many places. */

require("dotenv").config({ path: require("find-config")(".env") });

const SECRET_KEY = process.env.SECRET_KEY || "something_secret_and_secure";
const KEY_SECRET = process.env.KEY_SECRET || "something_secret_and_secure";
const PORT = +process.env.PORT || 5000;
const WS_PORT = +process.env.WS_PORT || 443;

const BCRYPT_WORK_FACTOR = process.env.BCRYPT_WORK_FACTOR || 12;

const accessKeyId = process.env.accessKeyId || "why no work";
const secretAccessKey = process.env.secretAccessKey || "why no work";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "google client id";

let DB_URI;

if (process.env.NODE_ENV === "test") {
    DB_URI = "grubby_test";
} else {
    DB_URI = process.env.DATABASE_URL || "grubby";
}

module.exports = {
    SECRET_KEY,
    KEY_SECRET,
    PORT,
    DB_URI,
    BCRYPT_WORK_FACTOR,
    secretAccessKey,
    accessKeyId,
    WS_PORT,
    GOOGLE_CLIENT_ID,
};
