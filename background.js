// URL deines Presence-Servers (Node/Express)
const PRESENCE_URL = "http://109.230.236.181:3000/presence";

function getClientId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["presenceClientId"], (res) => {
      if (res.presenceClientId) return resolve(res.presenceClientId);
      const id = "client-" + Math.random().toString(36).slice(2);
      chrome.storage.local.set({ presenceClientId: id }, () => resolve(id));
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // PING: aktualisieren + Liste holen
  if (message.type === "presenceUpdate") {
    (async () => {
      try {
        const { orderId, userName } = message;
        const clientId = await getClientId();

        // 1) POST: Ping an den Server
        await fetch(PRESENCE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ping", orderId, userName, clientId })
        });

        // 2) GET: Liste der Nutzer für diese orderId
        const res = await fetch(
        PRESENCE_URL + "?orderId=" + encodeURIComponent(orderId)
        );
        const data = await res.json();

        sendResponse({
        ok: true,
        users: data.users || [],
        activeClientCount:
            typeof data.activeClientCount === "number"
            ? data.activeClientCount
            : (data.users || []).length,
        clients: Array.isArray(data.clients) ? data.clients : [],
        selfClientId: clientId
        });
      } catch (e) {
        console.warn("[Presence background] ping error", e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();

    return true; // async Antwort
  }

  // CLEAR: Eintrag für diese orderId löschen
  if (message.type === "presenceClear") {
    (async () => {
      try {
        const { orderId } = message;
        const clientId = await getClientId();

        await fetch(PRESENCE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clear", orderId, clientId })
        });

        sendResponse({ ok: true });
      } catch (e) {
        console.warn("[Presence background] clear error", e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();

    return true;
  }
});
