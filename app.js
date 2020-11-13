/** Express app for jobly. */

const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");

const ExpressError = require("./helpers/expressError");
const morgan = require("morgan");

const app = express();
// const expressWS = require("express-ws")(app);

app.use(express.json());
// app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://localhost:3000",
            "https://beta.grubbythegrape.com",
            "https://www.grubbythegrape.com",
        ],
        credentials: true,
        exposedHeaders: ["set-cookie"],
    })
);
app.use(fileUpload());
app.use(cookieParser());

app.use(morgan("tiny"));

// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "http://localhost:3000");
//     res.header("Access-Control-Allow-Credentials", true);
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

const authRoutes = require("./routes/auth");
const comicRoutes = require("./routes/comic");
const userRoutes = require("./routes/users");

// app.ws("/comic/status", function (ws, req, next) {
//     ws.onopen = function () {
//         ws.send("Hello");
//     };

//     ws.on("message", function (data) {
//         try {
//             ws.send("Why is this so hard");
//         } catch (err) {
//             console.error(err);
//         }
//     });
// });

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
