const Comic = require("../models/comic");
const ExpressError = require("./expressError");

const validateFile = async (file) => {
    try {
        let { name, md5 } = file;
        let result = await Comic.checkExistingFile(name, md5);

        if (result) {
            throw new ExpressError(`This file has previously been uploaded under the name ${result.name}`, 409);
        } else {
            return;
        }
    } catch (error) {
        throw new ExpressError(error.message, error.status);
    }
};

module.exports = validateFile;
