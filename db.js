/** Database setup for jobly. */

const { Client } = require("pg");
const { DB_URI } = require("./config");
let db;

if (process.env.NODE_ENV === "production") {
    // issue with pg and digital ocean managed databases
    let doWorkAround = DB_URI.includes("sslmode") ? DB_URI.replace("sslmode=require", "") : DB_URI;
    db = new Client({
        connectionString: doWorkAround,
        ssl: {
            rejectUnauthorized: false,
        },
    });
} else {
    db = new Client({
        connectionString: DB_URI,
    });
}

// const db = new Client({
//     connectionString: DB_URI,
//     ssl: {
//         rejectUnauthorized: false,
//     },
// });

db.connect();

module.exports = db;
