const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");

const ExpressError = require("./helpers/expressError");
const morgan = require("morgan");

const app = express();

app.use(express.json());

const corsOptions = {
    origin: ["https://grubbythegrape.com/", "https://www.grubbythegrape.com"],
    credentials: true,
    exposedHeaders: ["set-cookie"],
};

app.use(cors(corsOptions));
app.use(fileUpload());
app.use(cookieParser());

app.use(morgan("tiny"));

const authRoutes = require("./routes/auth");
const comicRoutes = require("./routes/comic");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");

app.use("/comic", cors(corsOptions), comicRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
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
