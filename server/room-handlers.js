const crypto = require("crypto");
const CARD_PACKS = require("../card-packs.js");
const RoundRules = require("../round-rules.js");

function registerRoomHandlers(io) {
  const rooms = new Map();
  const RECONNECT_GRACE_MS = 10 * 60 * 1000;

  function publicRoom(room) {
    return {
      code: room.code,
      hostId: room.hostId,
      players: room.players.map(({ id, name, shots, points, ready, connected }) => ({
        id,
        name,
        shots,
        points,
        ready,
        connected,
      })),
      turn: room.turn,
      card: room.card,
      cardIndex: room.cardIndex,
      phase: room.phase,
      votes: room.votes,
      sober: room.sober,
      deckSize: room.deck.length,
      deckId: room.deckId,
      lastResult: room.lastResult,
    };
  }
  function broadcast(room) {
    io.to(room.code).emit("room:state", publicRoom(room));
  }
  function roomError(socket, message) {
    socket.emit("room:error", message);
  }
  function finishVoting(room) {
    if (room.phase !== "voting") return;
    const active = room.players[room.turn % room.players.length];
    if (!active?.connected) return;
    const eligiblePlayers = room.players.filter(
      (player) => player.connected && player.id !== active.id,
    );
    if (!eligiblePlayers.every((player) => room.votes[player.id])) return;
    const yes = eligiblePlayers.filter((player) => room.votes[player.id] === "yes").length;
    const no = eligiblePlayers.length - yes;
    const passed = yes > eligiblePlayers.length / 2;
    const rule = RoundRules.forCardIndex(room.cardIndex);
    let pointsAwarded = 0;
    if (passed) {
      if (rule?.crewPoints) {
        room.players.forEach((player) => (player.points = (player.points || 0) + 1));
        pointsAwarded = 1;
      } else {
        pointsAwarded = rule?.pointValue || 1;
        active.points = (active.points || 0) + pointsAwarded;
      }
    }
    if (!passed && !room.sober && !rule?.safe) active.shots++;
    room.lastResult = {
      passed,
      yes,
      no,
      player: active.name,
      pointsAwarded,
      crewPoints: !!(passed && rule?.crewPoints),
      safeRound: !!rule?.safe,
      ruleId: rule?.id || null,
    };
    room.phase = "result";
  }
  function getPlayer(room, socket) {
    return room.players.find((p) => p.id === socket.id);
  }
  function makeCode() {
    let c;
    do {
      c = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (rooms.has(c));
    return c;
  }

  io.on("connection", (socket) => {
    socket.on("room:create", ({ name, sober, deckId, adultConsent }) => {
      if (socket.data.room) return roomError(socket, "Jesteś już w pokoju.");
      const safeName = String(name || "")
        .trim()
        .slice(0, 18);
      if (!safeName) return roomError(socket, "Wpisz swoje imię.");
      const pack = CARD_PACKS[deckId] || CARD_PACKS.classic;
      if (pack.adult && adultConsent !== true) return roomError(socket, "Host musi potwierdzić 18+ i zgodę na talię.");
      const code = makeCode();
      const room = {
        code,
        hostId: socket.id,
        players: [{ id: socket.id, token: crypto.randomBytes(24).toString("hex"), name: safeName, shots: 0, points: 0, ready: true, connected: true }],
        hostToken: null,
        turn: 0,
        card: null,
        cardIndex: 0,
        phase: "lobby",
        votes: {},
        sober: !!sober,
        deckId: Object.hasOwn(CARD_PACKS, deckId) ? deckId : "classic",
        deck: [...pack.cards].sort(() => Math.random() - 0.5),
        lastResult: null,
      };
      room.hostToken = room.players[0].token;
      rooms.set(code, room);
      socket.data.room = code;
      socket.join(code);
      socket.emit("room:joined", { code, host: true, resumeToken: room.players[0].token });
      broadcast(room);
    });
    socket.on("room:join", ({ code, name }) => {
      if (socket.data.room) return roomError(socket, "Jesteś już w pokoju.");
      code = String(code || "")
        .trim()
        .toUpperCase();
      const room = rooms.get(code);
      const safeName = String(name || "")
        .trim()
        .slice(0, 18);
      if (!safeName)
        return roomError(socket, "Wpisz swoje imię przed dołączeniem.");
      if (!room) return roomError(socket, "Nie znaleziono pokoju o tym kodzie.");
      if (room.phase !== "lobby")
        return roomError(socket, "Ta rozgrywka już trwa.");
      if (room.players.length >= 12)
        return roomError(socket, "Pokój jest pełny (maks. 12 osób).");
      if (
        room.players.some((p) => p.name.toLowerCase() === safeName.toLowerCase())
      )
        return roomError(socket, "Ta nazwa jest już zajęta.");
      const player = { id: socket.id, token: crypto.randomBytes(24).toString("hex"), name: safeName, shots: 0, points: 0, ready: false, connected: true };
      room.players.push(player);
      socket.data.room = code;
      socket.join(code);
      socket.emit("room:joined", { code, host: false, resumeToken: player.token });
      broadcast(room);
    });
    socket.on("room:resume", ({ code, token } = {}) => {
      code = String(code || "").trim().toUpperCase();
      const room = rooms.get(code);
      const player = room?.players.find((candidate) => candidate.token === token);
      if (!room || !player) return socket.emit("room:resume-failed", "Nie znaleziono aktywnej sesji. Pokój mógł wygasnąć.");
      const previousId = player.id;
      const oldSocket = io.sockets.sockets.get(previousId);
      if (oldSocket && oldSocket.id !== socket.id) {
        oldSocket.data.room = null;
        oldSocket.disconnect(true);
      }
      if (room.votes[previousId]) { room.votes[socket.id] = room.votes[previousId]; delete room.votes[previousId]; }
      if (player.expiryTimer) clearTimeout(player.expiryTimer);
      player.expiryTimer = null;
      player.id = socket.id;
      player.connected = true;
      if (player.token === room.hostToken) room.hostId = socket.id;
      else if (!room.players.some((candidate) => candidate.id === room.hostId && candidate.connected)) {
        const replacement = room.players.find((candidate) => candidate.connected);
        if (replacement) room.hostId = replacement.id;
      }
      socket.data.room = code;
      socket.join(code);
      socket.emit("room:joined", { code, host: player.token === room.hostToken, resumeToken: player.token, resumed: true });
      if (room.phase === "voting") finishVoting(room);
      broadcast(room);
      socket.emit("room:notice", "Połączono ponownie z tym samym pokojem.");
    });
    socket.on("room:ready", ({ ready, adultConsent } = {}) => {
      const room = rooms.get(socket.data.room);
      if (!room || room.phase !== "lobby" || typeof ready !== "boolean") return;
      const player = getPlayer(room, socket);
      if (!player || player.id === room.hostId) return;
      if (ready && CARD_PACKS[room.deckId].adult && adultConsent !== true) return roomError(socket, "Potwierdź, że masz 18+ i zgadzasz się na tę talię.");
      player.ready = ready;
      broadcast(room);
    });
    socket.on("game:start", () => {
      const room = rooms.get(socket.data.room);
      if (!room || room.hostId !== socket.id || room.phase !== "lobby") return;
      const connectedPlayers = room.players.filter((player) => player.connected);
      if (connectedPlayers.length < 2)
        return roomError(socket, "Dołączcie co najmniej 2 osoby.");
      if (connectedPlayers.some((player) => player.id !== room.hostId && !player.ready))
        return roomError(socket, "Wszyscy gracze muszą zgłosić gotowość.");
      room.phase = "playing";
      room.turn = 0;
      room.card = null;
      room.cardIndex = 0;
      room.players.forEach((p) => { p.shots = 0; p.points = 0; });
      broadcast(room);
    });
    socket.on("game:draw", () => {
      const room = rooms.get(socket.data.room);
      if (!room || room.phase !== "playing" || room.card) return;
      if (room.players[room.turn % room.players.length].id !== socket.id)
        return roomError(socket, "Teraz kolej innego gracza.");
      if (room.cardIndex >= room.deck.length) {
        room.deck = [...CARD_PACKS[room.deckId].cards].sort(() => Math.random() - 0.5);
        room.cardIndex = 0;
      }
      room.card = room.deck[room.cardIndex];
      room.phase = "voting";
      room.votes = {};
      room.lastResult = null;
      broadcast(room);
    });
    socket.on("game:vote", (vote) => {
      const room = rooms.get(socket.data.room);
      if (!room || room.phase !== "voting") return;
      if (room.players[room.turn % room.players.length].id === socket.id)
        return roomError(socket, "Osoba wykonująca zadanie nie głosuje.");
      if (vote !== "yes" && vote !== "no") return;
      room.votes[socket.id] = vote;
      finishVoting(room);
      broadcast(room);
    });
    socket.on("game:pass", () => {
      const room = rooms.get(socket.data.room);
      if (!room || room.phase !== "voting") return;
      const active = room.players[room.turn % room.players.length];
      if (active.id !== socket.id) return roomError(socket, "Tylko aktywny gracz może pominąć kartę.");
      room.lastResult = { passed: true, skipped: true, yes: 0, no: 0, player: active.name };
      room.phase = "result";
      broadcast(room);
    });
    socket.on("game:next", () => {
      const room = rooms.get(socket.data.room);
      if (!room || room.hostId !== socket.id || room.phase !== "result") return;
      room.turn++;
      room.cardIndex++;
      room.card = null;
      room.votes = {};
      room.phase = "playing";
      broadcast(room);
    });
    socket.on("room:cancel", () => {
      const room = rooms.get(socket.data.room);
      if (!room || room.hostId !== socket.id || room.phase !== "lobby") return;
      rooms.delete(room.code);
      for (const player of room.players) {
        if (player.expiryTimer) clearTimeout(player.expiryTimer);
        const memberSocket = io.sockets.sockets.get(player.id);
        if (!memberSocket) continue;
        memberSocket.data.room = null;
        memberSocket.emit("room:cancelled");
        memberSocket.leave(room.code);
      }
    });
    socket.on("game:end", () => {
      const room = rooms.get(socket.data.room);
      if (
        !room ||
        room.hostId !== socket.id ||
        !["playing", "voting", "result"].includes(room.phase)
      )
        return;
      rooms.delete(room.code);
      for (const player of room.players) {
        if (player.expiryTimer) clearTimeout(player.expiryTimer);
        const memberSocket = io.sockets.sockets.get(player.id);
        if (!memberSocket) continue;
        memberSocket.data.room = null;
        memberSocket.emit("room:ended");
        memberSocket.leave(room.code);
      }
    });
    socket.on("room:leave", () => leave(socket));
    socket.on("disconnect", () => suspend(socket));
  });
  function suspend(socket) {
    const code = socket.data.room;
    if (!code) return;
    socket.data.room = null;
    const room = rooms.get(code);
    const player = room?.players.find((candidate) => candidate.id === socket.id);
    if (!room || !player) return;
    player.connected = false;
    player.expiryTimer = setTimeout(() => removePlayer(room, player, true), RECONNECT_GRACE_MS);
    if (player.id === room.hostId) {
      const replacement = room.players.find((candidate) => candidate.connected);
      if (replacement) room.hostId = replacement.id;
    }
    if (room.phase === "voting") finishVoting(room);
    broadcast(room);
  }
  function leave(socket) {
    const code = socket.data.room;
    if (!code) return;
    socket.data.room = null;
    const room = rooms.get(code);
    const player = room?.players.find((candidate) => candidate.id === socket.id);
    if (room && player) removePlayer(room, player, false);
  }
  function removePlayer(room, player, expired) {
    if (player.expiryTimer) clearTimeout(player.expiryTimer);
    const wasActive = room.players[room.turn % room.players.length]?.token === player.token;
    const leavingIndex = room.players.indexOf(player);
    const activeIndex = room.turn % room.players.length;
    room.players = room.players.filter((candidate) => candidate !== player);
    if (!room.players.length) {
      rooms.delete(room.code);
      return;
    }
    if (!wasActive && leavingIndex < activeIndex) room.turn = Math.max(0, room.turn - 1);
    delete room.votes[player.id];
    if (room.hostToken === player.token) {
      const replacement = room.players.find((candidate) => candidate.connected) || room.players[0];
      room.hostToken = replacement.token;
      room.hostId = replacement.id;
    } else if (room.hostId === player.id) {
      const replacement = room.players.find((candidate) => candidate.connected) || room.players[0];
      room.hostId = replacement.id;
    }
    if (wasActive && room.phase === "voting") {
      room.phase = "playing";
      room.card = null;
      room.votes = {};
      room.lastResult = null;
      io.to(room.code).emit("room:notice", "Aktywny gracz opuścił pokój. Tura została pominięta.");
    } else if (room.phase === "voting") finishVoting(room);
    if (expired) io.to(room.code).emit("room:notice", `${player.name} nie wrócił(a) w ciągu 10 minut i opuścił(a) pokój.`);
    broadcast(room);
  }

}

module.exports = registerRoomHandlers;
