process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");

const db = require("../db");

const { makeCookie } = require("../helpers/token");

afterAll(async () => {
    await db.end();
});

describe("GET /comic/latest", function () {
    test("Gets the latest comic", async function () {
        const resp = await request(app).get(`/comic/latest`);
        expect(resp.statusCode).toBe(200);

        expect(resp.body).toEqual({
            comic: {
                id: 1,
                description: "This is a test comic.",
                name: "Test Comic",
                comic_id: 1,
                date_posted: "Dec 3rd 20",
                emotes: {
                    Laughing: "1",
                    Clapping: "0",
                    ROFL: "0",
                    Grinning: "0",
                    Clown: "0",
                },
            },
        });
    });
});

describe("GET /comic/all", function () {
    test("Gets all comic", async function () {
        const resp1 = await request(app).get(`/comic/all`);
        expect(resp1.statusCode).toBe(400);
        const resp2 = await request(app).get(`/comic/all?page=1`);
        expect(resp2.body).toEqual({
            comics: [
                {
                    comic_id: 1,
                    description: "This is a test comic.",
                    name: "Test Comic",
                },
            ],
            count: 1,
        });
    });
});

describe("GET /comic/characters", function () {
    test("Gets all characters", async function () {
        const resp = await request(app).get(`/comic/characters`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ characters: ["Dennis", "Grubby", "Richard"] });
    });
});

describe("POST /comic/upload", function () {
    test("should reject because no cookie", async function () {
        const resp = await request(app).post(`/comic/upload`);
        expect(resp.statusCode).toBe(403);
    });

    test("should accept valid cookie but reject because no file", async function () {
        const cookie = makeCookie("TestUser");
        const resp = await request(app)
            .post(`/comic/upload`)
            .set("Cookie", [`authcookie=${cookie}`]);
        expect(resp.statusCode).toBe(400);
        expect(resp.body).toEqual({ msg: "file is not found" });
    });
});

describe("GET /search", function () {
    test("returns search value", async function () {
        const resp1 = await request(app).get(`/comic/search?searchTerm=Test&page=1`);
        const resp2 = await request(app).get(`/comic/search`);
        const resp3 = await request(app).get(`/comic/search?searchTerm=Test`);
        expect(resp1.statusCode).toBe(200);
        expect(resp2.statusCode).toBe(400);
        expect(resp3.statusCode).toBe(200);
    });
});

describe("GET /:comic_id/:username", function () {
    test("Get user emote data for single comic", async function () {
        const resp = await request(app).get(`/comic/1/Cory`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ reaction: "Laughing" });
    });
});
