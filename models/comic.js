const db = require("../db");
const ExpressError = require("../helpers/expressError");
const moment = require("moment");

class Comic {
    constructor({ id, description, comic_id, name, date_posted }) {
        (this.id = id),
            (this.description = description),
            (this.name = name),
            (this.comic_id = comic_id),
            (this.date_posted = moment(date_posted).format("MMM Do YY"));
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
        const results = await db.query(`SELECT * FROM comics WHERE id = $1`, [id]);

        let comic = results.rows[0];

        if (comic === undefined) {
            throw new ExpressError(`No such comic with id: ${id}`, 404);
        }

        comic = new Comic(comic);

        const companyResults = await db.query("SELECT * FROM companies WHERE handle = $1", [comic.company_handle]);

        comic.company = companyResults.rows[0];

        return comic;
    }

    static async latest() {
        const results = await db.query(`SELECT * FROM comics ORDER BY comic_id desc`);

        let comic = results.rows[0];

        if (comic === undefined) {
            throw new ExpressError(`No comic found.`, 404);
        }

        comic = new Comic(comic);

        return comic;
    }

    static async create(data) {
        console.log(data);
        console.log(data.description);
        const result = await db.query(
            `INSERT INTO comics (comic_id, description, name)
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [data.comic_id, data.description, data.name]
        );

        return result.rows[0];
    }
}

module.exports = Comic;
