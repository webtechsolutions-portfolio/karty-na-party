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
    name: "Erotyczna 18+", description: "Intymność, chemia i bliskość — z pełnym szacunkiem do granic.", adult: true,
    cards: [
      ["PYTANIE", "♥", "Co pomaga ci poczuć się swobodnie i bezpiecznie w bliskiej relacji?"], ["WYZWANIE", "♣", "Opisz idealny romantyczny nastrój jednym zdaniem."],
      ["PYTANIE", "♦", "Co według ciebie buduje chemię między dwojgiem ludzi?"], ["WYZWANIE", "♠", "Wymyśl subtelny, romantyczny komplement dla fikcyjnej postaci."],
      ["PYTANIE", "♥", "Jaki rodzaj czułości lubisz najbardziej — jeśli chcesz się podzielić?"], ["WYZWANIE", "♣", "Opisz wymarzoną randkę, która kończy się pięknym pocałunkiem."],
      ["PYTANIE", "♦", "Co jest dla ciebie ważne, zanim relacja stanie się bardziej intymna?"], ["WYZWANIE", "♠", "Wymyśl tytuł zmysłowej, ale eleganckiej sceny filmowej."],
      ["PYTANIE", "♥", "Co sprawia, że czujesz się pożądany/a i doceniony/a?"], ["WYZWANIE", "♣", "Powiedz, jaki utwór najlepiej pasuje do romantycznego wieczoru."],
      ["PYTANIE", "♦", "Wolisz powolne budowanie napięcia czy spontaniczne gesty? Możesz pominąć."], ["WYZWANIE", "♠", "Zagraj krótką scenę filmową: ktoś nieśmiało zaprasza na randkę."],
      ["PYTANIE", "♥", "Jak najłatwiej zakomunikować ci swoje granice?"], ["WYZWANIE", "♣", "Wymyśl romantyczną wiadomość, która nie przekracza niczyich granic."],
      ["PYTANIE", "♦", "Co jest bardziej pociągające: pewność siebie, czułość czy humor?"], ["WYZWANIE", "♠", "Opisz idealny pocałunek trzema słowami — albo pomiń."],
    ],
  },
}));
