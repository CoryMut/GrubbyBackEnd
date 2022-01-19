const db = require("../db");
const ExpressError = require("../helpers/expressError");
const moment = require("moment");

class Comic {
    constructor({ id, description, comic_id, name, date_posted, emotes }) {
        (this.id = id),
            (this.description = description),
            (this.name = name),
            (this.comic_id = comic_id),
            (this.date_posted = moment(date_posted).format("MMM Do YY")),
            (this.emotes = emotes);
    }

    /** find all comics. */

    static async all(query) {
        let whereClause = [];
        let values = [];
        let finalQuery;

        if (query.search) {
            values.push(`%${query.search}%`);
            whereClause.push(`title ILIKE $${values.length}`);
        }

        const where = `WHERE ${whereClause.join(" AND ")} ORDER BY id`;

        if (whereClause.length === 0) {
            finalQuery = `SELECT * FROM comics ORDER BY id`;
        } else {
            finalQuery = `SELECT * FROM comics ${where}`;
        }

        const results = await db.query(finalQuery, values);

        return results.rows.map((comic) => new Comic(comic));
    }

    /** get comic by id. */

    static async get(id) {
        const results = await db.query(`SELECT * FROM comics WHERE comic_id = $1`, [id]);

        let comic = results.rows[0];

        if (comic === undefined) {
            throw new ExpressError(`No such comic with id: ${id}`, 404);
        }

        const emotes = await Comic.getEmoteData(["Laughing", "Clapping", "ROFL", "Grinning", "Clown"], comic.comic_id);
        comic = { ...comic, emotes: emotes };

        comic = new Comic(comic);

        return comic;
    }

    static async latest() {
        const results = await db.query(`SELECT * FROM comics ORDER BY comic_id desc`);

        let comic = results.rows[0];

        if (comic === undefined) {
            throw new ExpressError(`No comic found.`, 404);
        }

        const emotes = await Comic.getEmoteData(["Laughing", "Clapping", "ROFL", "Grinning", "Clown"], comic.comic_id);
        comic = { ...comic, emotes: emotes };

        comic = new Comic(comic);

        return comic;
    }

    static async create(data, md5) {
        const result = await db
            .query(
                `INSERT INTO comics (comic_id, description, name, vector, hash)
                 VALUES ($1, $2, $3, to_tsvector('english', $2), $4) 
                 RETURNING *`,
                [data.comic_id, data.description, data.name, md5]
            )
            .catch((error) => {
                console.error(error);
                throw new ExpressError("Comic already exists", 400);
            });

        return result.rows[0];
    }

    static async update(comic_id, data) {
        const result = await db.query(
            `UPDATE comics SET name = $1, description = $2, vector = to_tsvector('english', $2)  WHERE comic_id = $3 RETURNING comic_id, description, name, date_posted`,
            [data.name, data.description, comic_id]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`No comic found with comic_id : ${comic_id}`, 404);
        }
        return result.rows[0];
    }

    static async getAllComics(page, arraySort) {
        let offset = (Number(page) - 1) * 20;
        let result;
        if (arraySort === "ASC") {
            result = await db.query(
                `SELECT comic_id, description, name FROM comics ORDER BY comics ASC LIMIT 20 OFFSET $1`,
                [offset]
            );
        } else if (arraySort === "DESC") {
            result = await db.query(
                `SELECT comic_id, description, name FROM comics ORDER BY comics DESC LIMIT 20 OFFSET $1`,
                [offset]
            );
        }

        return result.rows;
    }

    static async getCount() {
        const result = await db.query(`SELECT COUNT(*) FROM comics`);
        return result.rows[0].count;
    }

    static async getAllAdminComics() {
        const result = await db.query(`SELECT comic_id, description, name FROM comics ORDER BY comic_id`);
        return result.rows;
    }

    static async getAllCharacters() {
        const result = await db.query(`SELECT name FROM characters ORDER BY name`);
        return result.rows;
    }

    static async search(searchTerm, page, arraySort) {
        let offset = (Number(page) - 1) * 20;
        let result;
        if (arraySort === "ASC") {
            result = await db.query(
                `SELECT comic_id, description, name, COUNT(*) OVER() AS full_count FROM comics WHERE vector @@ plainto_tsquery($1) ORDER BY comic_id ASC LIMIT 20 OFFSET $2`,
                [searchTerm, offset]
            );
        } else if (arraySort === "DESC") {
            result = await db.query(
                `SELECT comic_id, description, name, COUNT(*) OVER() AS full_count FROM comics WHERE vector @@ plainto_tsquery($1) ORDER BY comic_id DESC LIMIT 20 OFFSET $2`,
                [searchTerm, offset]
            );
        }

        return result.rows;
    }

    static async getEmoteData(emoji, comic_id) {
        let data = {};

        await Promise.all(
            emoji.map(async function (e) {
                let result = await db.query(`SELECT COUNT(*) FROM emoji WHERE comic_id = $1 AND reaction = $2`, [
                    comic_id,
                    e,
                ]);
                data[e] = result.rows[0].count;
            })
        );

        return data;
    }

    static async getUserEmoteData(username, comic_id) {
        let result = await db.query(`SELECT reaction FROM emoji WHERE comic_id = $1 AND username = $2`, [
            comic_id,
            username,
        ]);

        if (result.rows.length === 0) {
            // throw new ExpressError(`No emote data for comic : ${comic_id}`, 404);
            result = { reaction: "" };
        } else {
            result = result.rows[0];
        }

        // return result.rows[0];
        return result;
    }

    static async createUserEmoteData(username, comic_id, reaction) {
        let result = await db.query(`INSERT INTO emoji (username, comic_id, reaction) VALUES ($1,$2,$3) RETURNING *`, [
            username,
            comic_id,
            reaction,
        ]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Error creating user emote data`, 404);
        }

        return result.rows[0];
    }

    static async updateUserEmoteData(username, comic_id, reaction) {
        let result = await db.query(
            `UPDATE emoji SET reaction = $1 WHERE comic_id = $2 AND username = $3 RETURNING *`,
            [reaction, comic_id, username]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Error updating user emote data`, 404);
        }

        return result.rows[0];
    }

    static async deleteUserEmoteData(username, comic_id) {
        await db.query(`DELETE FROM emoji WHERE username = $1 AND comic_id = $2`, [username, comic_id]);
        return;
    }

    static async checkExistingFile(name, md5) {
        let result = await db.query(`SELECT * FROM comics WHERE name = $1 OR hash = $2`, [name, md5]);

        if (result.rows.length !== 0) {
            return result.rows[0];
        } else {
            return false;
        }
    }

    static async deleteAll(comic_id) {
        await db.query(`DELETE FROM comics WHERE comic_id = $1`, [comic_id]);
        return;
    }

    static async deletePartial(comic_id) {
        await db.query(`DELETE FROM comics WHERE comic_id = $1`, [comic_id]);
        return;
    }

    static async favorite(comic_id, username) {
        let result = await db.query(`INSERT INTO favorites (comic_id, username) VALUES ($1, $2) RETURNING *`, [
            comic_id,
            username,
        ]);
        return result.rows[0];
    }

    static async checkUserFavorite(comic_id, username) {
        let result = await db.query(`SELECT * FROM favorites WHERE comic_id = $1 AND username = $2`, [
            comic_id,
            username,
        ]);
        if (result.rows.length !== 0) {
            return true;
        } else {
            return false;
        }
    }

    static async deleteFavorite(comic_id, username) {
        await db.query(`DELETE FROM favorites WHERE comic_id = $1 AND username = $2`, [comic_id, username]);

        return;
    }
}

module.exports = Comic;
