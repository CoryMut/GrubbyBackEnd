const express = require("express");
const Comic = require("../models/comic");
const ExpressError = require("../helpers/expressError");

const { checkForCookie } = require("../middleware/auth");
const { verifyCookie } = require("../helpers/token");

const router = new express.Router();

router.get("/comics", checkForCookie, async (req, res, next) => {
    try {
        let isAdmin = res.locals.is_admin;

        if (!isAdmin) {
            throw new ExpressError("Not authorized to view this content, 401");
        }

        let result = await Comic.getAllAdminComics();
        return res.status(200).json({ comics: result });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

module.exports = router;
