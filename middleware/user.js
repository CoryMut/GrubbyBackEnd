const ExpressError = require("../helpers/expressError");
const User = require("../models/user");
const jsonschema = require("jsonschema");
// const userSchema = require(__basedir + '/schema/userSchema.json');
const userSchema = require("../schema/userSchema.json");
// const userUpdateSchema = require(__basedir + "/schema/userUpdateSchema.json");
const userUpdateSchema = require("../schema/userUpdateSchema.json");
const validator = require("validator");

async function checkForUsername(req, res, next) {
    try {
        if (!req.params) {
            throw new ExpressError("Missing parameters", 400);
        } else {
            const { username } = req.params;
            const user = await User.get(username);

            if (!user) {
                throw new ExpressError(`No user exists with username ${username}`, 404);
            } else {
                res.locals.user = user;
                next();
            }
        }
    } catch (error) {
        console.error(error);
        return next(error);
    }
}

function validateSchema(req, res, next) {
    let result;

    if (req.method === "PATCH") {
        result = jsonschema.validate(req.body, userUpdateSchema);
    } else if (req.method === "POST") {
        result = jsonschema.validate(req.body, userSchema);
    }

    let allErrors = [];

    if (!result.valid) {
        result.errors.map((error) => {
            allErrors.push(new ExpressError(error.stack, 400));
        });
    }

    if (req.body.email) {
        if (!validator.isEmail(req.body.email)) {
            allErrors.push(new ExpressError("email must be a valid email", 400));
        }
    }

    if (req.body.photo_url) {
        if (!validator.isURL(req.body.photo_url)) {
            allErrors.push(new ExpressError("photo_url must be a valid URL", 400));
        }
    }

    if (allErrors.length !== 0) {
        return res.status(400).json({ errors: allErrors });
    } else {
        next();
    }
}

module.exports = { checkForUsername, validateSchema };
