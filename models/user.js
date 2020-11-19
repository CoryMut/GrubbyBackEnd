const db = require("../db");
const ExpressError = require("../helpers/expressError");
const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");

class User {
    constructor({ username, email, is_admin }) {
        (this.username = username), (this.email = email), (this.is_admin = is_admin);
    }

    /** find all users. */

    static async all(query) {
        const results = await db.query("SELECT username, email, is_admin FROM users ORDER BY username");

        if (results.length === 0) {
            throw new ExpressError("No users found", 404);
        }

        return results.rows.map((u) => new User(u));
    }

    /** get user. */

    static async get(username) {
        const results = await db.query(`SELECT username, email, is_admin FROM users WHERE username = $1`, [username]);

        const user = results.rows[0];

        if (user === undefined) {
            throw new ExpressError(`No user found with username: ${username}`, 404);
        }

        return new User(user);
    }

    static async checkEmail(email) {
        const results = await db.query(`SELECT username, email, is_admin FROM users WHERE email = $1`, [email]);

        const user = results.rows[0];

        if (user) {
            // throw new ExpressError(`email already in use`, 404);
            return true;
        }

        return false;
    }

    static async register(data) {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const result = await db.query(
            `INSERT INTO users (
					username, password, email) 
			 VALUES ($1, $2, $3) 
			 RETURNING username, email, is_admin`,
            [data.username, hashedPassword, data.email]
        );
        return result.rows[0];
    }

    /** save updated information about a user. */

    static async save(query, values) {
        const result = await db.query(`${query}`, [...values]);
        delete result.rows[0].password;
        return result.rows[0];
    }

    /** Delete a user */

    static async delete(username) {
        const result = await db.query("DELETE FROM users WHERE username = $1 RETURNING *", [username]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No user found with username: ${username}. Could not delete.`, 404);
        }

        return result.rows[0];
    }

    static async authenticate(data) {
        const results = await db.query(
            `
					SELECT username, password, is_admin 
					FROM users WHERE email = $1`,
            [data.email.toLowerCase()]
        );

        const user = results.rows[0];

        if (user) {
            const validUser = await bcrypt.compare(data.password, user.password);
            if (validUser) {
                return { username: user.username, is_admin: user.is_admin };
            } else {
                throw new ExpressError(`Incorrect password`, 401);
            }
        } else {
            throw new ExpressError(`No user exists with email ${data.email}`, 404);
        }
    }
}

module.exports = User;
