(function (root) {
  const storageKey = "karty-na-party.custom-cards.v1";

  function loadCards() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved
        .filter(
          (card) =>
            card &&
            (card.type === "PYTANIE" || card.type === "WYZWANIE") &&
            typeof card.text === "string" &&
            card.text.trim(),
        )
        .slice(0, 100)
        .map((card) => ({
          type: card.type,
          text: card.text.trim().slice(0, 160),
        }));
    } catch {
      return [];
    }
  }

  root.createCustomDeck = function createCustomDeck({ $, escapeHtml, notify, onChange }) {
    const cards = loadCards();

    function save() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(cards));
      } catch {
        notify("Nie udało się zapisać kart na tym urządzeniu.");
      }
    }

    function render() {
      const list = $("#customCardList");
      if (!list) return;
      list.innerHTML = cards.length
        ? cards
            .map(
              (card, index) =>
                '<div class="custom-card-item"><span><b>' +
                card.type +
                "</b><small>" +
                escapeHtml(card.text) +
                '</small></span><button type="button" data-delete-card="' +
                index +
                '" aria-label="Usuń kartę: ' +
                escapeHtml(card.text) +
                '">×</button></div>',
            )
            .join("")
        : '<p class="custom-card-empty">Twoja talia czeka na pierwszą kartę.</p>';
      list.querySelectorAll("[data-delete-card]").forEach((button) => {
        button.onclick = () => {
          cards.splice(Number(button.dataset.deleteCard), 1);
          save();
          render();
        };
      });
      $("#customCardCount").textContent = cards.length + " / 100";
      onChange();
    }

    function add() {
      const input = $("#customCardText");
      const text = input.value.trim();
      const type = $("#customCardType").value;
      if (!text) return notify("Wpisz treść karty.");
      if (cards.length >= 100) return notify("Możesz dodać maksymalnie 100 kart.");
      if (
        cards.some(
          (card) =>
            card.type === type &&
            card.text.toLocaleLowerCase() === text.toLocaleLowerCase(),
        )
      )
        return notify("Taka karta już jest w twojej talii.");
      cards.push({ type, text: text.slice(0, 160) });
      input.value = "";
      save();
      render();
      notify("Karta dodana do twojej talii.");
    }

    function download(file) {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("Talia została wyeksportowana.");
    }

    function exportDeck() {
      const payload = {
        format: "karty-na-party-deck",
        version: 1,
        cards,
      };
      const file = new File(
        [JSON.stringify(payload, null, 2)],
        "moja-talia-karty-na-party.json",
        { type: "application/json" },
      );
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        navigator
          .share({ files: [file], title: "Moja talia Karty na Party" })
          .then(() => notify("Talia gotowa do udostępnienia."))
          .catch((error) => {
            if (error.name !== "AbortError") download(file);
          });
        return;
      }
      download(file);
    }

    async function importDeck(file) {
      try {
        const payload = JSON.parse(await file.text());
        if (
          !payload ||
          payload.format !== "karty-na-party-deck" ||
          payload.version !== 1 ||
          !Array.isArray(payload.cards)
        )
          throw new Error("Nieobsługiwany format talii.");
        let added = 0;
        let skipped = 0;
        for (const card of payload.cards) {
          if (
            !card ||
            (card.type !== "PYTANIE" && card.type !== "WYZWANIE") ||
            typeof card.text !== "string" ||
            !card.text.trim()
          ) {
            skipped++;
            continue;
          }
          const text = card.text.trim().slice(0, 160);
          const exists = cards.some(
            (current) =>
              current.type === card.type &&
              current.text.toLocaleLowerCase() === text.toLocaleLowerCase(),
          );
          if (exists || cards.length >= 100) {
            skipped++;
            continue;
          }
          cards.push({ type: card.type, text });
          added++;
        }
        if (!added) {
          notify(
            skipped
              ? "Nie dodano kart: talia jest pełna albo zawiera duplikaty."
              : "Plik nie zawiera kart do importu.",
          );
          return;
        }
        save();
        render();
        notify(
          "Dodano " +
            added +
            (skipped ? " kart. Pominięto: " + skipped + "." : " kart do talii."),
        );
      } catch (error) {
        notify(
          error instanceof SyntaxError
            ? "Nie udało się odczytać pliku. Wybierz plik JSON z talią."
            : error.message || "Nie udało się zaimportować talii.",
        );
      }
    }

    function bind() {
      $("#addCustomCard").onclick = add;
      $("#exportCustomDeck").onclick = exportDeck;
      $("#importCustomDeck").onclick = () => $("#customDeckFile").click();
      $("#customDeckFile").addEventListener("change", (event) => {
        const [file] = event.target.files || [];
        if (file) {
          if (file.size > 1024 * 1024)
            notify("Plik talii jest za duży (maks. 1 MB).");
          else importDeck(file);
        }
        event.target.value = "";
      });
      $("#customCardText").addEventListener("keydown", (event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          add();
        }
      });
    }

    return { cards, render, bind };
  };
})(window);
