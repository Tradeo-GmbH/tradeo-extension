// Cross-Browser API (Chrome & Firefox)
const browserApi = typeof browser !== "undefined" ? browser : chrome;

// URL deines Presence-Servers (Node/Express)
const PRESENCE_URL = "https://presence.tradeo.risingsilence.de/presence";

// --- Presence-Funktionen ---

function getClientId() {
  return new Promise((resolve) => {
    browserApi.storage.local.get(["presenceClientId"], (res) => {
      if (res.presenceClientId) return resolve(res.presenceClientId);
      const id = "client-" + Math.random().toString(36).slice(2);
      browserApi.storage.local.set({ presenceClientId: id }, () => resolve(id));
    });
  });
}

// --- Ticket-Infos aus URLs (FreeScout + HelpScout) ---

function getTicketInfoFromUrl(url) {
  if (!url) return null;

  // FreeScout: https://desk.tradeo.de/conversation/123456
  let m = url.match(/^https:\/\/desk\.tradeo\.de\/conversation\/(\d+)/);
  if (m) {
    return {
      ticketNumber: m[1],
      source: "freescout"
    };
  }

  // HelpScout: https://secure.helpscout.net/conversation/3129442074/386994?viewId=...
  // -> zweite Zahl (hier 386994) ist die Ticketnummer
  m = url.match(/^https:\/\/secure\.helpscout\.net\/conversation\/\d+\/(\d+)(?:[/?]|$)/);
  if (m) {
    return {
      ticketNumber: m[1],
      source: "helpscout"
    };
  }

  return null;
}

// --- OID aus Plenty-Order-URLs ---

function getOidFromUrl(url) {
  if (!url) return null;
  // Beispiel: https://p7843.my.plentysystems.com/plenty/terra/order/order-ui/578688
  const m = url.match(/\/order-ui\/(\d+)/);
  return m ? m[1] : null;
}

// --- Message-Listener für alle Features ---

browserApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // PING: aktualisieren + Liste holen (Presence)
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

  // CLEAR: Eintrag für diese orderId löschen (Presence)
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

  // Ticket-Infos aus FreeScout- und HelpScout-Tabs holen (für "ttnn")
  if (message.type === "GET_CONVERSATION_IDS") {
    browserApi.tabs.query(
      {
        url: [
          "https://desk.tradeo.de/conversation/*",
          "https://secure.helpscout.net/conversation/*"
        ]
      },
      (tabs) => {
        const items = tabs
          .map((tab) => {
            const info = getTicketInfoFromUrl(tab.url || "");
            if (!info) return null;
            return {
              tabId: tab.id,
              ticketNumber: info.ticketNumber,
              source: info.source
            };
          })
          .filter(Boolean);

        sendResponse({ items });
      }
    );

    return true; // async Antwort
  }

  // OIDs aus Plenty-Order-Tabs holen (für "oonn")
  if (message.type === "GET_OIDS") {
    browserApi.tabs.query(
      {
        url: [
          "https://p7843.my.plentysystems.com/plenty/terra/order/order-ui/*",
          "https://*.plentymarkets-cloud-de.com/plenty/terra/order/order-ui/*"
        ]
      },
      (tabs) => {
        const items = tabs
          .map((tab) => {
            const oid = getOidFromUrl(tab.url || "");
            if (!oid) return null;
            return {
              tabId: tab.id,
              oid
            };
          })
          .filter(Boolean);

        sendResponse({ items });
      }
    );

    return true; // async Antwort
  }
});
