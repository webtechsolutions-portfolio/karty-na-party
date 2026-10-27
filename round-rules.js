(function (root, factory) {
  const rules = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = rules;
  root.RoundRules = rules;
})(globalThis, () => {
  const specialRounds = [
    {
      id: "double-points",
      title: "Podwójne punkty",
      description: "Zaliczenie karty daje 2 punkty zamiast 1.",
      pointValue: 2,
    },
    {
      id: "crew-points",
      title: "Cała ekipa",
      description: "Gdy aktywny gracz zaliczy kartę, każdy zdobywa 1 punkt.",
      crewPoints: true,
    },
    {
      id: "safe-round",
      title: "Bezpieczna runda",
      description: "Za niezaliczoną kartę nie dolicza się shota.",
      safe: true,
    },
  ];

  function forCardIndex(cardIndex) {
    if ((cardIndex + 1) % 5 !== 0) return null;
    const specialIndex = Math.floor((cardIndex + 1) / 5) - 1;
    return specialRounds[specialIndex % specialRounds.length];
  }

  function byId(id) {
    return specialRounds.find((rule) => rule.id === id) || null;
  }

  return { forCardIndex, byId };
});
