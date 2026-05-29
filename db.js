const { Pool } = require("pg");
const { DB_URI } = require("./config");
const poolConfig = {
    connectionString: DB_URI,
    max: Number(process.env.PG_MAX_CONNECTIONS) || 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

if (process.env.NODE_ENV === "production") {
    poolConfig.ssl = {
        rejectUnauthorized: false,
    };
}

const db = new Pool(poolConfig);

db.on("error", (err) => {
    console.error("Unexpected idle PostgreSQL client error", err);
});

module.exports = db;
