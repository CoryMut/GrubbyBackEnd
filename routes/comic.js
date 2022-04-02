const express = require("express");
const WebSocket = require("ws");
const sanitize = require("sanitize-filename");

const Comic = require("../models/comic");
const resizeImage = require("../helpers/resizeImage");
const validateFile = require("../helpers/validateFile");
const { checkForCookie } = require("../middleware/auth");
const ExpressError = require("../helpers/expressError");

const router = new express.Router();

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
        let sanitizedName = sanitize(data.name).replace(/\s/g, "");
        data.name = sanitizedName;

        function sendMessage(num, message, type = "success") {
            if (req.app.locals.clients) {
                req.app.locals.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ progress: num, message, type }));
                    }
                });
            }
        }

        sendMessage(25, "File received");

        const comic = req.files.file;

        comic.name = sanitizedName;

        await validateFile(comic);

        sendMessage(50, "Resizing images...");

        await resizeImage(comic);

        sendMessage(75, "Resize complete, uploading remaining data...");

        let numComic = await Comic.getCount();

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
        let { offset, sort } = req.query;
        if (offset) {
            let arraySort = sort === "true" ? "DESC" : "ASC";
            let result = await Comic.getAllComics(offset, arraySort);
            // let numComics = await Comic.getCount();
            let numComics = result[0].full_count ? result[0].full_count : 0;
            let newOffset = Number(offset) + Number(result.length);
            return res.status(200).json({ comics: result, offset: newOffset, resultCount: +numComics });
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
        let { searchTerm, offset = 0, sort = "ASC" } = req.query;
        if (!searchTerm) {
            throw new ExpressError("Missing search term", 400);
        }
        let arraySort = sort === "true" ? "DESC" : "ASC";

        let result = await Comic.search(searchTerm, offset, arraySort);
        let newOffset;
        let fullCount;
        if (result.length > 0) {
            newOffset = Number(offset) + Number(result.length);
            fullCount = result[0].full_count;
        } else {
            newOffset = 0;
            fullCount = 0;
        }
        return res.status(200).json({ comics: result, offset: newOffset, resultCount: fullCount });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});
// router.get("/search", async (req, res, next) => {
//     try {
//         let { searchTerm, page = 1, sort = "ASC" } = req.query;
//         if (!searchTerm) {
//             throw new ExpressError("Missing search term", 400);
//         }
//         let arraySort = sort === "true" ? "DESC" : "ASC";

//         let result = await Comic.search(searchTerm, page, arraySort);
//         let count;
//         let fullCount;
//         if (result.length > 0) {
//             count = Math.ceil(Number(result[0].full_count) / 20);
//             fullCount = result[0].full_count;
//         } else {
//             count = 0;
//             fullCount = 0;
//         }
//         return res.status(200).json({ comics: result, count: count, resultCount: fullCount });
//     } catch (error) {
//         console.error(error);
//         return next(error);
//     }
// });

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

router.get("/:comic_id/:userId", async (req, res, next) => {
    try {
        let { comic_id, userId } = req.params;

        let result = await Comic.getUserEmoteData(userId, comic_id);

        return res.status(200).json({ reaction: result.reaction });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});
// router.get("/:comic_id/:username", async (req, res, next) => {
//     try {
//         let { comic_id, username } = req.params;

//         let result = await Comic.getUserEmoteData(username, comic_id);

//         return res.status(200).json({ reaction: result.reaction });
//     } catch (error) {
//         console.error(error);
//         return next(error);
//     }
// });

router.post("/:comic_id/:userId", async (req, res, next) => {
    try {
        let { comic_id, userId } = req.params;
        let { data } = req.body;
        let { reaction } = data;
        let result = await Comic.createUserEmoteData(userId, comic_id, reaction);
        return res.status(200).json({ message: "Created user emote data successfully!" });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});
// router.post("/:comic_id/:username", async (req, res, next) => {
//     try {
//         let { comic_id, username } = req.params;
//         let { data } = req.body;
//         let { reaction } = data;
//         let result = await Comic.createUserEmoteData(username, comic_id, reaction);
//         return res.status(200).json({ message: "Created user emote data successfully!" });
//     } catch (error) {
//         console.error(error);
//         return next(error);
//     }
// });

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

router.delete("/:comic_id/:username", async (req, res, next) => {
    try {
        let { comic_id, username } = req.params;
        await Comic.deleteUserEmoteData(username, comic_id);
        return res.status(200).json({ message: "Deleted user emote data successfully!" });
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

router.get("/:comic_id/favorite/:username", async (req, res, next) => {
    try {
        let { comic_id, username } = req.params;
        let result = await Comic.checkUserFavorite(comic_id, username);
        return res.status(200).json({ isFavorite: result });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.post("/:comic_id/favorite/:username", async (req, res, next) => {
    try {
        let { comic_id, username } = req.params;
        let result = await Comic.favorite(comic_id, username);
        return res.status(200).json({ message: "User favorited successfully!" });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.delete("/:comic_id/favorite/:username", async (req, res, next) => {
    try {
        let { comic_id, username } = req.params;
        let result = await Comic.deleteFavorite(comic_id, username);
        return res.status(200).json({ message: "Favorite deleted successfully!" });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get("/:comic_id", async (req, res, next) => {
    try {
        let { comic_id } = req.params;
        let result = await Comic.get(comic_id);
        return res.status(200).json({ comic: result });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

module.exports = router;
