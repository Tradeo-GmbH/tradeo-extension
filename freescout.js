// Funktion zum Entfernen des target Attributs von allen Elementen mit target="_blank", außer den modifizierten PDF-Links
function removeTargetBlank() {
	document.querySelectorAll('[target="_blank"]').forEach(function(element) {
	  // Überspringe Elemente mit dem Attribut 'data-keep-target'
	  if (!element.hasAttribute('data-keep-target')) {
		element.removeAttribute('target');
	  }
	});
  }
  
  // Funktion zum Anpassen des Such-Links
  function adjustSearchLink() {
	var searchLink = document.getElementById('search-dt');
	if (searchLink) {
	  // Prüfe, ob 'search?q=' nicht in der aktuellen URL enthalten ist
	  if (!window.location.href.includes('search?q=')) {
		// Entferne das data-toggle Attribut
		searchLink.removeAttribute('data-toggle');
		// Passe href an
		searchLink.setAttribute('href', 'https://desk.tradeo.de/search?q=');
	  }
	}
  }
  
  // Funktion zum Modifizieren der PDF-Links
  function modifyPdfLinks() {
	// Selektiere alle <a> Elemente ohne 'download' Attribut
	var links = document.querySelectorAll('a:not([download])');
  
	links.forEach(function(link) {
	  var href = link.getAttribute('href');
	  if (href) {
		// Versuche, die URL zu parsen
		var url;
		try {
		  url = new URL(href, window.location.origin);
		} catch (e) {
		  // Falls die URL nicht geparst werden kann, überspringe diesen Link
		  return;
		}
		var pathname = url.pathname.toLowerCase();
		if (pathname.endsWith('.pdf')) {
		  // Klone das Element, um Event Listener zu entfernen
		  var newLink = link.cloneNode(true);
  
		  // Füge 'target="_blank"' hinzu
		  newLink.setAttribute('target', '_blank');
  
		  // Füge ein Attribut hinzu, um es von 'removeTargetBlank' auszuschließen
		  newLink.setAttribute('data-keep-target', 'true');
  
		  // Ersetze das Originalelement durch das geklonte Element
		  link.parentNode.replaceChild(newLink, link);
		}
	  }
	});
  }
  
  // Entferne target="_blank", passe den Such-Link an und modifiziere die PDF-Links beim Laden des DOM
  document.addEventListener('DOMContentLoaded', function() {
	removeTargetBlank();
	adjustSearchLink();
	modifyPdfLinks();
  });
  
  // Beobachte Änderungen im DOM, falls Elemente dynamisch hinzugefügt werden
  var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
	  if (mutation.addedNodes.length) {
		// Deaktiviere den Observer temporär, um Endlosschleifen zu vermeiden
		observer.disconnect();
  
		removeTargetBlank();
		adjustSearchLink();
		modifyPdfLinks();
  
		// Reaktiviere den Observer
		observer.observe(document.body, { childList: true, subtree: true });
	  }
	});
  });
  
  // Starte den Observer
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Überschreibe window.open, um neue Tabs zu verhindern
  (function() {
	var originalOpen = window.open;
	window.open = function(url, name, features) {
	  if (url) {
		window.location.href = url;
	  }
	  return null;
	};
  })();
  