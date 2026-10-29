(function (root, factory) {
  const packs = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = packs;
  root.CARD_PACKS = packs;
})(globalThis, () => ({
  classic: {
    name: "Klasyczna",
    description: "Pytania i lekkie wyzwania dla całej ekipy.",
    adult: false,
    cards: [
      ["PYTANIE", "♥", "Kto z tej ekipy zna cię najlepiej?"], ["WYZWANIE", "♣", "Zrób najlepszą minę do zdjęcia. Ekipa ocenia!"],
      ["PYTANIE", "♦", "Jaka była twoja najbardziej absurdalna wymówka?"], ["WYZWANIE", "♠", "Przez następną turę mów do wszystkich jak robot."],
      ["PYTANIE", "♥", "Komu z ekipy powierzył(a)byś swój największy sekret?"], ["WYZWANIE", "♣", "Zaśpiewaj refren piosenki, którą wszyscy znają."],
      ["PYTANIE", "♦", "Co najdziwniejszego masz teraz w historii wyszukiwania?"], ["WYZWANIE", "♠", "Zrób reklamę najbliższego przedmiotu jak w telewizji."],
      ["PYTANIE", "♥", "Jaki talent ukrywasz przed znajomymi?"], ["WYZWANIE", "♣", "Opowiedz historię z życia w 20 sekund."],
      ["PYTANIE", "♦", "Kto z tej ekipy przetrwałby najdłużej na bezludnej wyspie?"], ["WYZWANIE", "♠", "Wymyśl każdemu przy stole nowe przezwisko."],
      ["PYTANIE", "♥", "Jaka była twoja najgorsza pierwsza randka?"], ["WYZWANIE", "♣", "Zrób 10-sekundowy taniec bez muzyki."],
      ["PYTANIE", "♦", "Jaki film możesz oglądać bez końca?"], ["WYZWANIE", "♠", "Powiedz komplement osobie po swojej lewej."],
      ["PYTANIE", "♥", "Jaką jedną rzecz zmienił(a)byś w swoim mieście?"], ["WYZWANIE", "♣", "Przez minutę nie używaj słowa „tak”."],
      ["PYTANIE", "♦", "Kto z ekipy ma najlepszy gust muzyczny?"], ["WYZWANIE", "♠", "Pokaż bez słów, jak wygląda twój poranek."],
      ["PYTANIE", "♥", "Co zawsze poprawia ci humor?"], ["WYZWANIE", "♣", "Wymyśl toast na cześć tej ekipy."],
      ["PYTANIE", "♦", "Jakie spontaniczne szaleństwo wspominasz najlepiej?"], ["WYZWANIE", "♠", "Zgadnij ulubiony deser osoby naprzeciwko."],
    ],
  },
  spicy: {
    name: "Pikantna 18+", description: "Flirt, randkowe historie i odważniejsze pytania.", adult: true,
    cards: [
      ["PYTANIE", "♥", "Jaki flirtujący tekst naprawdę mógłby cię rozbawić?"], ["WYZWANIE", "♣", "Wymyśl komuś przy stole elegancki, filmowy komplement — tylko jeśli ma na to ochotę."],
      ["PYTANIE", "♦", "Jaki jest twój największy zielony sygnał na randce?"], ["WYZWANIE", "♠", "Opisz swoją idealną randkę jak zwiastun filmu."],
      ["PYTANIE", "♥", "Co najbardziej przyciąga cię w czyjejś osobowości?"], ["WYZWANIE", "♣", "Przez 10 sekund flirtuj z wyobrażonym bohaterem filmu."],
      ["PYTANIE", "♦", "Jaka randkowa wpadka dziś cię już tylko śmieszy?"], ["WYZWANIE", "♠", "Wymyśl tytuł komedii romantycznej o tej ekipie."],
      ["PYTANIE", "♥", "Jaki drobny gest robi na tobie największe wrażenie?"], ["WYZWANIE", "♣", "Powiedz komuś przy stole miły komplement, jeśli obie osoby czują się z tym dobrze."],
      ["PYTANIE", "♦", "Wolisz zrobić pierwszy krok czy dostać jasny sygnał?"], ["WYZWANIE", "♠", "Pokaż bez słów swoją minę, gdy widzisz atrakcyjną osobę."],
      ["PYTANIE", "♥", "Jaki rodzaj poczucia humoru najbardziej cię ujmuje?"], ["WYZWANIE", "♣", "Zaproponuj najbardziej kreatywne zaproszenie na randkę."],
      ["PYTANIE", "♦", "Co sprawia, że rozmowa z kimś robi się ekscytująca?"], ["WYZWANIE", "♠", "Ułóż krótką, zabawną wiadomość na podryw — bez wysyłania jej komukolwiek."],
    ],
  },
  erotic: {
    name: "Erotyczna 18+", description: "Seks, fantazje, fetysze i pikantne historie. Tylko dla dorosłych — każdą kartę można pominąć.", adult: true,
    cards: [
      ["PYTANIE", "♥", "Jaka jest twoja najbardziej zbereźna fantazja, którą możesz opowiedzieć bez zdradzania szczegółów?"], ["WYZWANIE", "♣", "Powiedz najbardziej niegrzeczne zdanie, jakie można rzucić na randce — bez wskazywania konkretnej osoby."],
      ["PYTANIE", "♦", "Jaka seksualna preferencja najbardziej cię zaskoczyła, gdy odkryłeś/aś, że cię kręci?"], ["WYZWANIE", "♠", "Wymyśl pikantny tytuł filmu o swojej najdzikszej fantazji."],
      ["PYTANIE", "♥", "Jaka była twoja najgorsza, najdziwniejsza albo najbardziej żenująca przygoda łóżkowa? Możesz opowiedzieć wersję bez nazwisk."], ["WYZWANIE", "♣", "Opowiedz swoją najbardziej niegrzeczną historię w trzech zdaniach — albo wymyśl ją na poczekaniu."],
      ["PYTANIE", "♦", "Jaki nietypowy fetysz albo kink ciekawi cię najbardziej, nawet jeśli tylko z czystej ciekawości?"], ["WYZWANIE", "♠", "Zareklamuj wymyślony gadżet erotyczny tak, jakby był hitem telezakupów."],
      ["PYTANIE", "♥", "Co najbardziej podkręca atmosferę: dirty talk, odgrywanie ról, bielizna, spontaniczność czy coś innego?"], ["WYZWANIE", "♣", "Zrób najbardziej uwodzicielską minę i wymyśl do niej kwestię z kiepskiego filmu erotycznego."],
      ["PYTANIE", "♦", "Jaka rzecz jest dla ciebie absolutnym „nie” w seksie, nawet jeśli inni uznają ją za niewinną?"], ["WYZWANIE", "♠", "Wymyśl absurdalny, ale brzmiący wiarygodnie pseudonim gwiazdy filmów dla dorosłych."],
      ["PYTANIE", "♥", "Czy masz seksualną fantazję, którą wolisz zostawić tylko w głowie? Co czyni ją taką kuszącą?"], ["WYZWANIE", "♣", "Ułóż najbardziej bezczelną wiadomość na podryw, której nigdy nie odważył(a)byś się wysłać."],
      ["PYTANIE", "♦", "Co było najbardziej zaskakującą rzeczą, która kiedykolwiek cię podnieciła?"], ["WYZWANIE", "♠", "Wymyśl zaproszenie na bardzo niegrzeczną randkę, które nadal jasno zostawia drugiej osobie wybór."],
    ],
  },
}));
