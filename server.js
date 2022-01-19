/** Start server for jobly. */

// const app = require("./app");
const { httpServer } = require("./websocket");
const { PORT } = require("./config");

// app.listen(PORT, function() {
//   console.log(`Server starting on port ${PORT}!`);
// });

httpServer.listen(PORT, function () {
    console.log(`Server starting on port ${PORT}!`);
});
