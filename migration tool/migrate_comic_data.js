// My mentor suggested making a migration tool for converting my old website to this new version

// I think that is a great idea, along with being great advice.

// Here is my attempt

const axios = require("axios");
const cheerio = require("cheerio");

const Comic = require("../models/comic");

// This function uploads all of the data needed for the comics table
// It does not upload the photos to my CDN

(async () => {
    console.log("GETTING INFO");
    let comicInfo = [];
    let result = await axios.get("https://www.grubbythegrape.com/all-comics");
    const $ = cheerio.load(result.data);
    const comics = $("body").find("a.lightbox-grubby img");

    comics.map((comic) => {
        let info = {
            comic_id: "",
            description: "",
            characters: [],
            name: "",
        };

        info["description"] = comics[comic].attribs.alt.match(/\.(.*?)\(/)[1].trim();

        info["characters"] = comics[comic].attribs.alt
            .match(/\((.*?)\)/)[1]
            .trim()
            .split(",");

        info["comic_id"] = comics[comic].attribs.alt.match(/\#(.*?)\./)[1].trim();

        // info["name"] = comics[comic].attribs.alt.match(/[^.]*/)[0];
        info["name"] = comics[comic].parent.attribs.href.match(/Grubby_\d+.jpg/)[0];

        comicInfo.push(info);
    });
    comicInfo.forEach(async (comic) => {
        try {
            await Comic.create(comic);
            return;
        } catch (error) {
            process.exit(1);
        }
    });
})().catch((e) => {
    console.log("INSIDE BIGGEST CATCH");
    console.log(e);
    process.exit(1);
});
