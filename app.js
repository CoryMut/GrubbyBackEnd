const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const { verifyClient } = require("./helpers/token");
const ExpressError = require("./helpers/expressError");
const morgan = require("morgan");
const compression = require("compression");

const app = express();

app.use(express.json());
const ALLOWED_ORIGINS = [
    "https://grubbythegrape.com",
    "https://www.grubbythegrape.com",
    process.env.ORIGIN1,
    process.env.ORIGIN2,
    process.env.ORIGIN3,
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // allow requests with no origin (mobile apps, curl, etc.)
            if (!origin) return callback(null, true);
            if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
            return callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
        exposedHeaders: ["set-cookie"],
    }),
);

app.use(fileUpload());
app.use(cookieParser());

app.use(morgan("tiny"));

app.use(compression());

async function checkClient(req, res, next) {
    try {
        const token = req.headers.authorization;
        const origin = req.headers.origin;
        if (!token || !origin) {
            throw Error("Unauthorized");
        }
        await verifyClient(token);
        return next();
    } catch (error) {
        return res.status(401).send({ message: "You are not authorized to access this API." });
    }
}

const authRoutes = require("./routes/auth");
const comicRoutes = require("./routes/comic");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const verifyRoutes = require("./routes/verify");
const triviaRoutes = require("./routes/trivia");

app.use(verifyRoutes);
app.use(checkClient);
app.use("/comic", comicRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/trivia", triviaRoutes);
app.use(authRoutes);

/** 404 handler */

app.use(function (req, res, next) {
    const err = new ExpressError("Not Found", 404);

    // pass the error to the next piece of middleware
    return next(err);
});

/** general error handler */

app.use(function (err, req, res, next) {
    res.status(err.status || 500);

    return res.json({
        error: {
            status: err.status,
            message: err.message,
        },
    });
});

module.exports = app;
