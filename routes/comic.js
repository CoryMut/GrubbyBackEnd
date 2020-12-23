const express = require("express");
const http = require("http");
const Comic = require("../models/comic");
const resizeImage = require("../helpers/resizeImage");
const validateFile = require("../helpers/validateFile");
const WebSocket = require("ws");

const { checkForCookie } = require("../middleware/auth");
const { verifyCookie } = require("../helpers/token");
const ExpressError = require("../helpers/expressError");

const router = new express.Router();
const server = http.createServer(router);

const { WS_PORT } = require("../config");

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
            return res.status(400).send({ msg: "file is not found" });
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

        await validateFile(comic);

        sendMessage(50, "Resizing images...");

        await resizeImage(comic);

        sendMessage(75, "Resize complete, uploading remaining data...");

        let numComic = await Comic.getCount();

        // data["comic_id"] = data.name.match(/\d+/)[0];
        data["comic_id"] = Number(numComic) + 1;

        await Comic.create(data, comic.md5);

        sendMessage(100, "All done!");

        return res.status(200).json({ message: "Thanks for the comic!" });
    } catch (error) {
        sendMessage(99, error.message, "error");
        return next(error);
    }
});

router.get("/all", async (req, res, next) => {
    try {
        let { page } = req.query;
        if (page) {
            let result = await Comic.getAllComics(page);
            let numComics = await Comic.getCount();
            let count = Math.ceil(Number(numComics) / 20);
            return res.status(200).json({ comics: result, count: count });
        } else {
            return res.status(400).json({ message: "Invalid page request" });
        }
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
        let { searchTerm, page = 1 } = req.query;
        if (!searchTerm) {
            throw new ExpressError("Missing search term", 400);
        }
        let result = await Comic.search(searchTerm, page);
        let count;
        if (result.length > 0) {
            count = Math.ceil(Number(result[0].full_count) / 20);
        } else {
            count = 0;
        }
        return res.status(200).json({ comics: result, count: count });
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

router.get("/:comic_id/emotes", async (req, res, next) => {
    try {
        let { comic_id } = req.params;
        let { labels } = req.query;
        labels = labels.split("&");
        let result = await Comic.getEmoteData(labels, comic_id);
        return res.status(200).json({ emotes: result });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get("/:comic_id/:username", async (req, res, next) => {
    try {
        let { comic_id, username } = req.params;

        let result = await Comic.getUserEmoteData(username, comic_id);

        return res.status(200).json({ reaction: result.reaction });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.post("/:comic_id/:username", async (req, res, next) => {
    try {
        let { comic_id, username } = req.params;
        let { data } = req.body;
        let { reaction } = data;
        let result = await Comic.createUserEmoteData(username, comic_id, reaction);
        return res.status(200).json({ message: "Created user emote data successfully!" });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.patch("/:comic_id/:username", async (req, res, next) => {
    try {
        let { comic_id, username } = req.params;
        let { data } = req.body;
        let { reaction } = data;
        let result = await Comic.updateUserEmoteData(username, comic_id, reaction);
        return res.status(200).json({ message: "Updated user emote data successfully!" });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.delete("/:comic_id", async (req, res, next) => {
    try {
        let { comic_id } = req.params;
        let result = await Comic.deleteAll(comic_id);
        return res.status(200).json({ message: "Deleted comic data successfully!" });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

if (process.env.NODE_ENV !== "test") {
    server.listen(WS_PORT);
}

module.exports = router;
