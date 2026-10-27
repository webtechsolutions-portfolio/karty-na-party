const $ = (q) => document.querySelector(q);
const screens = [...document.querySelectorAll(".screen")];
const players = [];
const CARD_PACKS = window.CARD_PACKS;
let selectedDeckId = "classic";
const cards = CARD_PACKS.classic.cards;
const roomSessionStorageKey = "karty-na-party.room-session.v1";
function getSavedRoomSession() {
  try {
    return JSON.parse(localStorage.getItem(roomSessionStorageKey) || "null");
  } catch {
    return null;
  }
}
function clearSavedRoomSession() {
  localStorage.removeItem(roomSessionStorageKey);
}
const customDeck = window.createCustomDeck({ $, escapeHtml, notify, onChange: updateDeckInfo });
const customCards = customDeck.cards;
let turn = 0,
  deck = [],
  cardIndex = 0,
  flipped = false,
  sound = true,
  waiting = false;
let selectedMode = "local",
  socket = null,
  onlineRoom = null,
  myPlayerId = null,
  isHost = false,
  lastResultKey = "";
const colors = [
  "#f5c85d",
  "#8bd7ca",
  "#e88fc0",
  "#9ba8f5",
  "#ff8e62",
  "#b8d889",
  "#efb36a",
  "#87c6eb",
  "#dda3f2",
  "#ef8791",
  "#8bddb0",
  "#f4d07c",
];
function showScreen(id) {
  screens.forEach((s) => s.classList.toggle("active", s.id === id));
  window.scrollTo(0, 0);
}
document.querySelectorAll("[data-back]").forEach((b) =>
  b.addEventListener("click", () => {
    if (b.dataset.back === "homeScreen" && onlineRoom && socket) {
      socket.disconnect();
      socket = null;
      onlineRoom = null;
      isHost = false;
      lastResultKey = "";
      onlineStatus(
        "Pokój zapamiętany. Wróć w ciągu 10 minut, aby kontynuować.",
      );
    }
    showScreen(b.dataset.back);
  }),
);
$("#startButton").addEventListener("click", () => {
  showScreen("setupScreen");
  const savedSession = getSavedRoomSession();
  if (savedSession?.code && savedSession?.token)
    document.querySelector(".mode-tab[data-mode=online]").click();
});
function validateDeckConsent() {
  if (CARD_PACKS[selectedDeckId].adult && !$("#adultConsent").checked) {
    notify("Potwierdź 18+ i zgodę na talię dla wszystkich graczy.");
    return false;
  }
  return true;
}
function updateDeckInfo() {
  const pack = CARD_PACKS[selectedDeckId];
  $("#deckDescription").textContent = pack.description;
  const title = $("#deckTitle");
  if (title) title.textContent = `TALIA ${pack.name.toLocaleUpperCase()}`;
  const count =
    pack.cards.length + (selectedMode === "local" ? customCards.length : 0);
  const deckSize = $("#deckSize");
  if (deckSize) deckSize.textContent = String(count);
  const subtitle = $("#deckSubtitle");
  if (subtitle) subtitle.textContent = `${count} pytań i wyzwań`;
}
function addPlayer() {
  const input = $("#playerName"),
    name = input.value.trim();
  if (!name) return;
  if (players.length >= 12) {
    notify("Maksymalnie 12 graczy.");
    return;
  }
  if (
    players.some((p) => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())
  ) {
    notify("Ta nazwa jest już na liście.");
    return;
  }
  players.push({
    name,
    shots: 0,
    color: colors[players.length % colors.length],
  });
  input.value = "";
  renderPlayers();
  input.focus();
}
function renderPlayers() {
  $("#playerCount").textContent = `${players.length} / 12`;
  $("#playerList").innerHTML = players
    .map(
      (p, i) =>
        `<span class="player-chip"><i class="chip-dot" style="background:${p.color}"></i>${escapeHtml(p.name)}<button data-remove="${i}" aria-label="Usuń ${escapeHtml(p.name)}">×</button></span>`,
    )
    .join("");
  document.querySelectorAll("[data-remove]").forEach(
    (b) =>
      (b.onclick = () => {
        players.splice(Number(b.dataset.remove), 1);
        renderPlayers();
      }),
  );
  $("#beginGame").disabled =
    players.length < 2 ||
    (CARD_PACKS[selectedDeckId].adult && !$("#adultConsent").checked);
  $(".min-players").textContent =
    players.length < 2
      ? "MINIMUM 2 GRACZY"
      : `${players.length} GRACZY GOTOWYCH`;
}
function escapeHtml(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
$("#addPlayer").onclick = addPlayer;
$("#playerName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPlayer();
});
function startGame() {
  if (players.length < 2) return;
  if (!validateDeckConsent()) return;
  deck = shuffleCards([
    ...CARD_PACKS[selectedDeckId].cards,
    ...customCards.map((card) => [
      card.type,
      card.type === "PYTANIE" ? "♥" : "♣",
      card.text,
    ]),
  ]);
  cardIndex = 0;
  turn = 0;
  players.forEach((p) => { p.shots = 0; p.points = 0; });
  showScreen("gameScreen");
  updateGame();
  resetCard();
  $("#rulesModal").classList.add("open");
}
$("#beginGame").onclick = () => {
  if (selectedMode === "local") startGame();
  else if (isHost && socket) socket.emit("game:start");
};
function updateGame() {
  if (selectedMode === "online" && onlineRoom) return renderOnlineGame();
  renderRoundRuleBanner(cardIndex);
  const p = players[turn % players.length];
  $("#currentPlayer").textContent = p.name;
  $("#turnAvatar").textContent = [...p.name][0].toLocaleUpperCase();
  $("#turnAvatar").style.background = p.color;
  $("#turnCount").textContent = String(
    Math.floor(turn / players.length) + 1,
  ).padStart(2, "0");
  $("#roundCount").textContent =
    `RUNDA ${String(Math.floor(turn / players.length) + 1).padStart(2, "0")}`;
  $("#deckRemaining").innerHTML = `${deck.length - cardIndex}<br>W TALII` + "";
  $("#progressText").textContent =
    `KARTA ${String(cardIndex + 1).padStart(2, "0")} / ${deck.length}`;
  $("#scoreList").innerHTML = players
    .map(
      (x, i) =>
        `<div class="score-player ${i === turn % players.length ? "current" : ""}"><b>${escapeHtml(x.name)}</b><small>🥃 ${x.shots} SHOTY</small><span class="score-number">${x.points || 0}</span></div>`,
    )
    .join("");
  $("#decisionArea").innerHTML =
    '<button id="drawCard" class="primary-button full">DOBIERZ KARTĘ <span>↗</span></button>';
  $("#drawCard").onclick = drawCard;
  $("#tableHint").textContent = "DOTKNIJ KARTY, ABY ZACZĄĆ";
  waiting = false;
  flipped = false;
  $("#playingCard").classList.remove("flipped");
}
function resetCard() {
  updateGame();
}
function renderRoundRuleBanner(index) {
  const rule = RoundRules.forCardIndex(index);
  const banner = $("#roundRuleBanner");
  banner.hidden = !rule;
  if (!rule) return;
  $("#roundRuleTitle").textContent = rule.title;
  $("#roundRuleDescription").textContent = rule.description;
}
function drawCard() {
  if (waiting) return;
  if (cardIndex >= deck.length) {
    deck = shuffleCards([
      ...CARD_PACKS[selectedDeckId].cards,
      ...customCards.map((card) => [
        card.type,
        card.type === "PYTANIE" ? "♥" : "♣",
        card.text,
      ]),
    ]);
    cardIndex = 0;
    notify("Nowa talia przetasowana!");
  }
  const [type, suit, text] = deck[cardIndex];
  $("#questionType").textContent = type;
  $("#questionSuit").textContent = suit;
  $("#questionText").textContent = text;
  $("#playingCard").classList.add("flipped");
  flipped = true;
  waiting = true;
  $("#tableHint").textContent =
    type === "PYTANIE" ? "ODPOWIEDZ SZCZERZE" : "WYKONAJ WYZWANIE";
  $("#decisionArea").innerHTML =
    `<div class="decision-buttons"><button class="success-btn" id="successBtn">✳ UDAŁO SIĘ</button><button class="penalty-btn" id="penaltyBtn">SHOT 🥃</button><button class="skip-btn" id="skipBtn">POMIŃ KARTĘ · BEZ KARY</button></div>`;
  $("#successBtn").onclick = () => finishTurn(true);
  $("#penaltyBtn").onclick = () => finishTurn(false);
  $("#skipBtn").onclick = () => finishTurn(null);
  $("#playingCard").onclick = () => {
    if (!flipped) drawCard();
  };
}
function shuffleCards(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}
function finishTurn(success) {
  if (!waiting) return;
  const sober = $("#soberMode").checked;
  const player = players[turn % players.length];
  const rule = RoundRules.forCardIndex(cardIndex);
  if (success === true) {
    if (rule?.crewPoints) players.forEach((entry) => (entry.points = (entry.points || 0) + 1));
    else player.points = (player.points || 0) + (rule?.pointValue || 1);
  }
  if (success === false && !sober && !rule?.safe) player.shots++;
  cardIndex++;
  $("#resultEyebrow").textContent =
    success === true
      ? "WERDYKT EKIPY"
      : success === null
        ? "BEZ KAR"
        : "WERDYKT EKIPY";
  $("#resultTitle").textContent =
    success === true
      ? rule?.crewPoints
        ? "Ekipa zalicza!"
        : rule?.pointValue === 2
          ? "Podwójne punkty!"
          : "Pięknie rozegrane!"
      : success === null
        ? "Karta pominięta"
        : rule?.safe
          ? "Bezpieczna runda!"
        : sober
          ? "Czas na wodę!"
          : "Shot na koncie!";
  $("#resultDescription").textContent =
    success === true
      ? rule?.crewPoints
        ? `${player.name}, ekipa zalicza kartę — każdy dostaje punkt. Kolejna karta czeka.`
        : `${player.name}, ekipa uznała odpowiedź. +${rule?.pointValue || 1} pkt.`
      : success === null
        ? `${player.name}, karta pominięta bez kary. Podaj telefon dalej.`
        : rule?.safe
          ? `${player.name}, to bezpieczna runda — shot nie został doliczony.`
        : sober
          ? `${player.name}, wybierz wodę lub sok. Licznik shotów pozostaje bez zmian.`
          : `${player.name}, shot doliczony. Masz już ${player.shots}.`;
  const actions = $("#resultActions");
  actions.innerHTML =
    '<button class="primary-button full" id="nextTurn">DALEJ, NASTĘPNA OSOBA <span>↗</span></button>';
  $("#resultModal").classList.add("open");
  $("#nextTurn").onclick = () => {
    $("#resultModal").classList.remove("open");
    turn++;
    updateGame();
  };
  if (success === true) burst();
}
function burst() {
  const b = $(".result-burst");
  b.style.animation = "none";
  void b.offsetWidth;
  b.style.animation = "";
}
function notify(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}
$("#playingCard").onclick = () => {
  if (selectedMode === "online") {
    if (
      onlineRoom &&
      onlineRoom.phase === "playing" &&
      onlineRoom.players[onlineRoom.turn % onlineRoom.players.length].id ===
        myPlayerId
    )
      socket.emit("game:draw");
    return;
  }
  if (!flipped) drawCard();
};
$("#quitGame").onclick = () => {
  const exitPrompt =
    selectedMode === "online"
      ? "Wyjść z gry? Pokój i postęp będą dostępne przez 10 minut po rozłączeniu."
      : "Opuścić rozgrywkę?";
  if (confirm(exitPrompt)) {
    if (selectedMode === "online" && socket) {
      socket.disconnect();
      socket = null;
      isHost = false;
      lastResultKey = "";
      hideRoomCode();
      $("#createRoom").style.display = "";
      $("#createRoom").textContent = "UTWÓRZ POKÓJ ↗";
      $("#createRoom").onclick = createRoom;
      $(".join-row").style.display = "";
      $("#onlineName").disabled = false;
      $("#beginGame").style.display = "";
      $("#beginGame").hidden = true;
      $("#setupPanelTitle").textContent = "GRAJ Z EKIPĄ";
      $("#playerList").innerHTML = "";
      $("#playerCount").textContent = "POKÓJ";
      onlineStatus(
        "Pokój zapamiętany. Wróć w ciągu 10 minut, aby kontynuować.",
      );
    }
    onlineRoom = null;
    showScreen("homeScreen");
  }
};
$("#rulesButton").onclick = () => $("#rulesModal").classList.add("open");
$("#closeRules").onclick = $("#okRules").onclick = () =>
  $("#rulesModal").classList.remove("open");
$("#soundToggle").onclick = (e) => {
  sound = !sound;
  e.currentTarget.innerHTML = sound
    ? "♫ <span>DŹWIĘK</span>"
    : "♫ <span>WYCISZONO</span>";
  notify(sound ? "Dźwięk włączony" : "Dźwięk wyciszony");
};

function ensureSocket() {
  if (socket) return socket;
  if (!window.io) {
    notify("Brak połączenia z serwerem. Uruchom aplikację przez npm start.");
    return null;
  }
  socket = io();
  socket.on("connect", () => {
    myPlayerId = socket.id;
    const savedSession = getSavedRoomSession();
    if (savedSession?.code && savedSession?.token) {
      onlineStatus("Odnawianie połączenia z pokojem…");
      socket.emit("room:resume", savedSession);
    } else onlineStatus("Połączono z serwerem.");
  });
  socket.on("room:joined", (d) => {
    isHost = d.host;
    if (d.resumeToken)
      localStorage.setItem(
        roomSessionStorageKey,
        JSON.stringify({
          code: d.code,
          token: d.resumeToken,
          name: $("#onlineName").value.trim(),
        }),
      );
    showRoomCode(d.code);
    onlineStatus(
      `Kod pokoju: ${d.code} · ${isHost ? "Jesteś hostem" : "Dołączono do gry"}`,
    );
  });
  socket.on("room:state", (r) => {
    onlineRoom = r;
    selectedDeckId = CARD_PACKS[r.deckId] ? r.deckId : "classic";
    $("#deckSelect").value = selectedDeckId;
    $("#deckSelect").disabled = true;
    updateDeckInfo();
    $("#adultConsentRow").hidden = !CARD_PACKS[selectedDeckId].adult;
    showRoomCode(r.code);
    isHost = r.hostId === myPlayerId;
    if (
      CARD_PACKS[selectedDeckId].adult &&
      !isHost &&
      !onlineRoom.players.find((p) => p.id === myPlayerId)?.ready
    )
      $("#adultConsent").checked = false;
    players.splice(
      0,
      players.length,
      ...r.players.map((p, i) => ({ ...p, color: colors[i % colors.length] })),
    );
    $("#playerCount").textContent = `${players.length} / 12`;
    if (r.phase === "lobby") {
      showScreen("setupScreen");
      $("#setupPanelTitle").textContent = `POKÓJ ${r.code}`;
      $("#playerList").innerHTML = players
        .map(
          (p) =>
            `<span class="player-chip ${p.connected === false ? "player-disconnected" : ""}"><i class="chip-dot" style="background:${p.color}"></i>${escapeHtml(p.name)}<small class="player-ready-badge ${p.connected === false ? "offline" : p.id === r.hostId ? "host" : p.ready ? "ready" : ""}">${p.connected === false ? "OFFLINE" : p.id === r.hostId ? "HOST" : p.ready ? "GOTOWY" : "CZEKA"}</small></span>`,
        )
        .join("");
      $("#createRoom").style.display = "none";
      $(".join-row").style.display = "none";
      $("#onlineName").disabled = true;
      const connectedPlayers = players.filter(
        (player) => player.connected !== false,
      );
      const readyCount = connectedPlayers.filter(
        (player) => player.id === r.hostId || player.ready,
      ).length;
      const allReady =
        connectedPlayers.length >= 2 && readyCount === connectedPlayers.length;
      const currentPlayer = players.find((player) => player.id === myPlayerId);
      $("#readinessPanel").hidden = false;
      $("#readinessStatus").textContent = isHost
        ? `${readyCount} / ${connectedPlayers.length} połączonych graczy gotowych. ${allReady ? "Możesz rozpocząć grę." : "Czekamy na gotowość ekipy."}`
        : currentPlayer?.ready
          ? "Gotowość zgłoszona. Czekamy na pozostałych graczy i hosta."
          : "Zgłoś gotowość, aby host mógł rozpocząć grę.";
      $("#readyButton").hidden = isHost;
      $("#readyButton").textContent = currentPlayer?.ready
        ? "COFNIJ GOTOWOŚĆ"
        : "JESTEM GOTOWY ✓";
      $("#readyButton").classList.toggle("is-ready", !!currentPlayer?.ready);
      $("#beginGame").style.display = isHost ? "flex" : "none";
      $("#beginGame").disabled = !allReady;
      $("#beginGame").textContent = "ROZPOCZNIJ GRĘ ↗";
      $(".min-players").textContent = isHost
        ? `Host rozpocznie grę, gdy wszyscy połączeni gracze zgłoszą gotowość. Rozłączonych można przywrócić przez ponowne otwarcie gry.`
        : "Połączono z pokojem hosta.";
    } else {
      $("#readinessPanel").hidden = true;
      $("#beginGame").style.display = "none";
      showScreen("gameScreen");
      renderOnlineGame();
    }
  });
  socket.on("room:error", (m) => onlineStatus(m));
  socket.on("room:resume-failed", (message) => {
    const savedSession = getSavedRoomSession();
    clearSavedRoomSession();
    if (savedSession?.code) $("#roomCodeInput").value = savedSession.code;
    if (savedSession?.name) $("#onlineName").value = savedSession.name;
    document.querySelector(".mode-tab[data-mode=online]").click();
    showScreen("setupScreen");
    onlineStatus(message + " Możesz dołączyć ponownie kodem pokoju.");
  });
  socket.on("room:notice", (m) => notify(m));
  socket.on("disconnect", () =>
    onlineStatus("Utracono połączenie. Łączenie ponownie…"),
  );
  return socket;
}
function onlineStatus(t) {
  const e = $("#onlineStatus");
  if (e) e.textContent = t;
}
function showRoomCode(code) {
  $("#roomCodeValue").textContent = code;
  $("#gameRoomCode").textContent = code;
  $("#roomSharePanel").hidden = false;
  $("#gameRoomShare").hidden = false;
}
function hideRoomCode() {
  $("#roomSharePanel").hidden = true;
  $("#gameRoomShare").hidden = true;
}
async function copyRoomCode() {
  const code = onlineRoom?.code || $("#roomCodeValue").textContent.trim();
  if (!code || code === "------") return;
  try {
    if (!navigator.clipboard?.writeText)
      throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(code);
    notify("Kod pokoju skopiowany.");
  } catch {
    notify("Kod pokoju: " + code);
  }
}
async function shareRoomCode() {
  const code = onlineRoom?.code || $("#roomCodeValue").textContent.trim();
  if (!code || code === "------") return;
  const inviteUrl = getRoomInviteUrl(code);
  if (!navigator.share) {
    const valueToCopy = inviteUrl || code;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(valueToCopy);
      notify(
        inviteUrl
          ? "Link do pokoju skopiowany. Wklej go w Messengerze."
          : "Kod skopiowany. Możesz wkleić go w Messengerze.",
      );
    } catch {
      notify(
        inviteUrl ? "Link do pokoju: " + inviteUrl : "Kod pokoju: " + code,
      );
    }
    return;
  }
  try {
    const invitation = {
      title: "Karty na Party",
      text: inviteUrl
        ? "Dołącz do mojej gry w Karty na Party! Otwórz link i wpisz swoje imię."
        : "Dołącz do mojej gry w Karty na Party! Kod pokoju: " + code,
    };
    if (inviteUrl) invitation.url = inviteUrl;
    await navigator.share(invitation);
  } catch (error) {
    if (error.name !== "AbortError") {
      if (inviteUrl && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(inviteUrl);
          notify("Link do pokoju skopiowany. Wklej go w Messengerze.");
        } catch {
          notify("Link do pokoju: " + inviteUrl);
        }
      } else {
        await copyRoomCode();
      }
    }
  }
}
function getRoomInviteUrl(code) {
  if (
    !["http:", "https:"].includes(window.location.protocol) ||
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
  )
    return null;
  const inviteUrl = new URL(window.location.pathname, window.location.origin);
  inviteUrl.searchParams.set("room", code);
  return inviteUrl.toString();
}
function openRoomInvite() {
  const savedSession = getSavedRoomSession();
  if (savedSession?.code && savedSession?.token) {
    document.querySelector(".mode-tab[data-mode=online]").click();
    showScreen("setupScreen");
    onlineStatus("Wznawiam ostatni pokój…");
    ensureSocket();
    return;
  }
  const code = new URLSearchParams(window.location.search).get("room");
  if (!code || !/^[A-Z0-9]{6}$/i.test(code)) return;
  document.querySelector('.mode-tab[data-mode="online"]').click();
  $("#roomCodeInput").value = code.toUpperCase();
  onlineStatus("Wpisz swoje imię i dołącz do pokoju.");
  showScreen("setupScreen");
}
function renderOnlineGame() {
  const r = onlineRoom;
  if (!r) return;
  showRoomCode(r.code);
  renderRoundRuleBanner(r.cardIndex);
  const active = r.players[r.turn % r.players.length];
  $("#currentPlayer").textContent = active.name;
  $("#turnAvatar").textContent = [...active.name][0].toUpperCase();
  $("#turnAvatar").style.background = active.color;
  $("#turnCount").textContent = String(
    Math.floor(r.turn / r.players.length) + 1,
  ).padStart(2, "0");
  $("#roundCount").textContent = `POKÓJ ${r.code}`;
  $("#deckRemaining").innerHTML = `${r.deckSize - r.cardIndex}<br>W TALII`;
  $("#progressText").textContent =
    `KARTA ${String(r.cardIndex + 1).padStart(2, "0")} / ${r.deckSize}`;
  $("#scoreList").innerHTML = r.players
    .map(
      (x, i) =>
        `<div class="score-player ${i === r.turn % r.players.length ? "current" : ""}"><b>${escapeHtml(x.name)}</b><small>🥃 ${x.shots} SHOTY</small><span class="score-number">${x.points || 0}</span></div>`,
    )
    .join("");
  const card = $("#playingCard");
  if (r.card) {
    $("#questionType").textContent = r.card[0];
    $("#questionSuit").textContent = r.card[1];
    $("#questionText").textContent = r.card[2];
    card.classList.add("flipped");
    flipped = true;
  } else {
    card.classList.remove("flipped");
    flipped = false;
  }
  const amActive = active.id === myPlayerId;
  $("#decisionArea").innerHTML = "";
  if (r.phase === "playing") {
    $("#tableHint").textContent = amActive
      ? "TWOJA KOLEJ · ODKRYJ KARTĘ"
      : "OBSERWUJ GRACZA · GŁOSUJ PO JEGO ODPOWIEDZI";
    if (amActive)
      $("#decisionArea").innerHTML =
        '<button id="drawCard" class="primary-button full">DOBIERZ KARTĘ <span>↗</span></button>';
    const b = $("#drawCard");
    if (b) b.onclick = () => socket.emit("game:draw");
  }
  if (r.phase === "voting") {
    const voted = Object.hasOwn(r.votes, myPlayerId);
    const ys = Object.values(r.votes).filter((v) => v === "yes").length,
      ns = Object.values(r.votes).filter((v) => v === "no").length;
    $("#tableHint").textContent = amActive
      ? "TWOJA ODPOWIEDŹ · EKIPA GŁOSUJE"
      : `GŁOSOWANIE · ${ys} ZA / ${ns} PRZECIW`;
    if (amActive)
      $("#decisionArea").innerHTML =
        '<button class="skip-btn full-skip" id="passCard">POMIŃ KARTĘ · BEZ KARY</button>';
    else if (!voted)
      $("#decisionArea").innerHTML =
        '<div class="decision-buttons"><button class="success-btn" id="voteYes">✓ ZALICZ</button><button class="penalty-btn" id="voteNo">✕ NIE ZALICZ</button></div>';
    else if (!amActive)
      $("#decisionArea").innerHTML =
        '<div class="vote-wait">✳ GŁOS ODDANY · CZEKAJ NA RESZTĘ EKIPY</div>';
    else
      $("#decisionArea").innerHTML =
        '<div class="vote-wait">EKIPA GŁOSUJE…</div>';
    const passCard = $("#passCard");
    if (passCard) passCard.onclick = () => socket.emit("game:pass");
    const yes = $("#voteYes"),
      no = $("#voteNo");
    if (yes) yes.onclick = () => socket.emit("game:vote", "yes");
    if (no) no.onclick = () => socket.emit("game:vote", "no");
  }
  if (r.phase === "result") {
    const key = `${r.code}:${r.cardIndex}:${r.lastResult?.passed}:${r.lastResult?.skipped}`;
    $("#tableHint").textContent = "WERDYKT EKIPY";
    if (key !== lastResultKey) {
      lastResultKey = key;
      const x = r.lastResult;
      $("#resultEyebrow").textContent = x.skipped
        ? "KARTA POMINIĘTA · BEZ KARY"
        : `WYNIK GŁOSOWANIA · ${x.yes} ZA / ${x.no} PRZECIW`;
      $("#resultTitle").textContent = x.skipped
        ? "Bez presji — gramy dalej"
        : x.passed
          ? x.crewPoints
            ? "Ekipa zalicza!"
            : x.pointsAwarded > 1
              ? `Podwójne punkty dla ${x.player}!`
              : "Ekipa zalicza!"
          : x.safeRound
            ? "Bezpieczna runda!"
          : r.sober
            ? "Czas na wodę!"
            : "Shot na koncie!";
      $("#resultDescription").textContent = x.skipped
        ? `${x.player} pomija tę kartę. Nie ma kary ani głosowania.`
        : x.passed
          ? x.crewPoints
            ? `${x.player}, ekipa zalicza kartę — każdy dostaje punkt.`
            : `${x.player}, większość uznała odpowiedź. +${x.pointsAwarded} pkt.`
          : x.safeRound
            ? `${x.player}, bezpieczna runda — shot nie został doliczony.`
          : r.sober
            ? `${x.player}, większość nie zaliczyła zadania. Wybierz wodę lub sok.`
            : `${x.player}, większość nie zaliczyła zadania. Shot doliczony.`;
      $("#resultActions").innerHTML = isHost
        ? '<button class="primary-button full" id="onlineNext">NASTĘPNA TURA <span>↗</span></button>'
        : '<div class="vote-wait">HOST PRZECHODZI DO NASTĘPNEJ TURY</div>';
      $("#resultModal").classList.add("open");
      const n = $("#onlineNext");
      if (n) n.onclick = () => socket.emit("game:next");
    } else if (!$("#resultModal").classList.contains("open"))
      $("#resultModal").classList.add("open");
  } else {
    $("#resultModal").classList.remove("open");
    lastResultKey = "";
  }
}
document.querySelectorAll(".mode-tab").forEach(
  (b) =>
    (b.onclick = () => {
      selectedMode = b.dataset.mode;
      document
        .querySelectorAll(".mode-tab")
        .forEach((x) => x.classList.toggle("selected", x === b));
      const online = selectedMode === "online";
      $("#onlineControls").hidden = !online;
      $("#localOptions").hidden = online;
      $("#deckSelect").disabled = false;
      $("#adultConsentRow").hidden = !CARD_PACKS[selectedDeckId].adult;
      $("#customDeckPanel").hidden = online;
      $("#addPlayerRow").hidden = online;
      $("#playerList").innerHTML = "";
      $("#playerCount").textContent = online ? "POKÓJ" : "0 / 12";
      $("#setupPanelTitle").textContent = online
        ? "GRAJ Z EKIPĄ"
        : "SKŁAD EKIPY";
      $("#beginGame").hidden = online;
      $(".min-players").textContent = online
        ? "Wszyscy dołączają do pokoju z własnego telefonu."
        : "MINIMUM 2 GRACZY";
      if (online) ensureSocket();
      else {
        onlineRoom = null;
        $("#deckSelect").disabled = false;
        renderPlayers();
      }
    }),
);
function createRoom() {
  const s = ensureSocket();
  if (s) {
    if (!validateDeckConsent()) return;
    s.emit("room:create", {
      name: $("#onlineName").value.trim(),
      sober: $("#soberMode").checked,
      deckId: selectedDeckId,
      adultConsent: $("#adultConsent").checked,
    });
  }
}
$("#createRoom").onclick = createRoom;
$("#joinRoom").onclick = () => {
  const s = ensureSocket();
  if (s)
    s.emit("room:join", {
      name: $("#onlineName").value.trim(),
      code: $("#roomCodeInput").value.trim(),
    });
};
$("#readyButton").onclick = () => {
  const currentPlayer = onlineRoom?.players.find(
    (player) => player.id === myPlayerId,
  );
  if (currentPlayer && !isHost) {
    if (!currentPlayer.ready && !validateDeckConsent()) return;
    socket.emit("room:ready", {
      ready: !currentPlayer.ready,
      adultConsent: $("#adultConsent").checked,
    });
  }
};

renderPlayers();
customDeck.render();
$("#deckSelect").addEventListener("change", (event) => {
  selectedDeckId = event.target.value;
  updateDeckInfo();
  $("#adultConsentRow").hidden = !CARD_PACKS[selectedDeckId].adult;
  $("#adultConsent").checked = false;
  renderPlayers();
});
$("#adultConsent").addEventListener("change", renderPlayers);
$("#copyRoomCode").onclick = copyRoomCode;
$("#copyGameRoomCode").onclick = copyRoomCode;
$("#shareRoomCode").onclick = shareRoomCode;
$("#shareGameRoomCode").onclick = shareRoomCode;
customDeck.bind();
openRoomInvite();
