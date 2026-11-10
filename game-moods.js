(function (root, factory) {
  const moods = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = moods;
  root.GAME_MOODS = moods;
})(globalThis, () => ({
  easygoing: {
    name: "Na luzie",
    description: "Rzadziej trafiają się specjalne tury.",
    neverCards: 1,
    challengeRate: 0.1,
  },
  party: {
    name: "Imprezowo",
    description: "Mieszanka zwykłych kart i wspólnych wyzwań.",
    neverCards: 2,
    challengeRate: 0.2,
  },
  competitive: {
    name: "Rywalizacja",
    description: "Częstsze quizowe pojedynki i specjalne tury.",
    neverCards: 3,
    challengeRate: 0.3,
  },
}));
