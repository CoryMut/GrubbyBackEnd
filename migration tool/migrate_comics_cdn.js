// This code accepts a folder containing images and iterates over the images, uploading each one to my CDN

const path = require("path");
const fs = require("fs");
const resizeImage = require("../helpers/resizeImage");

const directoryPath = path.join(__dirname, process.argv[2]);

const specificFile = process.argv[3] || undefined;

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log("Unable to scan directory: " + err);
    }
    files.forEach(async function (file) {
        if (specificFile === undefined) {
            fs.readFile(`${directoryPath}/${file}`, async function (err, data) {
                if (err) throw err;
                await resizeImage({ data, mimetype: "image/jpg", name: file });
            });
        } else if (specificFile === file) {
            fs.readFile(`${directoryPath}/${file}`, async function (err, data) {
                if (err) throw err;
                await resizeImage({ data, mimetype: "image/jpg", name: file });
            });
        } else {
            return;
        }
    });
});
