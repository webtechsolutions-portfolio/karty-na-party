const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const registerRoomHandlers = require("./server/room-handlers");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

app.get("/", (_, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/card-packs.js", (_, res) => res.sendFile(path.join(__dirname, "card-packs.js")));
app.get("/round-rules.js", (_, res) => res.sendFile(path.join(__dirname, "round-rules.js")));
app.get("/app.js", (_, res) => res.sendFile(path.join(__dirname, "app.js")));
app.get("/client/custom-deck.js", (_, res) => res.sendFile(path.join(__dirname, "client", "custom-deck.js")));
app.get("/style.css", (_, res) => res.sendFile(path.join(__dirname, "style.css")));
app.get("/health", (_, res) => res.json({ status: "ok" }));

registerRoomHandlers(io);

server.listen(PORT, "0.0.0.0", () =>
  console.log(`Karty na Party listening on :${PORT}`),
);
