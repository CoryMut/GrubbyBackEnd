const express = require("express");
const http = require("http");
const Comic = require("../models/comic");
const resizeImage = require("../helpers/resizeImage");
const WebSocket = require("ws");

const { checkForCookie } = require("../middleware/auth");
const { verifyCookie } = require("../helpers/token");

const router = new express.Router();
const server = http.createServer(router);

const wss = new WebSocket.Server({
    server,
    verifyClient: async function (info, callback) {
        try {
            const cookie = info.req.headers.cookie.split("authcookie=")[1];
            let result = await verifyCookie(cookie);
            if (!result) {
                callback(false, 401, "Unauthorized");
            } else {
                callback(true);
            }
        } catch (error) {
            callback(false, 401, "Unauthorized");
        }
    },
});

wss.on("connection", function connection(ws) {
    console.log("establish websocket connection");
    ws.on("message", (message) => {
        console.log("received: %s", message);
    });
    ws.onclose = function (event) {
        console.log("closed ws");
    };
});

router.get("/latest", async (req, res, next) => {
    try {
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
        if (!req.files) {
            return res.status(500).send({ msg: "file is not found" });
        }

        let data = JSON.parse(req.body.data);

        function sendMessage(num, message, type = "success") {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ progress: num, message, type }));
                }
            });
        }

        sendMessage(25, "File received");

        const comic = req.files.file;

        sendMessage(50, "Resizing images...");

        await resizeImage(comic);

        sendMessage(75, "Resize complete, uploading remaining data...");

        data["comic_id"] = data.name.match(/\d+/)[0];

        await Comic.create(data);

        sendMessage(100, "All done!");

        return res.status(200).json({ message: "Thanks for the comic!" });
    } catch (error) {
        sendMessage(99, error.message, "error");
        return next(error);
    }
});

router.get("/all", async (req, res, next) => {
    try {
        let result = await Comic.getAllComics();
        return res.status(200).json({ comics: result });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get("/characters", async (req, res, next) => {
    try {
        let result = await Comic.getAllCharacters();
        let characterArray = [];
        result.map((character) => characterArray.push(character.name));
        return res.status(200).json({ characters: characterArray });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get("/search", async (req, res, next) => {
    try {
        let { searchTerm } = req.query;
        let result = await Comic.search(searchTerm);

        return res.status(200).json({ results: result });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.patch("/:comic_id", checkForCookie, async (req, res, next) => {
    try {
        let isAdmin = res.locals.is_admin;

        if (!isAdmin) {
            throw new ExpressError("Not authorized to view this content, 401");
        }

        let { comic_id } = req.params;
        let { data } = req.body;
        let result = await Comic.update(comic_id, data);

        return res.status(200).json({ results: result, message: "Updated comic successfully." });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

server.listen(80);

module.exports = router;
