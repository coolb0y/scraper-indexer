const http = require("http");
const app = require("./App");

const port = 3333;

const server = http.createServer(app);

server.listen(port);
