const http = require("http");
const WebSocket = require("ws");
const { verifyCookie } = require("./helpers/token");

const app = require("./app");

const httpServer = http.createServer(app);
// const wss = new WebSocket.Server({
//     server: httpServer,
//     path: "/comic/upload",
// });

const wss = new WebSocket.Server({
    server: httpServer,
    path: "/comic/upload",
    verifyClient: async function (info, callback) {
        try {
            console.log(info.req.headers.cookie);
            console.log(info.req.cookies);
            console.log("-----------------------------");
            console.log(info.req);
            console.log("-----------------------------");
            const cookie = info.req.headers.cookie.split("authcookie=")[1];
            console.log("---cookie---", cookie);
            const newCookie = info.req.headers.cookie.match(/authcookie=(.*)/)[1].split(";")[0];
            console.log("---newcookie---", newCookie);

            let result = await verifyCookie(newCookie);
            if (!result) {
                callback(false, 401, "Unauthorized");
            } else {
                callback(true);
            }
        } catch (error) {
            console.log(error);
            callback(false, 401, "Unauthorized");
        }
    },
});

wss.on("connection", function connection(ws) {
    console.log("establish websocket connection");
    app.locals.clients = wss.clients;

    ws.on("message", (message) => {
        console.log("received: %s", message);
    });

    ws.onclose = function (event) {
        console.log("closed ws");
    };
});

module.exports = { httpServer };
