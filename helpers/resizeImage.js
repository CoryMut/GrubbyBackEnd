const sharp = require("sharp");
const upload = require("../helpers/DigitalOcean");

const resizeImage = async (image) => {
    let fileSizes = ["320", "384", "512", "683", "800", "960"];

    fileSizes.forEach(async (size) => {
        try {
            let format = image.mimetype;
            let name = image.name;

            let resize = await sharp(image.data)
                .resize({ width: Number(size) })
                .toBuffer();
            await upload(resize, size, format, name);

            return;
        } catch (error) {
            console.log(error);
            return new Error(error);
        }
    });
};

module.exports = resizeImage;
