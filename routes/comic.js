const express = require("express");
const http = require("http");
const Comic = require("../models/comic");
const resizeImage = require("../helpers/resizeImage");
const WebSocket = require("ws");

const { checkForCookie } = require("../middleware/auth");

const router = new express.Router();
const server = http.createServer(router);
const wss = new WebSocket.Server({ server });

wss.on("connection", function connection(ws) {
    console.log("establish websocket connection");
    ws.on("message", (message) => {
        console.log("received: %s", message);
    });
});

// const User = require('../models/user');
// const ExpressError = require('../helpers/expressError');
// const { checkForUsername, validateSchema } = require('../middleware/user');
// const { checkCorrectUser } = require('../middleware/auth');
// const { makeToken } = require('../helpers/token');
// const bcrypt = require('bcrypt');
// const { BCRYPT_WORK_FACTOR } = require('../config');

// const sqlForPartialUpdate = require('../helpers/partialUpdate');

router.get("/latest", async (req, res, next) => {
    try {
        console.log("REQUEST FOR LATEST RECEIVED");
        let result = await Comic.latest();
        return res.status(200).json({ comic: result });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get("/upload", checkForCookie, async (req, res, next) => {
    try {
        return res.status(200).json({ message: "Thanks for visiting!" });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.post("/upload", checkForCookie, async (req, res, next) => {
    try {
        console.log("IN POST UPLOAD");

        if (!req.files) {
            return res.status(500).send({ msg: "file is not found" });
        }

        let data = JSON.parse(req.body.data);

        function sendMessage(num) {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ progress: num }));
                }
            });
        }

        sendMessage(25);

        const comic = req.files.file;

        sendMessage(50);

        await resizeImage(comic);

        sendMessage(75);

        data["comic_id"] = data.name.match(/\d+/)[0];

        await Comic.create(data);

        sendMessage(100);

        return res.status(200).json({ message: "Thanks for the comic!" });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

server.listen(80);

module.exports = router;
