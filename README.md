# Karty na Party — prototyp 0.1

Mobilny prototyp gry karcianej z trybem lokalnym na jednym telefonie oraz trybem online opartym o Node.js, Express i Socket.IO. Tryb online synchronizuje pokój, tury, karty, głosy większości i liczniki. Capacitor może opakować interfejs jako aplikację na Androida/iOS; serwer realtime musi być dostępny pod publicznym adresem.

## Uruchomienie

Uruchom serwer aplikacji (serwuje także klienta Socket.IO):

```sh
npm install
npm start
```

Możesz też uruchomić `yarn serve` — ten skrypt startuje ten sam serwer Node, w tym Socket.IO. Nie używaj do gry online komendy `yarn dlx serve` ani samego pakietu `serve`, bo serwuje tylko pliki statyczne.

Otwórz `http://localhost:3000`. Na kilku telefonach w tej samej sieci Wi-Fi użyj na każdym `http://ADRES-IP-KOMPUTERA:3000`; urządzenia muszą mieć dostęp do portu 3000. Jedna osoba wybiera **Wiele telefonów → Utwórz pokój**, pozostali wpisują wyświetlony kod. Aby grać przez internet spoza jednej sieci, wdroż `server.js` na publicznym serwerze obsługującym WebSocket i udostępnij pod tym samym adresem interfejs. Otwieraj grę przez serwer HTTP, nie przez `file://`.

## Publiczny adres do testów

Projekt zawiera `render.yaml` dla Render Web Service. Po wypchnięciu repozytorium do GitHub wybierz w Render **New → Blueprint**, podłącz repozytorium i zatwierdź usługę z pliku Blueprint. Render uruchomi aplikację poleceniami `npm ci` i `npm start`, sprawdzi endpoint `/health` i nada jej adres `onrender.com`. Strona oraz Socket.IO działają pod tym samym adresem.

Darmowa usługa może zasnąć po okresie bezczynności i obudzi się przy kolejnym wejściu. Pokoje są przechowywane w pamięci procesu, więc znikną po restarcie lub ponownym wdrożeniu. Powrót po utracie połączenia działa, dopóki proces serwera działa; powrót po restarcie wymaga trwałego magazynu pokoi. To wystarczy do testów; przed regularnym użytkowaniem potrzebny będzie trwały magazyn stanu.

## Opakowanie na Androida i iOS

Po zainstalowaniu Android Studio (Android) lub Xcode na macOS (iOS):

```sh
npm install
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
# albo: npx cap open ios
```

W projektach natywnych skonfiguruj identyfikatory, ikony, splash screen i podpisywanie. Publikacja wymaga kont Google Play Console i Apple Developer oraz przejścia ich aktualnych procesów weryfikacji.

## Co zawiera prototyp

- ekran startowy i konfigurację od 2 do 12 uczestników;
- lokalną rozgrywkę na jednym przekazywanym telefonie;
- tryb online dla 2–12 telefonów: kod pokoju i link zaproszeniowy, zgłaszanie gotowości przed startem, host, wspólna karta i tura, głosowanie pozostałych uczestników, werdykt większości oraz automatyczny powrót do pokoju po odświeżeniu lub utracie połączenia (miejsce jest rezerwowane przez 10 minut);
- trzy talie: Klasyczną, Pikantną 18+ i Erotyczną 18+; talie dla dorosłych wymagają potwierdzenia wieku i zgody, a w online każdy dołączający potwierdza je przed zgłoszeniem gotowości;
- punkty za zaliczone karty oraz specjalna zasada co piątą kartę: podwójne punkty, punkty dla całej ekipy lub bezpieczna runda;
- możliwość pominięcia dowolnej karty bez kary, także w trybie online;
- animowany flip 3D karty, informacje o turze i postępie talii;
- ręczny werdykt „udało się” / „shot”, licznik shotów dla każdego gracza i pominięcie kary;
- tryb bezalkoholowy, w którym kara nie zwiększa licznika shotów;
- kreator do 100 własnych pytań i wyzwań, zapisanych na urządzeniu i dodawanych do lokalnej talii;
- eksport własnej talii do JSON oraz import z pominięciem duplikatów i limitem 100 kart;
- ekran zasad oraz szkic funkcji zwiększających regrywalność.

## Układ kodu

- `server.js` uruchamia Express/Socket.IO i rejestruje trasy HTTP.
- `server/room-handlers.js` obsługuje pokój, tury, głosowanie i wznowienie połączeń.
- `app.js` koordynuje widoki i lokalną rozgrywkę w przeglądarce.
- `client/custom-deck.js` odpowiada za tworzenie, zapis, import i eksport własnych kart.
- `card-packs.js` jest wspólnym katalogiem talii dla klienta i serwera.
- `round-rules.js` definiuje wspólne modyfikatory rund dla gry lokalnej i online.
- `index.html` zawiera strukturę ekranów, a `style.css` ich wygląd.

## Kierunki rozwoju

1. **Więcej talii tematycznych** — np. domówka, wyjazd, randki, rodzina; sezonowe dodatki i stopniowane poziomy odwagi.
2. **Katalog talii** — odkrywanie i pobieranie gotowych paczek tematycznych.
3. **Narzędzia hosta** — usuwanie gracza, przekazanie hostowania i zabezpieczenia przed spamowaniem akcji.
4. **Więcej wariantów gry** — drużyny, runda na czas, wspólne cele i osiągnięcia.
5. **Personalizacja i dostępność** — wybór intensywności, filtr treści, większy tekst i kolory kart.

## Następne kroki przed sklepami

Tryb online działa przez serwer Socket.IO opisany w `server.js`; pamięć pokoi jest tymczasowa i zniknie po restarcie serwera. Wersja produkcyjna wymaga hostingu z WebSocket, trwałości/odzyskiwania sesji, limitów antyspamowych i testów na urządzeniach. Aplikacja natywna Capacitor również musi wskazywać wdrożony backend; lokalny `localhost` telefonu nie jest serwerem deweloperskim komputera. Przed publikacją należy dodać natywne zasoby marki, politykę prywatności, sprawdzić zgodność z wymaganiami sklepów i przetestować na fizycznych telefonach.
