// content-ttnn.js
// Wird auf <all_urls> geladen (siehe Manifest)

// NEU: API nur verwenden, wenn runtime.sendMessage existiert
const browserApi =
  (typeof browser !== "undefined" &&
    browser.runtime &&
    typeof browser.runtime.sendMessage === "function" &&
    browser) ||
  (typeof chrome !== "undefined" &&
    chrome.runtime &&
    typeof chrome.runtime.sendMessage === "function" &&
    chrome) ||
  null;

(() => {
  console.log("[ttnn] content-ttnn.js geladen");

  let lastKeys = "";

  // Snapshot vom Zustand beim Tippen von "ttnn"
  let lastActiveElement = null;
  let lastInputSelection = null;  // { start, end } für Input/Textarea
  let lastSelectionRange = null;  // Range für contentEditable / andere

  let overlayElement = null;

  // ----------------------------------------------------
  // Helper: kurzer Popup-Hinweis (Toast)
  // ----------------------------------------------------

  function showTransientMessage(message) {
    try {
      const existing = document.getElementById("tradeo-toast-message");
      if (existing) existing.remove();
    } catch (e) {}

    const toast = document.createElement("div");
    toast.id = "tradeo-toast-message";
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.bottom = "24px";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "rgba(0, 0, 0, 0.85)";
    toast.style.color = "#fff";
    toast.style.padding = "6px 12px";
    toast.style.borderRadius = "4px";
    toast.style.fontSize = "12px";
    toast.style.fontFamily = "sans-serif";
    toast.style.zIndex = "999999";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
    toast.style.maxWidth = "80%";
    toast.style.textAlign = "center";

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  // ----------------------------------------------------
  // Key-Handling
  // ----------------------------------------------------

  document.addEventListener("keyup", onKeyUp, true);

  function onKeyUp(e) {
    const key = e.key;

    if (!key || key.length !== 1) return; // nur normale Zeichen

    const lower = key.toLowerCase();
    lastKeys = (lastKeys + lower).slice(-4);

    if (lastKeys === "ttnn") {
      lastKeys = "";
      console.log("[ttnn] Trigger erkannt (ttnn)");

      snapshotFocusAndSelection();  // Zustand direkt nach dem Tippen merken
      triggerConversationIdFlow();
    }
  }

  function snapshotFocusAndSelection() {
    lastActiveElement = document.activeElement;
    lastInputSelection = null;
    lastSelectionRange = null;

    // Input/Textarea-Cursor merken
    if (lastActiveElement instanceof HTMLInputElement || lastActiveElement instanceof HTMLTextAreaElement) {
      lastInputSelection = {
        start: lastActiveElement.selectionStart ?? lastActiveElement.value.length,
        end: lastActiveElement.selectionEnd ?? lastActiveElement.value.length
      };
    }

    // Allgemeine Selection (z.B. contentEditable)
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      lastSelectionRange = sel.getRangeAt(0).cloneRange();
    }

    console.log("[ttnn] Snapshot gespeichert:", {
      lastActiveElement,
      lastInputSelection,
      hasRange: !!lastSelectionRange
    });
  }

  function restoreFocusAndSelection() {
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }

    if (lastActiveElement instanceof HTMLInputElement || lastActiveElement instanceof HTMLTextAreaElement) {
      if (lastInputSelection) {
        lastActiveElement.setSelectionRange(lastInputSelection.start, lastInputSelection.end);
      }
    } else if (lastSelectionRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(lastSelectionRange);
      }
    }

    console.log("[ttnn] Fokus & Selection wiederhergestellt");
  }

  // ----------------------------------------------------
  // Kommunikation mit Background
  // ----------------------------------------------------

  function triggerConversationIdFlow() {
    if (!browserApi) {
      console.warn("[ttnn] Keine Extension-API verfügbar (runtime.sendMessage fehlt).");
      deleteLast4CharsAtSnapshotPosition();
      showTransientMessage("Ticket-Funktion nicht verfügbar.");
      return;
    }

    browserApi.runtime.sendMessage({ type: "GET_CONVERSATION_IDS" }, (response) => {
      if (browserApi.runtime.lastError) {
        console.warn("[ttnn] runtime.lastError:", browserApi.runtime.lastError);
        deleteLast4CharsAtSnapshotPosition();
        showTransientMessage("Fehler bei der Ticket-Suche.");
        return;
      }

      if (!response || !Array.isArray(response.items) || response.items.length === 0) {
        console.log("[ttnn] Keine Ticket-Tabs gefunden.");
        deleteLast4CharsAtSnapshotPosition();
        showTransientMessage("Kein Ticket-Tab gefunden.");
        return;
      }

      const items = response.items;
      console.log("[ttnn] Gefundene Tickets:", items);

      if (items.length === 1) {
        handleTicketSelected(items[0]);
      } else {
        showTicketOverlay(items);
      }
    });
  }

  async function handleTicketSelected(item) {
    const insertText = buildTicketInsertText(item);
    console.log("[ttnn] Ausgewähltes Ticket:", insertText, item);

    // 1) In Zwischenablage schreiben
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(insertText);
        console.log("[ttnn] In Zwischenablage geschrieben.");
      } catch (e) {
        console.warn("[ttnn] Clipboard write failed:", e);
      }
    }

    // 2) Fokus + Selection wiederherstellen
    restoreFocusAndSelection();

    // 3) Immer: letzte 4 Zeichen ersetzen
    insertTextAtSnapshotPosition(insertText);
  }

  function buildTicketInsertText(item) {
    if (item.source === "helpscout") {
      return `Helpscout Ticket #${item.ticketNumber}`;
    }
    if (item.source === "freescout") {
      return `Freescout Ticket #${item.ticketNumber}`;
    }
    return `Ticket #${item.ticketNumber}`;
  }

  function buildTicketOverlayLabel(item) {
    if (item.source === "helpscout") {
      return `Helpscout #${item.ticketNumber}`;
    }
    if (item.source === "freescout") {
      return `Freescout #${item.ticketNumber}`;
    }
    return `Ticket #${item.ticketNumber}`;
  }

  // ----------------------------------------------------
  // Einfügen & 4 Zeichen löschen
  // ----------------------------------------------------

  function deleteLast4CharsAtSnapshotPosition() {
    // einfach wie Einfügen behandeln, aber mit leerem Text
    insertTextAtSnapshotPosition("");
  }

  function insertTextAtSnapshotPosition(text) {
    const active = lastActiveElement || document.activeElement;
    console.log("[ttnn] Ziel-Element für Einfügen:", active);

    // Fall A: klassisches Input/Textarea
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      insertIntoTextControl(active, text, lastInputSelection);
      return;
    }

    // Fall B: allgemeiner Editor / contentEditable über Range
    if (lastSelectionRange) {
      insertUsingRange(lastSelectionRange, text);
      return;
    }

    // Fallback: execCommand (sehr generisch)
    console.log("[ttnn] Kein Range vorhanden, Fallback via execCommand.");
    try {
      for (let i = 0; i < 4; i++) {
        document.execCommand("delete", false, null);
      }
      document.execCommand("insertText", false, text);
    } catch (err) {
      console.warn("[ttnn] execCommand-Fallback fehlgeschlagen:", err);
    }
  }

  function insertIntoTextControl(el, text, savedSel) {
    let start, end;

    if (savedSel) {
      start = savedSel.start;
      end = savedSel.end;
    } else {
      start = el.selectionStart ?? el.value.length;
      end = el.selectionEnd ?? el.value.length;
    }

    // letzten 4 Zeichen vor dem Cursor weg (ttnn)
    const deleteFrom = Math.max(0, start - 4);

    const before = el.value.slice(0, deleteFrom);
    const after = el.value.slice(end);

    el.value = before + text + after;

    const newCursorPos = before.length + text.length;
    el.setSelectionRange(newCursorPos, newCursorPos);

    el.dispatchEvent(new Event("input", { bubbles: true }));

    console.log("[ttnn] Textfeld aktualisiert, Cursor bei", newCursorPos);
  }

    function insertUsingRange(range, text) {
    const workRange = range.cloneRange();

    try {
        if (workRange.collapsed && workRange.startContainer.nodeType === Node.TEXT_NODE) {
        const node = workRange.startContainer;
        const offset = workRange.startOffset;
        const newStart = Math.max(0, offset - 4); // letzte 4 Zeichen
        workRange.setStart(node, newStart);
        }

        // "ttnn" / markierten Text löschen
        workRange.deleteContents();

        if (text) {
        // ID-Text einfügen, falls vorhanden
        const textNode = document.createTextNode(text);
        workRange.insertNode(textNode);

        const sel = window.getSelection();
        if (sel) {
            const afterRange = document.createRange();
            afterRange.setStartAfter(textNode);
            afterRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(afterRange);
        }
        }

        console.log("[ttnn] Text via Range eingefügt/gelöscht.");
    } catch (err) {
        console.warn("[ttnn] Fehler beim Einfügen über Range, Fallback execCommand:", err);
        try {
        for (let i = 0; i < 4; i++) {
            document.execCommand("delete", false, null);
        }
        if (text) {
            document.execCommand("insertText", false, text);
        }
        } catch (err2) {
        console.warn("[ttnn] execCommand-Fallback im Range-Case fehlgeschlagen:", err2);
        }
    }
    }


  // ----------------------------------------------------
  // Overlay für Mehrfach-Auswahl
  // ----------------------------------------------------

  function showTicketOverlay(items) {
    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
    }

    overlayElement = document.createElement("div");
    overlayElement.style.position = "fixed";
    overlayElement.style.top = "0";
    overlayElement.style.left = "0";
    overlayElement.style.right = "0";
    overlayElement.style.bottom = "0";
    overlayElement.style.backgroundColor = "rgba(0,0,0,0.4)";
    overlayElement.style.zIndex = "999999";
    overlayElement.style.display = "flex";
    overlayElement.style.alignItems = "center";
    overlayElement.style.justifyContent = "center";

    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.padding = "12px";
    box.style.borderRadius = "6px";
    box.style.minWidth = "260px";
    box.style.maxWidth = "400px";
    box.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)";
    box.style.fontFamily = "sans-serif";
    box.style.fontSize = "13px";

    const title = document.createElement("div");
    title.textContent = "Ticket auswählen";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    box.appendChild(title);

    const list = document.createElement("div");
    list.style.maxHeight = "240px";
    list.style.overflowY = "auto";
    list.style.border = "1px solid #ccc";

    let selectedItemIndex = 0;

    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.textContent = buildTicketOverlayLabel(item);
      row.style.padding = "4px 8px";
      row.style.cursor = "pointer";

      if (index === selectedItemIndex) {
        row.style.background = "#e6f0ff";
      }

      row.addEventListener("click", () => {
        selectedItemIndex = index;
        updateSelectionHighlight(list, selectedItemIndex);
      });

      row.addEventListener("dblclick", () => {
        closeOverlay();
        handleTicketSelected(item);
      });

      list.appendChild(row);
    });

    box.appendChild(list);

    const buttonRow = document.createElement("div");
    buttonRow.style.marginTop = "8px";
    buttonRow.style.textAlign = "right";

    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.style.marginRight = "6px";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Abbrechen";

    okBtn.addEventListener("click", () => {
      const chosen = items[selectedItemIndex];
      closeOverlay();
      if (chosen) handleTicketSelected(chosen);
    });

    cancelBtn.addEventListener("click", () => {
      closeOverlay();
    });

    buttonRow.appendChild(okBtn);
    buttonRow.appendChild(cancelBtn);
    box.appendChild(buttonRow);

    overlayElement.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeOverlay();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedItemIndex = (selectedItemIndex - 1 + items.length) % items.length;
        updateSelectionHighlight(list, selectedItemIndex);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedItemIndex = (selectedItemIndex + 1) % items.length;
        updateSelectionHighlight(list, selectedItemIndex);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const chosen = items[selectedItemIndex];
        closeOverlay();
        if (chosen) handleTicketSelected(chosen);
      }
    });

    overlayElement.appendChild(box);
    document.body.appendChild(overlayElement);

    overlayElement.tabIndex = -1;
    overlayElement.focus();
  }

  function updateSelectionHighlight(list, selectedIndex) {
    const children = Array.from(list.children);
    children.forEach((child, idx) => {
      child.style.background = idx === selectedIndex ? "#e6f0ff" : "";
    });
  }

  function closeOverlay() {
    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
    }
  }
})();
