const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");

const ExpressError = require("./helpers/expressError");
const morgan = require("morgan");

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://localhost:3000",
            "https://beta.grubbythegrape.com",
            "https://www.grubbythegrape.com",
            "http://10.0.1.50:3000",
            "https://10.0.1.50:3000",
        ],
        credentials: true,
        exposedHeaders: ["set-cookie"],
    })
);
app.use(fileUpload());
app.use(cookieParser());

app.use(morgan("tiny"));

const authRoutes = require("./routes/auth");
const comicRoutes = require("./routes/comic");
const userRoutes = require("./routes/users");

app.use("/comic", comicRoutes);
app.use("/user", userRoutes);
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
