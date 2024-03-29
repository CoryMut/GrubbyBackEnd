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
app.use(
    cors({
        origin: ["https://grubbythegrape.com", "https://www.grubbythegrape.com"],
        // origin: ["http://localhost:3000"],
        credentials: true,
        exposedHeaders: ["set-cookie"],
    })
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
        await verifyClient(token, origin);
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
