const { OAuth2Client } = require("google-auth-library");
const { GOOGLE_CLIENT_ID } = require("../config");
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const googleAuth = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { sub, email, name } = payload;
        const userId = sub;
        return { userId, email, fullName: name, provider: "Google" };
    } catch (error) {
        return next(error);
    }
};

module.exports = { googleAuth };
