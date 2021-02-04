const db = require("../db");
const ExpressError = require("../helpers/expressError");
const bcrypt = require("bcrypt");
const { makeUniqueString } = require("../helpers/uniqueString");

class User {
    constructor({ username, email, is_admin, display_name }) {
        (this.username = username), (this.email = email), (this.is_admin = is_admin), (this.displayName = display_name);
    }

    static async get(email) {
        const results = await db.query(`SELECT username, is_admin, display_name, id FROM users WHERE email = $1`, [
            email,
        ]);
        const user = results.rows[0];

        if (user === undefined) {
            throw new ExpressError(`No user found with email: ${email}`, 404);
        }

        let { username, is_admin, id, display_name } = user;

        return { username, is_admin, displayName: display_name, id };
    }

    static async getByUsername(userName) {
        const results = await db.query(`SELECT username, is_admin, display_name, id FROM users WHERE username = $1`, [
            userName,
        ]);
        const user = results.rows[0];

        if (user === undefined) {
            throw new ExpressError(`No user found with email: ${email}`, 404);
        }

        let { username, is_admin, id, display_name } = user;

        return { username, is_admin, displayName: display_name, id };
    }

    static async checkEmail(email) {
        const results = await db.query(`SELECT username, email, is_admin, external_login FROM users WHERE email = $1`, [
            email,
        ]);

        const user = results.rows[0];

        if (user) {
            return true;
        }

        return false;
    }

    static async register(data) {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const uniqueString = makeUniqueString();

        const result = await db.query(
            `INSERT INTO users (
					username, password, email, display_name) 
			 VALUES ($1, $2, $3, $4) 
			 RETURNING username, is_admin, id, email`,
            [data.username, hashedPassword, data.email, data.username]
        );
        let { id } = result.rows[0];
        const insertEmailToken = await db.query(
            `INSERT INTO email_tokens (user_id, email_token, email_token_expires) VALUES ($1,$2,$3) RETURNING email_token`,
            [id, uniqueString, Date.now()]
        );
        let user = { ...result.rows[0], ...insertEmailToken.rows[0] };

        return user;
    }

    static async authenticate(data) {
        const results = await db.query(
            `SELECT username, password, is_admin, display_name, email, verified, external_login
			FROM users WHERE email = $1`,
            [data.email.toLowerCase()]
        );

        const user = results.rows[0];

        if (!user) {
            throw new ExpressError(`No user exists with email: ${data.email}`, 404);
        } else if (user.verified === false && user.external_login === false) {
            throw new ExpressError(
                `Unverified email. Please check your email for a verfication link, or resend the email.`,
                400
            );
        } else if (!user.password && user.email) {
            throw new ExpressError("Could not sign you in. You most likely used Login with Google!", 400);
        }

        if (user) {
            const validUser = await bcrypt.compare(data.password, user.password);
            if (validUser) {
                return { username: user.username, is_admin: user.is_admin, displayName: user.display_name };
            } else {
                throw new ExpressError(`Incorrect password`, 401);
            }
        } else {
            throw new ExpressError(`No user exists with email: ${data.email}`, 404);
        }
    }

    static async favorites(username) {
        const results = await db.query(
            `SELECT comics.name, comics.comic_id, comics.description FROM favorites JOIN comics ON favorites.comic_id = comics.comic_id WHERE username = $1;`,
            [username]
        );
        if (results.rows.length === 0) {
            return [];
        } else {
            return results.rows;
        }
    }

    static async register_external_user(data, provider) {
        const organicUser = await db.query(
            `INSERT INTO users (
					username, email, external_login, display_name, verified) 
			 VALUES ($1, $2, $3, $4, $5) 
			 RETURNING *`,
            [data.userId, data.email, true, data.name, true]
        );

        let { id } = organicUser;
        let { provider_id } = await db.query(`SELECT id FROM external_auth_provider WHERE name= $1`, [provider]);

        const result = await db.query(
            `INSERT INTO user_external_login (
					user_account_id, external_auth_provider_id, external_user_id, email) 
			 VALUES ($1, $2, $3, $4) 
			 RETURNING *`,
            [id, provider_id, data.userId, data.email]
        );

        return organicUser.rows[0];
    }

    static async verifyEmailCode(userId, secretCode) {
        async function isVerified() {
            let user = await db.query(`SELECT username, verified FROM users WHERE id = $1`, [userId]);
            let alreadyVerified = user.rows[0].verified;
            if (alreadyVerified) {
                throw new ExpressError("Already verified!", 400);
            } else {
                return user;
            }
        }

        let result = await db.query(
            `SELECT user_id, email_token, email_token_expires FROM email_tokens WHERE email_token = $1 AND user_id = $2`,
            [secretCode, userId]
        );

        let user = await isVerified();

        if (result.rows.length === 0) {
            throw new ExpressError("Invalid code, please request another", 400);
        }

        if (Date.now() - +result.rows[0].email_token_expires > 10800000) {
            throw new ExpressError("Your link has expired! Please request another.", 400);
        }

        return user;
    }

    static async verifyPasswordCode(userId, secretCode) {
        let result = await db.query(
            `SELECT user_id, password_token, password_token_expires FROM password_tokens WHERE password_token = $1 AND user_id = $2`,
            [secretCode, userId]
        );

        if (result.rows.length === 0) {
            throw new ExpressError("Invalid code, please request another", 400);
        }

        if (Date.now() - +result.rows[0].password_token_expires > 3600000) {
            throw new ExpressError("Your link has expired! Please request another.", 400);
        }

        return;
    }

    static async verifyUser(userId) {
        let result = await db.query(`UPDATE users SET verified = true WHERE id = $1 RETURNING username, verified`, [
            userId,
        ]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Unable to verify user`, 400);
        }
        await db.query(`DELETE FROM email_tokens WHERE user_id = $1`, [userId]);
        return;
    }

    static async resendEmail(email) {
        let validUser = await db.query(
            `SELECT username, email, id, verified, external_login FROM users WHERE email = $1`,
            [email]
        );
        if (validUser.rows.length === 0 || validUser === undefined) {
            throw new ExpressError(`No user with email: ${email}.`, 404);
        } else if (validUser.rows[0].verified === true) {
            throw new ExpressError(`User already verified`, 400);
        } else if (validUser.rows[0].external_login === true) {
            throw new ExpressError(`Verification is not needed, you used Login with Google!`, 400);
        }
        const uniqueString = makeUniqueString();
        let { id } = validUser.rows[0];
        await db.query(`UPDATE email_tokens SET email_token = null, email_token_expires = null WHERE user_id = $1`, [
            id,
        ]);
        let updateToken = await db.query(
            `UPDATE email_tokens SET email_token = $1, email_token_expires = $2 WHERE user_id = $3 RETURNING email_token`,
            [uniqueString, Date.now(), id]
        );

        if (updateToken.rows.length === 0) {
            updateToken = await db.query(
                `INSERT INTO email_tokens (user_id, email_token, email_token_expires) VALUES ($1,$2,$3) RETURNING email_token`,
                [id, uniqueString, Date.now()]
            );
        }

        let returnData = {
            username: validUser.rows[0].username,
            id: validUser.rows[0].id,
            email_token: updateToken.rows[0].email_token,
        };

        return returnData;
    }

    static async preparePasswordReset(id) {
        const uniqueString = makeUniqueString();
        await db.query(
            `INSERT INTO password_tokens (user_id, password_token, password_token_expires) VALUES ($1,$2,$3)`,
            [id, uniqueString, Date.now()]
        );
        return uniqueString;
    }

    static async resetPassword(userId, password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        await db.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedPassword, userId]);
        await db.query(`DELETE FROM password_tokens WHERE user_id = $1`, [userId]);

        return;
    }
}

module.exports = User;
