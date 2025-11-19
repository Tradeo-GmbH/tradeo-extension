// content-oonn.js
// Wird auf <all_urls> geladen (siehe Manifest)

// NEU
const browserApiOonn =
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
  console.log("[oonn] content-oonn.js geladen");

  let lastKeys = "";

  // Snapshot vom Zustand beim Tippen von "oonn"
  let lastActiveElement = null;
  let lastInputSelection = null;  // { start, end } für Input/Textarea
  let lastSelectionRange = null;  // Range für contentEditable / andere

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

    if (lastKeys === "oonn") {
      lastKeys = "";
      console.log("[oonn] Trigger erkannt (oonn)");

      snapshotFocusAndSelection();  // Zustand direkt nach dem Tippen merken
      triggerOidFlow();
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

    console.log("[oonn] Snapshot gespeichert:", {
      lastActiveElement,
      lastInputSelection,
      hasRange: !!lastSelectionRange
    });
  }

  // ----------------------------------------------------
  // Kommunikation mit Background
  // ----------------------------------------------------

  function triggerOidFlow() {
    if (!browserApiOonn) {
      console.warn("[oonn] Keine Extension-API verfügbar (runtime.sendMessage fehlt).");
      deleteLast4CharsAtSnapshotPosition();
      showTransientMessage("OID-Funktion nicht verfügbar.");
      return;
    }

    browserApiOonn.runtime.sendMessage({ type: "GET_OIDS" }, (response) => {
      if (browserApiOonn.runtime.lastError) {
        console.warn("[oonn] runtime.lastError:", browserApiOonn.runtime.lastError);
        deleteLast4CharsAtSnapshotPosition();
        showTransientMessage("Fehler bei der OID-Suche.");
        return;
      }

      if (!response || !Array.isArray(response.items) || response.items.length === 0) {
        console.log("[oonn] Keine Plenty-OIDs gefunden.");
        deleteLast4CharsAtSnapshotPosition();
        showTransientMessage("Keine Plenty-OID gefunden.");
        return;
      }

      // Einfach die erste gefundene OID nehmen
      const first = response.items[0];
      console.log("[oonn] Erste gefundene OID:", first);

      handleOidSelected(first.oid);
    });
  }

  async function handleOidSelected(oid) {
    const insertText = oid; // nur die Nummer einfügen
    console.log("[oonn] Verwende OID:", insertText);

    // 1) In Zwischenablage schreiben
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(insertText);
        console.log("[oonn] In Zwischenablage geschrieben.");
      } catch (e) {
        console.warn("[oonn] Clipboard write failed:", e);
      }
    }

    // 2) Text an gespeicherter Cursorposition einfügen (mit 4 Zeichen löschen)
    insertTextAtSnapshotPosition(insertText);
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
    console.log("[oonn] Ziel-Element für Einfügen:", active);

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
    console.log("[oonn] Kein Range vorhanden, Fallback via execCommand.");
    try {
      for (let i = 0; i < 4; i++) {
        document.execCommand("delete", false, null);
      }
      document.execCommand("insertText", false, text);
    } catch (err) {
      console.warn("[oonn] execCommand-Fallback fehlgeschlagen:", err);
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

    // letzten 4 Zeichen vor dem Cursor weg (oonn)
    const deleteFrom = Math.max(0, start - 4);

    const before = el.value.slice(0, deleteFrom);
    const after = el.value.slice(end);

    el.value = before + text + after;

    const newCursorPos = before.length + text.length;
    el.setSelectionRange(newCursorPos, newCursorPos);

    el.dispatchEvent(new Event("input", { bubbles: true }));

    console.log("[oonn] Textfeld aktualisiert, Cursor bei", newCursorPos);
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

        // "oonn" / markierten Text löschen
        workRange.deleteContents();

        if (text) {
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

        console.log("[oonn] Text via Range eingefügt/gelöscht.");
    } catch (err) {
        console.warn("[oonn] Fehler beim Einfügen über Range, Fallback execCommand:", err);
        try {
        for (let i = 0; i < 4; i++) {
            document.execCommand("delete", false, null);
        }
        if (text) {
            document.execCommand("insertText", false, text);
        }
        } catch (err2) {
        console.warn("[oonn] execCommand-Fallback im Range-Case fehlgeschlagen:", err2);
        }
    }
    }
})();
