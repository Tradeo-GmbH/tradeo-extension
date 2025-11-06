err = false;
rowCount = 0;
prevRowCount = 0;
variQuantStockArrayArchive = null;
variQuantStockArrayArchiveTab = null;
//auftragCopied = false;
//angebotConverted = false;
positionsToRemove = [];
duplicatedOrderId = null;
currentOrderTab = null;
prevOrderTab = null;
currentDuplicatedOrderTab = null;
itemSearchBarExists = null;
itemSearchBarExistsOld = null;
lastPath = "";
waitingForSearchBar = false;
if (localStorage.nwbSortSkip == undefined) localStorage.setItem("nwbSortSkip","yes");

if (typeof browser === "undefined") {
  window.browser = chrome;
}


eventInput = new Event('input', { bubbles: true })
eventChange = new Event('change', { bubbles: true })
eventEnterKeyPress = new KeyboardEvent('keydown', {
	key: 'Enter',         // Die Taste, die gedrückt wird
	code: 'Enter',        // Der Code der Taste
	keyCode: 13,          // Die numerische Darstellung der Enter-Taste
	which: 13,            // Legacy-Eigenschaft für Enter
	bubbles: true,        // Event darf nach oben propagieren
});
  

simulateMouseEvent = function(element, eventName, coordX, coordY) {
	element.dispatchEvent(new MouseEvent(eventName, {
	  view: window,
	  bubbles: true,
	  cancelable: true,
	  clientX: coordX,
	  clientY: coordY,
	  button: 0
	}));
};

simulateKeyboardEvent = function(element, key) {
	element.dispatchEvent(new KeyboardEvent('keydown', {'key': key}));
};

function sleep(time) {
	return new Promise(resolve => setTimeout(resolve, time));
  }
  
  async function waitForFiveDigitElements(thirdParent) {
	while (true) {
	  const matchingElements = Array.from(thirdParent.querySelectorAll('a')) // Wähle alle <a>-Unterelemente des dritten Parents
		.filter(el => /^[0-9]{5}$/.test(el.innerText.trim())); // Filtere nach genau 5-stelligen Zahlen
  
	  if (matchingElements.length > 0) {
		return matchingElements; // Gebe die gefundenen Elemente zurück, sobald mindestens ein Element gefunden wurde
	  }
  
	  await sleep(100); // Alle 100ms prüfen
	}
  }

function thousandSeparator(x){
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Einmalig Styles injizieren
(function injectButtonFX() {
  const styleId = 'buttonFX-attrs';
  if (document.getElementById(styleId)) return;

  const css = `
button[paymentMethodButton],
button[statusButton]{
  border: 1px solid rgba(0,0,0,.15);
  border-radius: 4px;
  font-weight: 600;
  letter-spacing: .01em;
  transition: transform .06s ease, box-shadow .12s ease, filter .12s ease, opacity .12s ease;
  box-shadow: 0 1px 1px rgba(0,0,0,.08);
}

button[paymentMethodButton]:not([disabled]),
button[statusButton]:not([disabled]){
  cursor: pointer;
}

/* Hover: leicht anheben + etwas heller/kräftiger */
button[paymentMethodButton]:not([disabled]):hover,
button[statusButton]:not([disabled]):hover{
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0,0,0,.18);
  filter: brightness(1.05) saturate(1.05);
}

/* Active (Mouse down): minimal drücken + etwas abdunkeln */
button[paymentMethodButton]:not([disabled]):active,
button[statusButton]:not([disabled]):active{
  transform: translateY(0) scale(.98);
  box-shadow: 0 1px 4px rgba(0,0,0,.22) inset;
  filter: brightness(0.92) saturate(.98);
}

/* Tastaturfokus klar sichtbar */
button[paymentMethodButton]:focus-visible,
button[statusButton]:focus-visible{
  outline: 2px solid #1a73e8;
  outline-offset: 2px;
}
`;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
})();


async function WBandSearch(tabnr, mode, search) {
	//console.log("starte WBandSearch Funktion...");
	if (tabnr == undefined || tabnr == null){
		tabnr = ""
	}
	var artikelTabSelector = "div\[class\=\"gwt-SplitLayoutPanel terra-full-screen articles_searchGuiItems" + tabnr + "\"\]"
	var artikelTab = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelector(artikelTabSelector)
	// Suche nach allen Labels
	const labels = Array.from(artikelTab.querySelectorAll('div.gwt-Label'));

	// Suche nach dem Element mit innerText "WB"
	const wbElement = labels.find(label => label.innerText.trim() === "WB");

	if (wbElement) {
		//console.log("WB-Element gefunden, mache weiter mit Klick auf das Element daneben, um Dropdown-Menü zu öffnen...");
		// Beispiel: Zugriff auf das nächste Element (z.B., ein Dropdown)
		const dropdown = wbElement.parentElement.nextElementSibling.firstChild.firstChild;
		if (dropdown) {
			dropdown.click(); // Klickt das nächste Element an, falls vorhanden
		} else {
			console.error("Kein benachbartes Dropdown-Element gefunden.");
		}
	} else {
		console.error("Kein Element mit innerText 'WB' gefunden.");
	}
	let targetElementClicked = false;
	const iframeDoc = document.querySelector('iframe[class="iframeBase"]').contentWindow.document;
	while (true) {
		// Suche nach allen Dropdown-Elementen
		const dropdownItems = Array.from(iframeDoc.querySelectorAll('span[class="gwt-InlineLabel"]'));

		// Finde das Element, dessen innerText mit mode übereinstimmt
		const targetElement = dropdownItems.find(item => item.innerText.trim() === mode);

		if (!targetElement && targetElementClicked) {
			//console.log("targetElement nicht mehr gefunden, und targetElement wurde zuvor geklickt. Fertig!")
			break;
		} else if (targetElement) {
			//console.log(`Mode = "${mode}", targetElement gefunden, klicke es im Dropdown-Menü und warte, bis es verschwindet.`);
			targetElementClicked = true;
			targetElement.click();
		}
		await sleep(10);
	}

	await sleep(10);

	// Suche und klicke das erste "Artikel"-Element im artikelTab
	const firstElement = Array.from(artikelTab.querySelectorAll('div.gwt-Label'))
		.find(item => item.innerText.trim() === "Artikel");

	if (!firstElement) {
		console.error("Erstes Artikel-Element nicht gefunden!!!");
	} else {
		//console.log("Erstes Artikel-Element gefunden, klicke es...");
		firstElement.click();
	}

	while (true) {
		await sleep(10);

		// Suche und klicke das zweite "Artikel"-Element im iframe
		const secondElement = Array.from(iframeDoc.querySelectorAll('span.gwt-InlineLabel'))
			.find(item => item.innerText.trim() === "Artikel");

		if (!secondElement) {
			//console.log("Zweites Artikel-Element nicht gefunden!!!");
		} else {
			//console.log("Zweites Artikel-Element gefunden, klicke es...");
			secondElement.click();
			break;
		}
	}

	if (search) {
		//console.log("search = true, suche Search Button...");
		Parent = artikelTab
		var length = artikelTab.querySelectorAll('button[data-icon="icon-search"]').length
		for (i = 0; i < length; i++) {
			let SearchBtn = artikelTab.querySelectorAll('button[data-icon="icon-search"]')[i]
			check = Parent.contains(SearchBtn)
			if (check) {
				//console.log("Search Button im richtigen Parent gefunden, mache weiter mit Klick...");
				break;
			}
		}
		if (!check) console.error("Search Button nicht gefunden!!!");
		artikelTab.querySelectorAll('button[data-icon="icon-search"]')[i].click()
		//console.log("search Button im richtigen Parent geklickt, Funktionsende");
	}
}

async function unhideArtikelSuchErgebnis(tabnr) {
	let artikelTabSelector = "div\[class\=\"gwt-SplitLayoutPanel terra-full-screen articles_searchGuiItems" + tabnr + "\"\]"
	let artUeb = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelector(artikelTabSelector)
	artUeb.querySelectorAll('div[class="PlentyTabContent"]')[3].setAttribute("style","display: none;")
	await sleep(100)
	var test = document.querySelector('terra-loading-spinner[hidden]')
	while (test == null){
		await sleep(300)
		test = document.querySelector('terra-loading-spinner[hidden]')
	}
	artUeb.querySelectorAll('div[class="PlentyTabContent"]')[3].removeAttribute("style")
}

async function nwbSwitch(tabnr){
	//console.log("nwbSwitch ausgeführt, tabnr = " + tabnr)
	if (tabnr == undefined || tabnr == null){
		tabnr = ""
	}
	var artikelTabSelector = "div\[class\=\"gwt-SplitLayoutPanel terra-full-screen articles_searchGuiItems" + tabnr + "\"\]"
	var artikelTab = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelector(artikelTabSelector)
	var form = document.createElement("form")
	var label = document.createElement("label")
	var input = document.createElement("input")
	var div = document.createElement("div")
	var div2 = document.createElement("div")
	var img = document.createElement("img")
	form.setAttribute("style","position: absolute; margin-left: 3px;")
	input.setAttribute("id","posnwb")
	label.setAttribute("class","switch")
	input.setAttribute("type","checkbox")
	div.setAttribute("class","slider")
	div2.setAttribute("class","hvr")
	img.setAttribute("src", chrome.runtime.getURL("nwb.png"));
	img.setAttribute("style","position: absolute; pointer-events: none;")
	Parent = artikelTab
	var length = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelectorAll('button[data-icon="icon-reset"]').length
	for (i = 0; i < length; i++) {
		ResetBtn = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelectorAll('button[data-icon="icon-reset"]')[i]
		answer = Parent.contains(ResetBtn)
		if (answer === true) break
	}
	document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelectorAll('button[data-icon="icon-reset"]')[i].parentElement.insertBefore(form, document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelectorAll('button[data-icon="icon-reset"]')[i].nextSibling)
	form.appendChild(label)
	label.appendChild(input)
	label.appendChild(div)
	label.appendChild(div2)
	label.appendChild(img)
	input.addEventListener('change', (event) => {
		var nwbSwitchState = "nwbSwitchStateTab" + tabnr
		if (window[nwbSwitchState] == false){
			window[nwbSwitchState] = true
			WBandSearch(tabnr, "Positiver Nettowarenbestand", true)
		} else {
			window[nwbSwitchState] = false
			WBandSearch(tabnr, "ALLE", true)
		}
		//console.log("nwbSwitch clicked")
	});
}

async function openArticles(tabnr){
	var artikelTabSelector = "div\[class\=\"gwt-SplitLayoutPanel terra-full-screen articles_searchGuiItems" + tabnr + "\"\]"
	var artikelTab = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelector(artikelTabSelector)
	var length = artikelTab.querySelectorAll('tr[class*="selected"]').length
	//console.log("es sind " + length + " Artikel ausgewählt")
	for (let i = 0; i < length; i++){
		await sleep(50)
		try {
			var test = artikelTab.querySelectorAll('tr[class*="selected"]')[i].classList.contains("selected")
			if (test == false){
				//console.log("skip false positive")
			} else {
				// STAND DER DINGE: Es wird immer nur ein Artikel geöffnet, evtl muss hier ein Delay eingefügt werden
				var theButton = artikelTab.querySelectorAll('tr[class*="selected"]')[i].querySelectorAll('td')[1]
				var box = theButton.getBoundingClientRect(),
						coordX = box.left + (box.right - box.left) / 2,
						coordY = box.top + (box.bottom - box.top) / 2;
				simulateMouseEvent (theButton, "click", coordX, coordY);
				var theButton = ""
				var box = ""
				//console.log("Öffne markierten Artikel...")
				await sleep(50)
				artikelTab.querySelectorAll('div[class*="gwt-TabLayoutPanelTab-selected"]')[1].parentElement.firstChild.click()
			}
		} catch (error) {
			err = true
			console.error(error.stack)
		} finally {
			if (err == true){
				err = false
				//console.log("starte openArticles() (ForLoop) erneut (continue start)")
				i--
				continue
			}
			//console.log("kein fehler, mache weiter...")
		}
	}
	//console.log("fertig!")
}

async function artOeffner(tabnr){
	//console.log("artOeffner ausgeführt, tabnr = " + tabnr)
	if (tabnr == undefined || tabnr == null){
		tabnr = ""
	}
	var artikelTabSelector = "div\[class\=\"gwt-SplitLayoutPanel terra-full-screen articles_searchGuiItems" + tabnr + "\"\]"
	var artikelTab = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelector(artikelTabSelector)
	artUebTemp = artikelTab
	var button = document.createElement("button")
	var label = document.createElement("label")
	var div = document.createElement("div")
	var div2 = document.createElement("div")
	var img = document.createElement("img")
	button.setAttribute("style","border: none; padding: 0px; position: absolute; width: 36px; height: 36px;")
	button.setAttribute("id","artOeffBtn")
	label.setAttribute("class","switch")
	div.setAttribute("class","slider2")
	div2.setAttribute("class","hvr")
	img.setAttribute("src", chrome.runtime.getURL("openMultipleItems.png"));
	img.setAttribute("style","position: relative; pointer-events: none;")
	artikelTab.querySelector('button[data-icon="icon-add"]').setAttribute("style","margin-left: 39px;")
	artikelTab.querySelector('button[data-icon="icon-add"]').parentElement.insertBefore(button, artikelTab.querySelector('button[data-icon="icon-add"]'))
	button.appendChild(label)
	label.appendChild(div)
	label.appendChild(div2)
	label.appendChild(img)
	button.addEventListener('click', (event) => {
		openArticles(tabnr)
	});
}

async function artikelUebersichtLauncher(){
	start:
	while(true){
		try {
			await sleep(500)
			var length = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelectorAll('div[class*="gwt-SplitLayoutPanel terra-full-screen articles_searchGuiItems"]').length
			var tabnr
			for (let i = 0; i < length; i++){
				//console.log("artikelUebersichtLauncher() reportet: tabnr = " + tabnr)
				var tabnr = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelectorAll('div[class*="gwt-SplitLayoutPanel terra-full-screen articles_searchGuiItems"]')[i].getAttribute("class")
				tabnr = tabnr.replace(/\D/g,'')
				var artikelTabVarName = "artikelTab" + tabnr
				if (window[artikelTabVarName] == undefined){
					//console.log(artikelTabVarName + " ist undefined")
					window[artikelTabVarName] = false
					//console.log("setze " + artikelTabVarName + " auf false")
					artikelUebersicht(tabnr)
				}
			}
		} catch (error) {
			err = true
			console.error(error.stack)
		} finally {
			if (err == true){
				err = false
				continue start
			}
			//console.log("kein fehler, mache weiter...")
		}
	}
}

async function artikelUebersicht(tabnr){
	var artikelTabVarName = "artikelTab" + tabnr
	window[artikelTabVarName] = true
	//console.log(artikelTabVarName + " ist true, execute artikelUebersicht(" + tabnr + ")...")
	var nwbSwitchSpawned = false
	start:
	while(true){
		window[artikelTabVarName] = true
		try {
			await sleep(500)
			//console.log("executing mainLoop artikelUebersicht(" + tabnr + ") - tabnr = " + tabnr)
			var artikelTabSelector = "div\[class\=\"gwt-SplitLayoutPanel terra-full-screen articles_searchGuiItems" + tabnr + "\"\]"
			var artUeb = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.querySelector(artikelTabSelector)
			if (artUeb == null){
				window[artikelTabVarName] = undefined
				return "cancelling artikelUebersicht(" + tabnr + "), because that tabnr doesn't exist anymore"
			}
			var check = artUeb.querySelector('button[id="artOeffBtn"]')
			//console.log("check = " + check)
			if (check == null){
				//console.log("artikelUebersicht(" + tabnr + ") - spawne artOeffBtn...")
				await artOeffner(tabnr)
			}
			var elem = artUeb.querySelector('button[data-icon="icon-reset"]')
			while (elem == null){
				await sleep(100)
				//console.log("executing waitForResetIconButtonLoop artikelUebersicht(" + tabnr + ") - tabnr = " + tabnr)
				elem = artUeb.querySelector('button[data-icon="icon-reset"]')
			}
			var resetButtonFixed = artUeb.querySelector('div[id="resetBtnMarker"]')
			if (resetButtonFixed == null){
				//console.log("artikelUebersicht(" + tabnr + ") - adde eventListener zum Reset-Button...")
				var resetBtnMarker = document.createElement('div')
				resetBtnMarker.setAttribute("style","display: none;")
				resetBtnMarker.setAttribute("id","resetBtnMarker")
				artUeb.appendChild(resetBtnMarker)
				elem.addEventListener("click", e => {
					//console.log("PosNWB clicked")
					var nwbSwitchState = "nwbSwitchStateTab" + tabnr
					if (window[nwbSwitchState] == true){
						//console.log("resetBtn geklickt, überlebe PosNWB wegen nwbSwitchState true!")
						WBandSearch(tabnr, "Positiver Nettowarenbestand", false)
					}
					artUeb.querySelectorAll('div[class="PlentyTabContent"]')[3].setAttribute("style","display: none;")
				});
			}
			var elem = artUeb.querySelector('button[data-icon="icon-search"]')
			while (elem == null){
				await sleep(100)
				//console.log("executing waitForResetIconButtonLoop artikelUebersicht(" + tabnr + ") - tabnr = " + tabnr)
				elem = artUeb.querySelector('button[data-icon="icon-search"]')
			}
			var searchButtonFixed = artUeb.querySelector('div[id="searchBtnMarker"]')
			if (searchButtonFixed == null){
				//console.log("artikelUebersicht(" + tabnr + ") - adde eventListener zum Reset-Button...")
				var searchBtnMarker = document.createElement('div')
				searchBtnMarker.setAttribute("style","display: none;")
				searchBtnMarker.setAttribute("id","searchBtnMarker")
				artUeb.appendChild(searchBtnMarker)
				elem.addEventListener("click", e => {
					var test = artUeb.querySelector('div[class="PlentyPager"]').querySelector('div[id="hinweisDivMultSeitenNWBSorter"]')
					if (test !== null) test.remove()
					unhideArtikelSuchErgebnis(tabnr)
				});
			}
			var test = artUeb.querySelector('input[id="posnwb"]')
			if (test == null && nwbSwitchSpawned == true){
				artikelTabVarName = "artikelTab" + tabnr
				window[artikelTabVarName] = true
				//console.log("artikelUebersicht(" + tabnr + ") - " + artikelTabVarName + " ist true, execute artikelUebersicht erneut nach Funktions-Restart wegen TAB NEU GELADEN...")
				nwbSwitchSpawned = false
				continue start
			}
			if (test == null){
				var nwbSwitchState = "nwbSwitchStateTab" + tabnr
				window[nwbSwitchState] = false
				//console.log("executing nwbSwitch()...")
				//console.log("artikelUebersicht(" + tabnr + ") - spawne nwbSwitch...")
				await nwbSwitch(tabnr)
				nwbSwitchSpawned = true
			}
			var crit = artUeb.querySelector('tr[class*="PlentyDataTableTR PlentyDataTable"]')
			if (crit == null){
				//console.log("restarting artikelUebersicht(" + tabnr + ") - keine Artikelsuchergebnisse vorliegend")
				continue start
			}
			//console.log("artikelUebersicht(" + tabnr + ") - Suchergebnis gefunden, spawne Artikelzeilen-Buttons...")
			var length1 = true
			var length2 = false
			while (length1 !== length2){
				//console.log("executing length !== length2 loop artikelUebersicht(" + tabnr + ") - tabnr = " + tabnr)
				length1 = artUeb.querySelectorAll('tr[class*="PlentyDataTableTR PlentyDataTable"]').length
				await sleep(200)
				length2 = artUeb.querySelectorAll('tr[class*="PlentyDataTableTR PlentyDataTable"]').length
			}
			var test = artUeb.querySelector('th')
			var spawn = false
			if (test !== null){
				//console.log("leiste existiert!")
				var length = artUeb.querySelector('thead').querySelectorAll('th').length
				var sorterNWB
				for (let i = 0; i < length; i++){
					var sorter = artUeb.querySelector('thead').querySelectorAll('th')[i]
					if (sorter.innerText.includes("WB netto") === false) continue
					sorterNWB = sorter
					var nwbSrc = i
					test = sorter.querySelector('div[class*="tableSorter"]')
					if (test !== null) break
					spawn = true
					break
				}
			}
			if (spawn == true){
				var tableSorter = artUeb.querySelectorAll('div[class*="tableSorter"]')
				for (let i = 0; i < tableSorter.length; i++){
					tableSorter[i].addEventListener("click", e => {
						localStorage.setItem("nwbSortSkip","yes")
					});
				}
				var length = artUeb.querySelector('thead').querySelectorAll('th').length
				var sorterAID
				for (let i = 0; i < length; i++){
					var sorter = artUeb.querySelector('thead').querySelectorAll('th')[i]
					if (sorter.innerText !== "Artikel-ID") continue
					sorterAID = sorter
				}
				if (sorterAID !== undefined){
					var el = sorterAID.querySelector('div[class*="tableSorter"]')
					var elClone = el.cloneNode(true);
					elClone.setAttribute("id","nwbSortBtn")
					if (elClone.hasAttribute('style')) {
						elClone.removeAttribute('style');
					}					  
					sorterNWB.querySelector('div').insertBefore(elClone, sorterNWB.querySelector('div').lastChild)
					if (localStorage.nwbSortState == "aufsteigend" || localStorage.nwbSortState == undefined) elClone.setAttribute("class","tableSorter up")
					else if (localStorage.nwbSortState == "absteigend") elClone.setAttribute("class","tableSorter down")
					elClone.addEventListener("click", e => {
						var test = artUeb.querySelector('div[class="PlentyPager"]').querySelector('div[id="hinweisDivMultSeitenNWBSorter"]')
						if (test == null){
							let pageCnt = artUeb.querySelector('div[class="PlentyPager"]').querySelectorAll('div[class="gwt-Label"]')[1].innerText
							pageCnt = pageCnt.substr(4)
							if (isNaN(pageCnt) == false){
								pageCnt = Number(pageCnt)
								if (pageCnt > 1){
									var hinweisDivMultSeitenNWBSorter = document.createElement('div')
									var spacer1 = document.createElement('div')
									var spacer2 = document.createElement('div')
									var spacer3 = document.createElement('div')
									hinweisDivMultSeitenNWBSorter.setAttribute("class","gwt-Label bold")
									spacer1.setAttribute("class","gwt-Label bold")
									spacer2.setAttribute("class","gwt-Label bold")
									spacer3.setAttribute("class","gwt-Label bold")
									hinweisDivMultSeitenNWBSorter.setAttribute("style","color: #FF0000")
									hinweisDivMultSeitenNWBSorter.setAttribute("id","hinweisDivMultSeitenNWBSorter")
									var newContent = document.createTextNode("WARNUNG: Sortierung nach NWB erfolgt nur seitenweise! Eine andere Seite der Suchergebnisse kann Artikel mit höherem Bestand enthalten!")
									hinweisDivMultSeitenNWBSorter.appendChild(newContent)
									artUeb.querySelector('div[class="PlentyPager"]').appendChild(spacer1)
									artUeb.querySelector('div[class="PlentyPager"]').appendChild(spacer2)
									artUeb.querySelector('div[class="PlentyPager"]').appendChild(spacer3)
									artUeb.querySelector('div[class="PlentyPager"]').appendChild(hinweisDivMultSeitenNWBSorter)
								}
							}
						}
						// erstmal den ButtonMode umstellen von aufwärts auf abwärts bzw. umgekehrt
						localStorage.setItem("nwbSortSkip","no")
						var mode = elClone.getAttribute("class")
						if (mode == "tableSorter up") elClone.setAttribute("class","tableSorter down")
						else elClone.setAttribute("class","tableSorter up")
						// vorhandene Zeilen sortieren
						length = artUeb.querySelectorAll('tr[class*="PlentyDataTableTR PlentyDataTable"]').length
						nwbArr = []
						for (let i = 0; i < length; i++){
							//console.log("executing for loop 1")
							var currentArticle = artUeb.querySelectorAll('tr[class*="PlentyDataTableTR PlentyDataTable"]')[i]
							var nwbCurrentArticle = currentArticle.querySelectorAll('td[class="PlentyDataTableTD"]')[nwbSrc].innerText
							nwbCurrentArticle = nwbCurrentArticle.replace(/\./g, "")
							if (isNaN(nwbCurrentArticle) == false){
								nwbCurrentArticle = Number(nwbCurrentArticle)
							} else {
								if (nwbCurrentArticle == "∞") nwbCurrentArticle = 0.75
								else if (nwbCurrentArticle == "P") nwbCurrentArticle = 0.5
								else nwbCurrentArticle = -1
							}
							var currentArr = [nwbCurrentArticle,i]
							nwbArr.push(currentArr)
						}
						if (mode == "tableSorter up"){
							localStorage.setItem("nwbSortState", "absteigend")
							var sortedArr = nwbArr.sort(function(a, b) {
								if (a[0] == b[0]) {
									return a[1] - b[1];
								}
								return b[0] - a[0];
							});
						} else {
							localStorage.setItem("nwbSortState", "aufsteigend")
							var sortedArr = nwbArr.sort(function(a, b) {
								if (a[0] == b[0]) {
									return a[1] - b[1];
								}
								return a[0] - b[0];
							});
						}
						var parent = artUeb.querySelector('tr[class*="PlentyDataTableTR PlentyDataTable"]').parentElement
						for (let i = 0; i < sortedArr.length; i++){
							var currentArticle = artUeb.querySelectorAll('tr[class*="PlentyDataTableTR PlentyDataTable"]')[sortedArr[i][1]]
							var currentArticleClone = currentArticle.cloneNode(true);
							var currentArticleBtnRow = artUeb.querySelectorAll('div[id*="artSuche"]')[sortedArr[i][1]]
							var currentArticleBtnRowClone = currentArticleBtnRow.cloneNode(true);
							parent.appendChild(currentArticle)
							parent.appendChild(currentArticleBtnRow)
							parent.insertBefore(currentArticleClone, artUeb.querySelectorAll('tr[class*="PlentyDataTableTR PlentyDataTable"]')[sortedArr[i][1]])
							parent.insertBefore(currentArticleBtnRowClone, currentArticleClone.nextSibling)
						}
						for (let i = 0; i < sortedArr.length; i++){
							artUeb.querySelector('tr[class*="PlentyDataTableTR PlentyDataTable"]').remove()
							artUeb.querySelector('div[id*="artSuche"]').remove()
						}
						for (let i = 0; i < sortedArr.length; i++){
							if(i % 2==0) artUeb.querySelectorAll('tr[class*="PlentyDataTableTR PlentyDataTable"]')[i].setAttribute("class","PlentyDataTableTR PlentyDataTableEvenRow")
							else artUeb.querySelectorAll('tr[class*="PlentyDataTableTR PlentyDataTable"]')[i].setAttribute("class","PlentyDataTableTR PlentyDataTableOddRow")
						}
					});
				}
			}
			var currentIDSrc
			var bezSrc
			var bvpSrc
			var nwbSrc
			var cnt = 0
			for (let i = 0; i < length2; i++){
				var length = artUeb.querySelector('thead').querySelectorAll('th').length
				for (let i = 0; i < length; i++){
					var dataType = artUeb.querySelector('thead').querySelectorAll('th')[i].innerText
					if (dataType == "Artikel-ID"){
						currentIDSrc = i
					} else if (dataType.includes("Name") === true){
						bezSrc = i
					} else if (dataType.includes("Verkaufspreis") === true){
						bvpSrc = i
					} else if (dataType.includes("WB netto") === true){
						nwbSrc = i
					}
				}
				if (currentIDSrc == undefined){
					//alert('TRADEO EXTENSION FEHLER: Artikel-ID Spalte in Artikel Bearbeiten Tab nicht gefunden!')
					break
				} else if ( bezSrc == undefined){
					//alert('TRADEO EXTENSION FEHLER: Name Spalte in Artikel Bearbeiten Tab nicht gefunden!')
					break
				} else if ( bvpSrc == undefined){
					//alert('TRADEO EXTENSION FEHLER: Verkaufspreis Spalte in Artikel Bearbeiten Tab nicht gefunden!')
					break
				} else if ( nwbSrc == undefined){
					//alert('TRADEO EXTENSION FEHLER: WB netto Spalte in Artikel Bearbeiten Tab nicht gefunden!')
					break
				}
				var currentArticle = artUeb.querySelectorAll('tr[class*="PlentyDataTableTR PlentyDataTable"]')[i]
				var length = currentArticle.querySelectorAll('td[class="PlentyDataTableTD"]')
				var test = currentArticle.querySelectorAll('td[class="PlentyDataTableTD"]')[1].querySelector('div[class="gwt-Label PlentyDataTableDiv"]')
				while (test == null){
					await sleep(100)
					//console.log("executing PlentyDataTableTd.1 loop artikelUebersicht(" + tabnr + ") - tabnr = " + tabnr)
					test = currentArticle.querySelectorAll('td[class="PlentyDataTableTD"]')[1].querySelector('div[class="gwt-Label PlentyDataTableDiv"]')
				}
				var currentID = currentArticle.querySelectorAll('td[class="PlentyDataTableTD"]')[currentIDSrc].querySelector('div[class="gwt-Label PlentyDataTableDiv"]').innerText
				var bez = currentArticle.querySelectorAll('td[class="PlentyDataTableTD"]')[bezSrc].innerText
				var bvp = currentArticle.querySelectorAll('td[class="PlentyDataTableTD"]')[bvpSrc].innerText
				var nwb = currentArticle.querySelectorAll('td[class="PlentyDataTableTD"]')[nwbSrc].innerText
				if (nwb.length > 3 && nwb.includes(",") == true){
					nwb = nwb.slice(0,-3)
				}
				nwb = nwb.replace(/\./g,"")
				if (isNaN(nwb) == false){
					nwb = Number(nwb)
				}
				var rfqp = bvp.replace(".","")
				var rfqp = rfqp.replace(",",".")
				var rfqp = Math.round(rfqp/1.19*0.9-0.5)
				var rfqp = thousandSeparator(rfqp)
				var nwb2 = thousandSeparator(nwb)
				if (nwb !== "P"){
					var rfqTextDE = bez + "\n(Art.ID " + currentID + ") kann ich anbieten für " + rfqp + " € netto / Stk. - " + nwb2 + " Stk. verfügbar\n\n"
					var rfqTextEN = bez + "\n(Art.ID " + currentID + ") I can offer for € " + rfqp + " net / pcs. - " + nwb2 + " pcs. available\n\n"
				} else {
					var rfqTextDE = bez + "\n(Art.ID " + currentID + ") kann ich anbieten für " + rfqp + " € netto / Stk. - xxxPLATZHALTERxxx Stk. verfügbar\n\nHINWEIS AN MITARBEITER: MANUELL BESTAND VOM BUNDLE PRÜFEN UND NACHTRAGEN!!!"
					var rfqTextEN = bez + "\n(Art.ID " + currentID + ") I can offer for € " + rfqp + " net / pcs. - xxxPLATZHALTERxxx pcs. available\n\nHINWEIS AN MITARBEITER: MANUELL BESTAND VOM BUNDLE PRÜFEN UND NACHTRAGEN!!!"
				}
				var btnID = "artSuche" + currentID + "-" + tabnr
				var test = document.querySelector('iframe[class="iframeBase"]').contentWindow.document.getElementById(btnID)
				if (test !== null){
					continue
				}
				cnt++
				var newDiv = document.createElement("div")
				var artBtn = document.createElement("button")
				var artBtn2 = document.createElement("button")
				var artBtn3 = document.createElement("button")
				var artBtn4 = document.createElement("button")
				var rfqBtnDE = document.createElement("button")
				var rfqBtnEN = document.createElement("button")
				var shopLink = "https://servershop24.de/a-" + currentID + "/"
				dataDE = bez + "\nhttps://servershop24.de/a-" + currentID + "/"
				dataEN = bez + "\nhttps://servershop24.de/en/a-" + currentID + "/"
				dataShop = "window.open('" + shopLink + "');"
				newDiv.id = btnID
				artBtn.id = btnID
				artBtn.value = currentID
				artBtn2.value = dataDE
				artBtn3.value = dataEN
				rfqBtnDE.value = rfqTextDE
				rfqBtnEN.value = rfqTextEN
				artBtn4.setAttribute("onclick", dataShop)
				artBtn.setAttribute("class", "copy7")
				artBtn2.setAttribute("class", "copy8")
				artBtn3.setAttribute("class", "copy8")
				artBtn2.setAttribute("href", dataDE)
				artBtn3.setAttribute("href", dataEN)
				rfqBtnDE.setAttribute("class", "copy7")
				rfqBtnEN.setAttribute("class", "copy7")
				var newContent = document.createTextNode(currentID)
				var newContent2 = document.createTextNode("DE")
				var newContent3 = document.createTextNode("EN")
				var newContent4 = document.createTextNode("→ Shop")
				var newContent5 = document.createTextNode("RFQ DE")
				var newContent6 = document.createTextNode("RFQ EN")
				artBtn.appendChild(newContent)
				artBtn2.appendChild(newContent2)
				artBtn3.appendChild(newContent3)
				artBtn4.appendChild(newContent4)
				rfqBtnDE.appendChild(newContent5)
				rfqBtnEN.appendChild(newContent6)
				newDiv.style = "position: relative; top: -20px; height: 0px;"
				artBtn.style = "text-align: center; font-size: 80%; position: relative; margin-left: auto; margin-right: auto; margin-top: 0px; margin-bottom: 0px; width: 50px; top: 4px; line-height: 1; height: 13px;"
				artBtn2.style = "text-align: center; font-size: 80%; position: relative; margin-left: -2px; margin-right: auto; top: 4px; line-height: 1; height: 13px;"
				artBtn3.style = "text-align: center; font-size: 80%; position: relative; margin-left: -2px; margin-right: auto; top: 4px; line-height: 1; height: 13px;"
				artBtn4.style = "text-align: center; font-size: 80%; position: relative; margin-left: -2px; margin-right: auto; top: 4px; line-height: 1; height: 13px;"
				rfqBtnDE.style = "text-align: center; font-size: 80%; position: relative; margin-left: 20px; margin-right: auto; top: 4px; line-height: 1; height: 13px;"
				rfqBtnEN.style = "text-align: center; font-size: 80%; position: relative; margin-left: -2px; margin-right: auto; top: 4px; line-height: 1; height: 13px;"
				currentArticle.parentElement.insertBefore(newDiv, currentArticle.nextSibling)
				newDiv.appendChild(artBtn)
				if (nwb > 0 || nwb == "∞" || nwb == "P"){
					newDiv.appendChild(artBtn4)
					newDiv.appendChild(artBtn2)
					newDiv.appendChild(artBtn3)
					newDiv.appendChild(rfqBtnDE)
					newDiv.appendChild(rfqBtnEN)
					if (nwb !== "P"){
						// attribute grün (ist Bestand positiv oder unendlich)
						let length = currentArticle.querySelectorAll('td').length
						for (let i = 0; i < length; i++){
							if (i == 0){// stellt beim ersten Loop die Spaltenbreite sicher
								artUeb.querySelector('thead').querySelectorAll('th')[nwbSrc].setAttribute("style","width: 55px;")
							}
							if (i !== nwbSrc){// lässt NWB Feld uneingefärbt für bessere Leserlichkeit
								currentArticle.querySelectorAll('td')[i].setAttribute("style","background-color:rgba(159,255,159,0.25);")
							} else {
								if (isNaN(nwb) == false){
									currentArticle.querySelectorAll('td')[i].querySelector('div').innerText = nwb2
								}
								currentArticle.querySelectorAll('td')[i].setAttribute("style","width: 55px; text-align: right;")
								currentArticle.querySelectorAll('td')[i].querySelector('div').setAttribute("class","gwt-Label PlentyDataTableDiv")
								currentArticle.querySelectorAll('td')[i].querySelector('div').setAttribute("style","font-size: 120%; font-weight: bold; color: #00AA00;")
							}
						}
					} else {
						// attribute gelb (ist Bundle mit Bestand P)
						let length = currentArticle.querySelectorAll('td').length
						for (let i = 0; i < length; i++){
							if (i == 0){// stellt beim ersten Loop die Spaltenbreite sicher
								artUeb.querySelector('thead').querySelectorAll('th')[nwbSrc].setAttribute("style","width: 55px;")
							}
							if (i !== nwbSrc){// lässt NWB Feld uneingefärbt für bessere Leserlichkeit
								currentArticle.querySelectorAll('td')[i].setAttribute("style","background-color:rgba(255,255,159,0.25);")
							} else {
								currentArticle.querySelectorAll('td')[i].setAttribute("style","width: 55px; text-align: right;")
								currentArticle.querySelectorAll('td')[i].querySelector('div').setAttribute("style","font-size: 120%; font-weight: bold;")
							}
						}
					}
				} else {
					// attribute rot (ist Bestand 0 oder kleiner oder was anderes, nicht anderweitig erwähntes)
					let length = currentArticle.querySelectorAll('td').length
					for (let i = 0; i < length; i++){
						if (i == 0){// stellt beim ersten Loop die Spaltenbreite sicher
							artUeb.querySelector('thead').querySelectorAll('th')[nwbSrc].setAttribute("style","width: 55px;")
						}
						if (i !== nwbSrc){// lässt NWB Feld uneingefärbt für bessere Leserlichkeit
							currentArticle.querySelectorAll('td')[i].setAttribute("style","background-color:rgba(255,159,159,0.25);")
						} else {
							if (isNaN(nwb) == false){
								currentArticle.querySelectorAll('td')[i].querySelector('div').innerText = nwb2
							}
							if (nwb < 0){
								currentArticle.querySelectorAll('td')[i].setAttribute("style","width: 55px; text-align: right; background-color: #ff0000;")
								currentArticle.querySelectorAll('td')[i].querySelector('div').setAttribute("style","font-size: 120%; font-weight: bold; color: #fff;")
							}
							else {
								currentArticle.querySelectorAll('td')[i].setAttribute("style","width: 55px; text-align: right;")
								currentArticle.querySelectorAll('td')[i].querySelector('div').setAttribute("style","font-size: 120%; font-weight: bold;")
							}
						}
					}
				}
				artBtn.addEventListener("click", e => {
					//console.log("copy7 clicked")
					var AID = e.target.value
					navigator.clipboard.writeText(AID)
				});
				if (nwb > 0 || nwb == "∞" || nwb == "P"){
					artBtn2.addEventListener("click", e => {
						//console.log("copy8 clicked")
						var ShopLink = e.target.value
						navigator.clipboard.writeText(ShopLink)
					});
					artBtn3.addEventListener("click", e => {
						//console.log("copy8 clicked")
						var ShopLink = e.target.value
						navigator.clipboard.writeText(ShopLink)
					});
					rfqBtnDE.addEventListener("click", e => {
						//console.log("copy7 clicked")
						var RFQ = e.target.value
						navigator.clipboard.writeText(RFQ)
					});
					rfqBtnEN.addEventListener("click", e => {
						//console.log("copy7 clicked")
						var RFQ = e.target.value
						navigator.clipboard.writeText(RFQ)
					});
				}
			}
			if (cnt == 0 || localStorage.nwbSortSkip == "yes") continue start
			if (localStorage.nwbSortState == "aufsteigend"){
				localStorage.setItem("nwbSortState", "absteigend")
				artUeb.querySelector('div[id="nwbSortBtn"]').setAttribute("class","tableSorter down")
				artUeb.querySelector('div[id="nwbSortBtn"]').click()
			}
			else if (localStorage.nwbSortState == "absteigend"){
				localStorage.setItem("nwbSortState", "aufsteigend")
				artUeb.querySelector('div[id="nwbSortBtn"]').setAttribute("class","tableSorter up")
				artUeb.querySelector('div[id="nwbSortBtn"]').click()
			}
		} catch (error) {
			err = true
			console.error(error.stack)
		} finally {
			if (err == true){
				err = false
				//console.log("starte artikelUebersicht erneut (continue start)")
				continue start
			}
			//console.log("kein fehler, mache weiter...")
		}
	}
}

async function waitForElementsAndSwapBack() {
    while (true) {
        const elements = document.querySelectorAll('terra-my-view-row');

        if (elements.length === 2) {
            // Greife auf den gemeinsamen Parent zu

            // Überprüfen, ob ein Parent existiert und die Anzahl der Kinder stimmt
            // Und ob das zweite Element nicht schon bearbeitet wurde
            if (elements[0] && elements[1] && !elements[0].hasAttribute('data-swapped')) {
                // Markiere das zweite Element als bearbeitet
                elements[0].setAttribute('data-swapped', 'true');
				elements[0].setAttribute('style', 'display: none;');
				await sleep(0);
				elements[0].setAttribute('style', 'display: block;');

                // Tausche die beiden Elemente

                //console.log("hide and unhide complete");
                break;
            }
			if (elements[0].hasAttribute('data-swapped')) break;
        }
        await sleep(1); // Kurze Pause, bevor erneut überprüft wird
    }
}

async function refreshAuftragspositionen() {
	while (true) {
	  try {
		// 1️⃣ <mat-panel-title> finden
		const panelTitleEl = Array.from(
		  document.querySelectorAll('mat-panel-title')
		).find(el => el.textContent.trim().includes('Auftragspositionen'));
  
		if (!panelTitleEl) {
		  await sleep(100);
		  continue;
		}
  
		// 2️⃣ dritten Parent ermitteln
		let thirdParent = panelTitleEl;
		for (let i = 0; i < 3 && thirdParent; i++) {
		  thirdParent = thirdParent.parentElement;
		}
		if (!thirdParent) {
		  await sleep(100);
		  continue;
		}
  
		// 3️⃣ <mat-icon> mit Text „refresh“ suchen
		const refreshIcon = Array.from(
		  thirdParent.querySelectorAll('mat-icon')
		).find(icon => icon.textContent.trim() === 'refresh');
  
		if (!refreshIcon) {
		  await sleep(100);
		  continue;
		}
  
		// 4️⃣ Parent-Element des Icons klicken
		const clickableEl = refreshIcon.parentElement;
		if (clickableEl && typeof clickableEl.click === 'function') {
		  clickableEl.click();
		  //console.log("refreshAuftragspositionen ausgeführt, Refresh-Button geklickt...");
		  return true; // Erfolg, Funktion beendet
		}
	  } catch (err) {
		// Bei DOM-Änderungen können kurze Exceptions auftreten – ignorieren
	  }
  
	  await sleep(100); // erneut versuchen
	}
}

async function monitorOrderPage() {
	let currentOrderId = null; // Aktuelle OID speichern
	let override = false;
	let skip = false;
	//let unwantedBundleItemsPresent = false;
	//let angebotConvertedRelevant = false;
	//let auftragCopiedRelevant = false;
  
	while (true) {
		await new Promise(resolve => setTimeout(resolve, 100)); // Warte 100ms vor der nächsten Überprüfung
		/*if (auftragCopied) {
			auftragCopied = false;
			auftragCopiedRelevant = true;
			//console.log("auftragCopied von true auf false gesetzt, auftragCopiedRelevant auf true gesetzt")
		}

		if (angebotConverted) {
			angebotConverted = false;
			angebotConvertedRelevant = true;
			//console.log("angebotConverted von true auf false gesetzt, angebotConvertedRelevant auf true gesetzt")
		}
		*/
		const url = window.location.href;
		const currentOrderIdMatch = url.match(
			/\/plenty\/terra\/order\/(order-ui[^/]*)\/.*?(\d{6})/
			);
		currentOrderTab = currentOrderIdMatch?.[1];
		if (currentOrderTab !== prevOrderTab && prevOrderTab !== null) {
			//console.warn("Auftragstab von " + prevOrderTab + " auf " + currentOrderTab + " geändert!");
			await waitForElementsAndSwapBack();
			await refreshAuftragspositionen();
		};
		prevOrderTab = currentOrderTab;
		
		if (skip) {
			continue;
		}

		await waitForElementsAndSwapBack();
		/*
		if (unwantedBundleItemsPresent) {
			unwantedBundleItemsPresent = false;
			await removeUnwantedBundleItems();
		}
		*/
		const regex = /plenty\/terra\/order\/order-ui[^/]*\/.*(\d{6})/; // Regex für order-ui mit Anhang vor dem nächsten /
		const match = url.match(regex);


		// Überprüfe, ob Dummy-Elemente noch vorhanden sind. Falls nicht, setze currentOrderId zurück.
		const dummyCheckPre = document.querySelector('.update-marker');
		if (dummyCheckPre) {
			continue;
		}

		

  
		if (match && match[1]) {
			const newOrderId = match[1]; // Extrahiere die neue OID
		
			// Wenn es noch keinen Auftrag gab oder die OID sich geändert hat, oder override aktiv ist
			if (currentOrderId !== newOrderId || override) {
				adjustAuftragLayout();
				const auftragsTypSource = [...document.querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Auftragstyp");
				if (!auftragsTypSource) {
					continue;
				}
				let auftragsTyp = null;
				if (!auftragsTypSource.querySelector('input')){
					continue;
				}
				auftragsTyp = auftragsTypSource.querySelector('input').value;
				const statusSource = [...document.querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Status");
				if (!statusSource.parentNode.querySelector('span')){
					continue;
				}
				const statusText = statusSource.parentNode.querySelector('span').innerText;
				let statusCanceled = false;
				if (statusText.toLowerCase().includes('storn')) {
					statusCanceled = true;
				}				
				//console.log("Auftragstyp: " + auftragsTyp);
				//console.log("Status: " + statusText);
				override = false;
				currentOrderId = newOrderId;
				//console.log(`Auftrag geöffnet. OID = ${currentOrderId}`);
		
				// Ausführen des Snippets: Suche nach "Auftragspositionen" und fünfstelligen Nummern
				let elements = [];
				while (elements.length === 0) {
					elements = Array.from(document.querySelectorAll('mat-panel-title.mat-expansion-panel-header-title'))
						.filter(el => el.innerText.includes('Auftragspositionen'));
					await new Promise(resolve => setTimeout(resolve, 100)); // Warte 100ms, wenn kein Element gefunden
				}
		
				const thirdParent = elements[0].parentElement.parentElement.parentElement;
		
				// 1. Variantenummern erfassen (4- oder 5-stellige Zahlen)
				let variantenummernArray = [];
				const variantenummernElements = Array.from(thirdParent.querySelectorAll('a'))
					.filter(el => /^[0-9]{4,5}$/.test(el.innerText.trim())); // 4- oder 5-stellige Zahlen filtern
		
				variantenummernArray = variantenummernElements.map(el => el.innerText.trim());
		
				// 2. Suchen des ersten <thead> und die Spalte mit "Menge" ermitteln
				const thead = thirdParent.querySelector('thead'); // Das erste thead im thirdParent
				let thElements = null;
				let mengeIndex = -1;
				let artikelIdIndex = -1;
				let nameIndex = -1;
				if (thead) {
					thElements = Array.from(thead.querySelectorAll('th')); // Alle th-Elemente im thead
					mengeIndex = thElements.findIndex(th => th.innerText.trim().includes('Menge')); // Finde den Index der Spalte mit "Menge"
					artikelIdIndex = thElements.findIndex(th => th.innerText.trim().includes('Artikel-ID'));
					nameIndex = thElements.findIndex(th => th.innerText.trim() === 'Artikelname'); // Finde den Index der Spalte mit "Name"
				}

				// 3. Artikel-IDs erfassen (entsprechend der "Artikel-ID"-Spalte)
				let artikelIdArray = [];
				let artikelNameArray = [];
				let mengeArray = [];
				const tbody = thirdParent.querySelector('tbody');
				let trElements = null;
				if (tbody) {
					trElements = Array.from(tbody.querySelectorAll('tr')).filter(tr => !tr.classList.contains('button-row')); // Nur die Original-Datenzeilen
				}

				if (artikelIdIndex !== -1) {
					if (tbody) {
						// Durchlaufen von vornherein nur der ungeraden Zeilen
						for (let i = 0; i < trElements.length; i += 2) {
							const tr = trElements[i];
							const tdElements = tr.querySelectorAll('td'); // Alle td-Elemente in der Zeile

							if (tdElements[artikelIdIndex]) {
								artikelIdArray.push(tdElements[artikelIdIndex].innerText.trim()); // Artikel-ID extrahieren
							}
						}
					}
				}

				// 3.1 Artikelnamen erfassen (entsprechend der "Name"-Spalte)
				

				if (nameIndex !== -1) {
					if (tbody) {
						// Durchlaufen von vornherein nur der ungeraden Zeilen
						for (let i = 0; i < trElements.length; i += 2) {
							const tr = trElements[i];
							const tdElements = tr.querySelectorAll('td'); // Alle td-Elemente in der Zeile

							if (tdElements[nameIndex]) {
								artikelNameArray.push(tdElements[nameIndex].innerText.trim()); // Artikelnamen extrahieren
							}
						}
					}
				}

				// 3.2 Mengen erfassen (entsprechend der "Menge"-Spalte)
				
		
				if (mengeIndex !== -1) {
					if (tbody) {		
						// Durchlaufen von vornherein nur der ungeraden Zeilen
						for (let i = 0; i < trElements.length; i += 2) {
							tr = trElements[i];
							tdElements = tr.querySelectorAll('td'); // Alle td-Elemente in der Zeile
		
							if (tdElements[mengeIndex]) {
								mengeArray.push(Number(tdElements[mengeIndex].innerText.split(' ')[0].trim())); // Menge extrahieren
							}
						}
					}
				}
		
				// 4. Länge der Arrays abgleichen und fortsetzen bei leeren Arrays
				if (variantenummernArray.length === 0 && mengeArray.length === 0) {
					// Beide Arrays leer -> Weiter mit dem nächsten Loop
					//console.log('Keine Variantenummern und Mengen gefunden, Loop wird fortgesetzt.');
					override = true;
					continue;
				} else if (variantenummernArray.length !== mengeArray.length) {
					// Array Lengths stimmen nicht überein -> Weiter mit dem nächsten Loop
					//console.log('Array Lengths stimmen nicht überein. Variantenummern-Array:', variantenummernArray, 'Mengen-Array:', mengeArray);
					// Entferne alle hinzugefügten Zeilen mit den Buttons
					const buttonRows = document.querySelectorAll('.button-row'); // Selektiere alle hinzugefügten Button-Zeilen
					buttonRows.forEach(row => row.remove()); // Entferne jede dieser Zeilen
					override = true;
					continue;
				}
		
				// Zusammenfügen der vier Arrays in ein Objekt-Array
				let variQuantStockArray = variantenummernArray.map((variationId, index) => {
					return {
						variationId: variationId,
						menge: mengeArray[index],
						artikelId: artikelIdArray[index], // Artikel-ID hinzufügen
						artikelName: artikelNameArray[index], // Artikelnamen hinzufügen
						totalNetStock: 0 // Placeholder für späteres Hinzufügen
					};
				});


		
				// 5. Gesamtmengen pro VariationID berechnen
				let totalOrderedQuantities = {}; // Objekt zur Speicherung der Gesamtmengen pro VariationID
				variQuantStockArray.forEach(item => {
					const varId = item.variationId;
					const menge = item.menge;
					if (totalOrderedQuantities[varId]) {
						totalOrderedQuantities[varId] += menge;
					} else {
						totalOrderedQuantities[varId] = menge;
					}
				});
		
				// Funktion zum Abfragen der API für eine bestimmte Variationsnummer
				function fetchData(variationId) {
					return fetch(`https://www.servershop24.de/backend/stock/get/8k3x3hZX7J/${variationId}/`)
						.then(response => response.json())
						.then(data => {
							// Konvertiere variationId zu einer Zahl
							const varIdNum = Number(variationId);
							// Filtere die Ergebnisse nach der gegebenen variationId
							const filteredData = data.filter(item => item.variationId === varIdNum);
		
							// Überprüfe, ob netStock-Werte vorhanden sind
							let totalNetStock;
							if (filteredData.length === 0) {
								// Wenn kein netStock gefunden wurde, setze totalNetStock auf 9999999 ("unendlich")
								totalNetStock = 9999999;
							} else {
								// Summiere alle netStock-Werte
								totalNetStock = filteredData.reduce((sum, item) => sum + item.netStock, 0);
							}
		
							return { variationId: variationId, totalNetStock: totalNetStock };
						});
				}
		
				// Verwende Promise.all, um alle Fetch-Requests parallel zu senden
				skip = true;
				//console.log("skip = true, beginne promise");
				Promise.all(variQuantStockArray.map(item => fetchData(item.variationId)))
					.then(results => {
						// Aktualisiere jedes Objekt im variQuantStockArray mit dem totalNetStock
						results.forEach(result => {
							// Finde alle Einträge mit der gleichen variationId
							const targetItems = variQuantStockArray.filter(item => item.variationId == result.variationId);
							if (targetItems.length > 0) {
								targetItems.forEach(item => {
									item.totalNetStock = result.totalNetStock;
								});
							}
						});
		
						// Initialisiere die Positionszähler
						let hauptPosition = 0;
						let unterPosition = 0;

						// Iteriere über das variQuantStockArray, das ein Array von Artikeln ist
						variQuantStockArray.forEach(function(artikel) {
						let artikelName = artikel.artikelName; // Hole den Artikelname aus dem Artikelobjekt

						// Trimme den Artikelnamen, um führende und nachgestellte Leerzeichen zu entfernen
						let bereinigterArtikelName = artikelName.trim();

						// Überprüfe, ob der bereinigte Artikelname mit "-" beginnt (Unterposition)
						if (bereinigterArtikelName.startsWith('-')) {
							unterPosition += 1;
							artikel.position = `${hauptPosition}.${unterPosition}`; // Unterposition hinzufügen
						} else {
							// Es ist eine Hauptposition
							hauptPosition += 1;
							unterPosition = 0; // Unterposition zurücksetzen
							artikel.position = `${hauptPosition}.`; // Hauptposition hinzufügen
						}
						});

						// Jetzt enthält das 'variQuantStockArray' die Positionen
						//console.log("variQuantStockArray = ");
						//console.log(variQuantStockArray);


		
						// Nach der Ausgabe des finalen Arrays, Menge ändern, Dummy-Element hinzufügen und Style anpassen
						variQuantStockArray.forEach((item, index) => {
							const tr = trElements[index * 2]; // Nur ungerade Zeilen (0-basiert, daher index * 2)
							const tdElements = tr.querySelectorAll('td');
		
							if (tdElements[mengeIndex]) {
								// Ändere den innerHTML der Menge
								//tdElements[mengeIndex].innerHTML = `(${item.totalNetStock === 9999999 ? '∞' : item.totalNetStock})&nbsp;&nbsp;&nbsp;&nbsp;${item.menge}`;
								tdElements[mengeIndex].innerHTML = ``;

								// Erstelle ein neues <span> Element
								let nwbSpan = document.createElement('span');

								// Setze die ID und den innerText des <span> Elements
								nwbSpan.id = 'nwbSpan';
								nwbSpan.style = "position: absolute; right: 73px;";
								nwbSpan.innerHTML = `${item.totalNetStock === 9999999 ? '∞' : item.totalNetStock}`;

								// Variablen für die Styles der Buttons
								const buttonPadding = '0px 4px'; // Padding für alle Buttons
								const buttonMarginLeft = '-2px'; // Margin-Left für alle außer dem ersten Button
								const buttonFontSize = '10px'; // Schriftgröße für alle Buttons
								const defaultBackgroundColor = '#f0f0f0'; // Hellgrau
								const hoverBackgroundColor = '#d0d0d0'; // Dunkleres Grau bei Hover
								const activeBackgroundColor = '#ffffff'; // Weiß bei Mouse-Down

								// Button-Style-Helper Funktion
								function styleButton(button, buttonName, isFirst = false) {
									button.style.backgroundColor = defaultBackgroundColor;
									button.style.border = '1px solid #ccc';
									button.style.padding = buttonPadding; // Padding für den Button
									button.style.fontSize = buttonFontSize; // Schriftgröße setzen
									button.style.position = "absolute";
									if (buttonName === "artikelButton") {
										button.style.right = "210px";
									} else if (buttonName === "shopButton") {
										button.style.right = "166px";
									} else if (buttonName === "deButton") {
										button.style.right = "145px";
									} else if (buttonName === "enButton") {
										button.style.right = "123px";
									}

									if (!isFirst) {
										button.style.marginLeft = buttonMarginLeft; // Margin-Left nur für alle außer den ersten Button
									}

									// Hover-Effekt
									button.addEventListener('mouseover', () => {
										button.style.backgroundColor = hoverBackgroundColor;
									});

									button.addEventListener('mouseout', () => {
										button.style.backgroundColor = defaultBackgroundColor;
									});

									// Mouse-Down-Effekt
									button.addEventListener('mousedown', () => {
										button.style.backgroundColor = activeBackgroundColor;
									});

									button.addEventListener('mouseup', () => {
										button.style.backgroundColor = hoverBackgroundColor;
									});
								}

								// Erstelle den ersten Button (Artikel-ID Button)
								const artikelButton = document.createElement('button');
								artikelButton.innerText = item.artikelId; // Nur die Artikel-ID anzeigen
								styleButton(artikelButton, "artikelButton", true); // Erster Button, daher isFirst = true

								// Füge die Click-Event-Logik zum Kopieren der Artikel-ID in die Zwischenablage hinzu
								artikelButton.addEventListener('click', () => {
									navigator.clipboard.writeText(item.artikelId).then(() => {
										//console.log(`Artikel-ID ${item.artikelId} in die Zwischenablage kopiert.`);
									}).catch(err => {
										console.error('Fehler beim Kopieren der Artikel-ID: ', err);
									});
								});

								// Erstelle den zweiten Button (→ Shop Button)
								const shopButton = document.createElement('button');
								shopButton.innerText = '→ Shop'; // Text des Buttons
								styleButton(shopButton, "shopButton"); // styleButton ohne isFirst, daher margin-left angewendet

								// Füge die Click-Event-Logik hinzu, um die URL in einem neuen Tab zu öffnen
								shopButton.addEventListener('click', () => {
									const shopUrl = `https://servershop24.de/a-${item.artikelId}`;
									window.open(shopUrl, '_blank'); // Öffne die URL in einem neuen Tab
								});

								// Erstelle den dritten Button (DE Button)
								const deButton = document.createElement('button');
								deButton.innerText = 'DE'; // Text des Buttons
								styleButton(deButton, "deButton"); // styleButton ohne isFirst, daher margin-left angewendet

								// Füge die Click-Event-Logik hinzu, um den Artikelnamen und die DE-URL in die Zwischenablage zu kopieren
								deButton.addEventListener('click', () => {
									const deText = `${item.artikelName}\nhttps://servershop24.de/a-${item.artikelId}`;
									navigator.clipboard.writeText(deText).then(() => {
										//console.log('DE-Link und Artikelname in die Zwischenablage kopiert.');
									}).catch(err => {
										console.error('Fehler beim Kopieren des DE-Links: ', err);
									});
								});

								// Erstelle den vierten Button (EN Button)
								const enButton = document.createElement('button');
								enButton.innerText = 'EN'; // Text des Buttons
								styleButton(enButton, "enButton"); // styleButton ohne isFirst, daher margin-left angewendet

								// Füge die Click-Event-Logik hinzu, um den Artikelnamen und die EN-URL in die Zwischenablage zu kopieren
								enButton.addEventListener('click', () => {
									const enText = `${item.artikelName}\nhttps://servershop24.de/en/a-${item.artikelId}`;
									navigator.clipboard.writeText(enText).then(() => {
										//console.log('EN-Link und Artikelname in die Zwischenablage kopiert.');
									}).catch(err => {
										console.error('Fehler beim Kopieren des EN-Links: ', err);
									});
								});

								tdElements[mengeIndex].appendChild(nwbSpan);
								tdElements[mengeIndex].appendChild(artikelButton);
								tdElements[mengeIndex].appendChild(shopButton);
								tdElements[mengeIndex].appendChild(deButton);
								tdElements[mengeIndex].appendChild(enButton);

								// Erstelle ein neues <span> Element
								let mengeSpan = document.createElement('span');

								// Setze die ID und den innerText des <span> Elements
								mengeSpan.id = 'mengeSpan';
								mengeSpan.style = "position: relative; left: 0px; font-weight: bold;"
								mengeSpan.innerHTML = `${item.menge}`;

								tdElements[mengeIndex].appendChild(mengeSpan);

								// Erstelle ein neues <span> Element
								let posSpan = document.createElement('span');

								// Setze die ID und den innerText des <span> Elements
								posSpan.style = "position: relative; left: 104px;"
								posSpan.innerHTML = `${item.position}`;
								
								tdElements[artikelIdIndex].classList.remove('text-right');
								tdElements[artikelIdIndex].firstChild.style = "left: 31px; position: absolute;";
								tdElements[artikelIdIndex].appendChild(posSpan);

								// Erstelle eine neue Zeile für die Buttons unterhalb der aktuellen Zeile
								/*const buttonRow = document.createElement('tr');
								buttonRow.className = 'button-row'; // Füge eine Klasse hinzu, um die Zeilen später zu identifizieren
								const buttonCell = document.createElement('td');
								buttonCell.colSpan = tdElements.length; // Die Zelle soll sich über die gesamte Spalte erstrecken
								buttonCell.style.textAlign = 'left'; // Links ausrichten*/
										
								// Dummy-Element erstellen und anhängen
								let dummy = document.createElement('span');
								dummy.className = 'update-marker';
								dummy.style.display = 'none'; // Unsichtbar
								tr.appendChild(dummy);
		
								// Hintergrundfarbe anpassen
								let baseColor = '';
								let hoverColor = '#F0F0F0'; // Hover-Farbe immer F0F0F0
		
								// Gesamtbestellmenge für diese VariationID abrufen
								const totalOrderedQuantity = totalOrderedQuantities[item.variationId];

								// Finde das tr-Element, das die th-Elemente (Tabellenkopf) enthält
								const tableHeaderRow = thead.querySelector('tr');

								// Initialisiere eine Variable, um zu prüfen, ob eine der Zeilen rot gefärbt wurde
								let isAnyRowRed = false;

								// Initialisiere eine Variable, um zu prüfen, ob eine der Zeilen gelb gefärbt wurde
								let isAnyRowYellow = false;

								// Finde das first child vom 8. Parent des tableHeaderRow
								const eighthParentFirstChild = tableHeaderRow.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.firstElementChild;

								if (variQuantStockArrayArchive === null) {
									variQuantStockArrayArchive = variQuantStockArray;
									const url = window.location.href;
									const currentOrderIdMatch = url.match(
										/\/plenty\/terra\/order\/(order-ui[^/]*)\/.*?(\d{6})/
									  );
									variQuantStockArrayArchiveTab = currentOrderIdMatch?.[1];
									//console.log("variQuantStockArrayArchive = ");
									//console.log(variQuantStockArrayArchive);
								}
								//console.log("angebotConvertedRelevant = " + angebotConvertedRelevant + ", auftragCopiedRelevant = " + auftragCopiedRelevant)
								/*
								if (angebotConvertedRelevant || auftragCopiedRelevant) {
									let currentOrderId;

									if (currentOrderIdMatch) {
										currentOrderId = currentOrderIdMatch?.[2]; // ID aus der URL extrahieren
									}
									//console.log("currentOrderId = " + currentOrderId + ", newOrderId = " + newOrderId + ", duplicatedOrderId = " + duplicatedOrderId)
									if (currentOrderId === newOrderId && duplicatedOrderId !== newOrderId && currentDuplicatedOrderTab === currentOrderTab && variQuantStockArrayArchiveTab === currentOrderTab) {
										//console.log("currentOrderId === newOrderId && duplicatedOrderId !== newOrderId && currentDuplicatedOrderTab !== currentOrderTab, vergleiche Arrays...");
										//console.log("currentOrderTab = " + currentOrderTab + ", currentDuplicatedOrderTab = " + currentDuplicatedOrderTab + ", variQuantStockArrayArchiveTab = " + variQuantStockArrayArchiveTab);
										if (currentOrderTab !== currentDuplicatedOrderTab) {
											//console.log("orderTabs stimmen nicht überein!!!");
										};
										if (currentOrderTab !== variQuantStockArrayArchiveTab) {
											//console.log("Array-Quelle aus anderem orderTab!!!");
										};
										angebotConverted = false;
										auftragCopied = false;
										angebotConvertedRelevant = false;
										auftragCopiedRelevant = false;
										
										if (variQuantStockArrayArchive !== variQuantStockArray) {
											//console.log("variQuantStockArrayArchive !== variQuantStockArray, zeige arrays...");
											//console.log(variQuantStockArrayArchive);
											//console.log(variQuantStockArray);
											//console.log("variQuantStockArrayArchive !== variQuantStockArray, finde items to remove...");
											// Finde Positionen, die im variQuantStockArray sind, aber nicht im variQuantStockArrayArchive
											const toRemove = variQuantStockArray.filter((item, index) => 
												!variQuantStockArrayArchive.some(archivedItem => archivedItem.variationId === item.variationId) 
												&& item.artikelName.startsWith("- ")
											);
											//console.log("toRemove = " + toRemove);
								
											if (toRemove.length > 0) {
												const alertMessage = toRemove.map(item => item.artikelName).join('\n'); // Einzelne Zeilenumbrüche
												alert(`Angepasstes Bundle erkannt - entferne überflüssige Positionen:\n\n${alertMessage}`);
												document.querySelector('terra-my-view-order-ui').style.pointerEvents = "none";
												document.querySelector('terra-my-view-order-ui').style.opacity = 0.25;
												// Fülle das Array der zu entfernenden Positionen
												positionsToRemove = toRemove.map(item => item.position);
												//console.log('Zu entfernende Positionen:', positionsToRemove);
												unwantedBundleItemsPresent = true;
											}
										}
									} else {
										//console.log("(currentOrderId === newOrderId && duplicatedOrderId !== newOrderId) ist false, kein Array-Vergleich...");
									}
									
									if (currentOrderId !== newOrderId) {
										//console.log("currentOrderId !== newOrderId, setze override auf true...");
										variQuantStockArrayArchive = variQuantStockArray;
										const url = window.location.href;
										const currentOrderIdMatch = url.match(
											/\/plenty\/terra\/order\/(order-ui[^/]*)\/.*?(\d{6})/
										);
										variQuantStockArrayArchiveTab = currentOrderIdMatch?.[1];
										override = true;
										//console.log("variQuantStockArrayArchive = ");
										//console.log(variQuantStockArrayArchive);
									}
								} else {
								*/
								//console.log("weder angebotConvertedRelevant noch auftragCopiedRelevant sind true. passe an: variQuantStockArrayArchive = variQuantStockArray");
								variQuantStockArrayArchive = variQuantStockArray;
								const url = window.location.href;
								const currentOrderIdMatch = url.match(
									/\/plenty\/terra\/order\/(order-ui[^/]*)\/.*?(\d{6})/
								);
								variQuantStockArrayArchiveTab = currentOrderIdMatch?.[1];
								//console.log("variQuantStockArrayArchive = ");
								//console.log(variQuantStockArrayArchive);

								//}

								//console.log(variQuantStockArrayArchive);
								//console.log(variQuantStockArray);
								
								//console.log("archiviertes variQuantStockArrayArchive:");
								//console.log(variQuantStockArrayArchive);
								
								if ((auftragsTyp == "Angebot") || statusCanceled) {
									// Menge vs. Bestand Vergleich für wenn eine OID storniert ist, oder ein Angebot ist
									if (item.totalNetStock < totalOrderedQuantity) {
										baseColor = (index % 2 === 0) ? '#EFD4D4' : '#FFE0E0'; // Sanfter Rotton
									} else {
										baseColor = (index % 2 === 0) ? '#D4F1D4' : '#E0FFE0'; // Sanfter Grünton
									}
									variQuantStockArray.forEach((item) => {
										const totalOrderedQuantity = totalOrderedQuantities[item.variationId];
	
										if (item.totalNetStock < totalOrderedQuantity) {
											isAnyRowRed = true;
										}
									});
								} else {
									// Menge vs. Bestand Vergleich für wenn eine OID nicht storniert und kein Angebot ist
									if (item.totalNetStock === 0) {
										baseColor = (index % 2 === 0) ? '#EFEFD4' : '#FFFFE0'; // Sanfter Gelbton
									} else if (item.totalNetStock < 0) {
										baseColor = (index % 2 === 0) ? '#EFD4D4' : '#FFE0E0'; // Sanfter Rotton
									} else {
										baseColor = (index % 2 === 0) ? '#D4F1D4' : '#E0FFE0'; // Sanfter Grünton
									}
									variQuantStockArray.forEach((item) => {
										//const totalOrderedQuantity = totalOrderedQuantities[item.variationId];
										if (item.totalNetStock === 0) {
											isAnyRowYellow = true;
										} else if (item.totalNetStock < 0) {
											isAnyRowRed = true;
										}
									});
								}

								// Setze die Hintergrundfarbe des first child vom 8. Parent basierend auf isAnyRowRed
								if (isAnyRowYellow && !isAnyRowRed) {
									eighthParentFirstChild.style.backgroundColor = '#FFFFE0'; // Leichter Gelbton
								} else if (isAnyRowRed) {
									eighthParentFirstChild.style.backgroundColor = '#FFE0E0'; // Leichter Rotton
								} else {
									eighthParentFirstChild.style.backgroundColor = '#E0FFE0'; // Leichter Grünton
								}

		
								// Setze die normale Hintergrundfarbe
								tr.style.backgroundColor = baseColor;
		
								// Füge einen Mouseover- und Mouseout-Event-Listener hinzu, um die Farbe bei Hover zu ändern
								tr.addEventListener('mouseover', () => {
									tr.style.backgroundColor = hoverColor;
									tdElements.forEach(td => {
										td.style.backgroundColor = hoverColor;
									});
								});
		
								tr.addEventListener('mouseout', () => {
									tr.style.backgroundColor = baseColor;
									tdElements.forEach(td => {
										td.style.backgroundColor = baseColor;
									});
								});
							}
						});
						if (!thElements[artikelIdIndex].innerText.includes("Pos.")) {
							thElements[artikelIdIndex].innerHTML = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Artikel-ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pos.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`
						}
						if (!thElements[artikelIdIndex].style.width || thElements[artikelIdIndex].style.width !== "170px") {
							thElements[artikelIdIndex].style.width = "170px";
						}
						if (!thElements[mengeIndex].innerText.includes("Nettobestand")) {
							thElements[mengeIndex].innerHTML = `Nettobestand&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Menge`
						}
						const expectedClass = "mat-mdc-header-cell mdc-data-table__header-cell cdk-header-cell text-right fit-content-col cdk-column-itemId mat-column-itemId ng-tns-c1310057507-121 ng-star-inserted mat-mdc-table-sticky mat-mdc-table-sticky-border-elem-top";
						if (thElements[mengeIndex].className !== expectedClass) {
							thElements[mengeIndex].className = expectedClass;
						}
						if (!thElements[mengeIndex].style.width || thElements[mengeIndex].style.width !== "260px") {
							thElements[mengeIndex].style.width = "260px";
						}
						skip = false;
					})
					.catch(error => {
						console.error('Error fetching data:', error);
						skip = false;
					});
			}
		} else if (currentOrderId !== null) {
			// Falls es vorher einen Auftrag gab und nun keiner mehr vorhanden ist
			//console.log(`Auftrag geschlossen. OID = ${currentOrderId}`);
			currentOrderId = null; // Setze OID zurück, da kein Auftrag mehr offen ist
		}

		

		// Überprüfe, ob Dummy-Elemente noch vorhanden sind. Falls nicht, setze currentOrderId zurück.
		const dummyCheck = document.querySelector('.update-marker');
		if (!dummyCheck) {
			//console.log("Dummy-Element fehlt. Starte den Loop neu.");
			
			// Entferne alle hinzugefügten Zeilen mit den Buttons
			const buttonRows = document.querySelectorAll('.button-row'); // Selektiere alle hinzugefügten Button-Zeilen
			buttonRows.forEach(row => row.remove()); // Entferne jede dieser Zeilen

			currentOrderId = null;
			override = false;
		}
	}
}

/*async function removeUnwantedBundleItems() {
    //console.log("removeUnwantedBundleItems: Funktionsbeginn");
    const targetElement = document.querySelectorAll("terra-my-view-row[class=ng-star-inserted]")[1];

    // Suche den Button mit dem gewünschten mat-icon
    const buttonWithEditIcon = Array.from(targetElement.querySelectorAll('button')).find(button => {
        const matIcon = button.querySelector('mat-icon');
        return matIcon && matIcon.innerText.trim() === 'edit';
    });

    if (buttonWithEditIcon) {
        buttonWithEditIcon.click();
    } else {
        console.error("Button mit 'edit'-Icon nicht gefunden.");
        return;
    }

    while (true) {
        // Alle span-Elemente auswählen
        let spans = Array.from(document.querySelectorAll('span[id=positionsSpan]'));

        // Überprüfen, ob alle Positionen in positionsToRemove vorhanden sind
        let foundAll = positionsToRemove.every(position =>
            spans.some(span => span.innerText.trim() === position)
        );

        // Wenn alle Positionen gefunden wurden, Checkboxen anklicken
        spans.forEach(span => {
            if (positionsToRemove.includes(span.innerText.trim())) {
				const checkbox = span.parentElement.parentElement.querySelector("mat-checkbox input[type=checkbox]");
				if (checkbox) {
					checkbox.click();
				} else {
					//console.log("Checkbox nicht gefunden für Position:", span.innerText.trim());
				}
            }
        });

        if (foundAll) {
            //console.log('Alle Positionen gefunden und Checkboxen angeklickt:', positionsToRemove);
            break; // Loop beenden
        }

        await sleep(10); // 10 ms warten, bevor erneut geprüft wird
    }

	while (true) {
		let deleteIcon = Array.from(document.querySelectorAll('mat-icon')).find(icon => icon.innerText.trim() === 'delete');
		if (deleteIcon) {
			//console.log('Gefundenes mat-icon mit innerText "delete":', deleteIcon);
			deleteIcon.parentElement.click();
			break;
		} else {
			//console.log('Kein mat-icon mit innerText "delete" gefunden.');
			await sleep(10);
		}
	}

	while (true) {
		let deleteButtonLabel = Array.from(document.querySelectorAll('span.mdc-button__label')).find(span => span.innerHTML.trim() === 'Löschen');
		if (deleteButtonLabel) {
			//console.log('Gefundenes span-Element mit Text "Löschen":', deleteButtonLabel);
			deleteButtonLabel.parentElement.click();
			break;
		} else {
			//console.log('Kein span-Element mit Text "Löschen" gefunden.');
			await sleep(10);
		}
	}

	// Extrahiere die currentOrderId aus der URL
	const url = window.location.href;
	const currentOrderIdMatch = url.match(
		/\/plenty\/terra\/order\/(order-ui[^/]*)\/.*?(\d{6})/
	  );

	if (currentOrderIdMatch) {
		const currentOrderId = currentOrderIdMatch?.[2]; // ID aus der URL extrahieren
		//console.log("Gefundene Order ID:", currentOrderId);

		// Baue den Selektor mit der extrahierten Order ID
		const selector = `a[href^='/plenty/terra/order/order-ui'][href*='/${currentOrderId}']`;
		const linkElement = document.querySelector(selector);

		if (linkElement) {
			//console.log("Gefundenes a-Element:", linkElement);
			linkElement.click();
		} else {
			//console.log("Kein a-Element mit der extrahierten Order ID gefunden.");
		}
	} else {
		console.error("Keine Order ID in der URL gefunden.");
	}

	while (true) {
		// Suche das div-Element mit role="alert"
		const alertDiv = Array.from(document.querySelectorAll('div[role="alert"]')).find(div => {
			const innerDiv = div.querySelector('div'); // Verschachteltes div finden
			return innerDiv && innerDiv.innerText.trim() === 'Der Artikel wurde erfolgreich gelöscht.';
		});
		if (alertDiv) {
			//console.log('Gefundenes div mit role="alert" und Text "Der Artikel wurde erfolgreich gelöscht.":', alertDiv);
			break;
		} else {
			//console.log('Kein passendes div gefunden.');
			await sleep(10);
		}
	}	

	while (true) {
		let refreshIcon = Array.from(document.querySelectorAll('mat-icon')).find(icon => icon.innerText.trim() === 'refresh');
		if (refreshIcon) {
			//console.log('Gefundenes mat-icon mit innerText "refresh":', refreshIcon);
			await sleep(500);
			while (true) {
				const isPlentyInactive = document.querySelector('terra-loading-spinner[hidden]');
				if (isPlentyInactive && refreshIcon) {
					refreshIcon.click();
					break;
				} else if (!refreshIcon) {
					console.error("refresh-button verschwunden, breche removeUnwantedBundleItems ab, ohne Auftrag am Ende zu refreshen!");
					document.querySelector('terra-my-view-order-ui').style.pointerEvents="";
					document.querySelector('terra-my-view-order-ui').style.opacity=1;
					return;
				}
				await sleep(10);
			}
			break;
		} else {
			//console.log('Kein mat-icon mit innerText "refresh" gefunden.');
			await sleep(10);
		}
	}
	document.querySelector('terra-my-view-order-ui').style.pointerEvents="";
	document.querySelector('terra-my-view-order-ui').style.opacity=1;
    //console.log("removeUnwantedBundleItems: Funktionsende");
}*/

function adjustAuftragLayout() {
    // Alle Elemente mit der Klasse "col-lg-5 col-md-6 col-sm-12 ng-star-inserted" auswählen
    const elements = document.querySelectorAll('.col-lg-5.col-md-6.col-sm-12.ng-star-inserted');

    // Klasse "col-lg-5" von allen ausgewählten Elementen entfernen
    elements.forEach(element => {
        element.classList.remove('col-lg-5');
    });

    // Das erste Element mit der Klasse "col-lg-10 col-md-6 col-sm-12 ng-star-inserted" auswählen
    const targetElement = document.querySelector('.col-lg-10.col-md-6.col-sm-12.ng-star-inserted');
    if (targetElement) {
        // Style-Attribute setzen
        targetElement.style.flexBasis = '100%';
        targetElement.style.maxWidth = '100%';
    }
}

function adjustElementWidths() {
    // Überprüfen, ob die URL dem gewünschten Muster entspricht (sechsstellige Nummer oder "/new")
	const urlPattern = /\/plenty\/terra\/order\/order-ui[^/]*\/(new|\d{6}\/items\/edit)$/;
    if (urlPattern.test(window.location.pathname)) {
		let check = document.querySelectorAll('thead[role="rowgroup"]')
		if (check) {
			if (check.length < 2) {
				return;
			}
		} else {
			return;
		}
		const preisauswahlElementTop = [...document.querySelectorAll('thead[role="rowgroup"]')[0].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Preisauswahl");
		const preisauswahlElementBottom = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Preisauswahl");
		const mengeElement = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Menge");
		const variantenID = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Varianten-ID");
		const nettoPreis = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Nettopreis");
		const regularNettoPreis = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Regulärer Nettopreis");
		const rechnungsBetrag = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Rechnungsbetrag");
		const regularBruttoPreis = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Regulärer Bruttopreis");
		const rabattElement = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Rabatt");
		const gesamtRechnungsBetrag = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Gesamtrechnungsbetrag");
		const systemEKElement = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "System-EK");
		const artikelNameElement = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Artikelname");
		let artikelID;

		// Zuerst das 'artikelID' Element finden
		const artikelIDParent = [...document.querySelectorAll('thead[role="rowgroup"]')[1].querySelectorAll('*')].find(el => el.innerText && el.innerText.trim().includes("Artikel-ID"));

		// Überprüfen, ob das Element gefunden wurde
		if (artikelIDParent) {
			// Innerhalb dieses Elements nach Kindern suchen, die das Kriterium erfüllen
			const artikelIDs = [...artikelIDParent.querySelectorAll('*')].filter(el => el.innerText && el.innerText.trim().includes("Artikel-ID"));

			// Ausgabe der gefundenen Kind-Elemente
			artikelID = artikelIDs[0];
		}

		let cellIndexArtikelID = null;
		let cellIndexArtikelNameElement = null;



		//const preisauswahlElement = [...document.querySelectorAll('*')].find(el => el.innerText && el.innerText.trim() === "Preisauswahl");
        
        if (preisauswahlElementTop) {
            const currentWidth = preisauswahlElementTop.offsetWidth;
            
            if (currentWidth !== 250) {
                preisauswahlElementTop.style.width = '250px';
            }
        }

		if (preisauswahlElementBottom) {
            const currentWidth = preisauswahlElementBottom.offsetWidth;
            
            if (currentWidth !== 250) {
                preisauswahlElementBottom.style.width = '250px';
            }
        }

		if (mengeElement) {
            const currentWidth = mengeElement.offsetWidth;
            
            if (currentWidth !== 80) {
                mengeElement.style.width = '80px';
            }
        }

		if (artikelID) {
            const currentWidth = artikelID.offsetWidth;
            
            if (currentWidth !== 130) {
                artikelID.style.width = '130px';
            }

        }

		if (variantenID) {
            const currentWidth = variantenID.offsetWidth;
            
            if (currentWidth !== 100) {
                variantenID.style.width = '100px';
            }
        }

		if (nettoPreis) {
            const currentWidth = nettoPreis.offsetWidth;
            
            if (currentWidth !== 100) {
                nettoPreis.style.width = '100px';
            }
        }

		if (regularNettoPreis) {
            const currentWidth = regularNettoPreis.offsetWidth;
            
            if (currentWidth !== 120) {
                regularNettoPreis.style.width = '120px';
				regularNettoPreis.innerText = "Reg. Nettopreis";
            }
        }

		if (rechnungsBetrag) {
            const currentWidth = rechnungsBetrag.offsetWidth;
            
            if (currentWidth !== 150) {
                rechnungsBetrag.style.width = '150px';
            }
        }

		if (regularBruttoPreis) {
            const currentWidth = regularBruttoPreis.offsetWidth;
            
            if (currentWidth !== 150) {
                regularBruttoPreis.style.width = '150px';
				regularBruttoPreis.innerText = "Reg. Bruttopreis";
            }
        }

		if (rabattElement) {
            const currentWidth = rabattElement.offsetWidth;
            
            if (currentWidth !== 90) {
                rabattElement.style.width = '90px';
            }
        }

		if (gesamtRechnungsBetrag) {
            const currentWidth = gesamtRechnungsBetrag.offsetWidth;
            
            if (currentWidth !== 120) {
                gesamtRechnungsBetrag.style.width = '120px';
				gesamtRechnungsBetrag.innerText = "Gesamtbetrag";
            }
        }

		if (systemEKElement) {
            const currentWidth = systemEKElement.offsetWidth;
            
            if (currentWidth !== 90) {
                systemEKElement.style.width = '90px';
            }
        }

		if (artikelID && artikelNameElement) {
			//console.log("artikelID und artikelNameElement beide gefunden");
			let skip = false;
			const trElements = document.querySelectorAll('tbody[role="rowgroup"]')[1].querySelectorAll('tr');
			rowCount = trElements.length;
			if (rowCount !== prevRowCount) {
				//console.log("rowCount und prevRowCount matchen nicht! rowCount = " + rowCount + ", prevRowCount = " + prevRowCount);
				prevRowCount = rowCount;
				trElements.forEach(function(tr) {
					// Wähle alle <span> Elemente mit der ID "positionsSpan" innerhalb des <tr> aus
					let spansToRemove = tr.querySelectorAll('span#positionsSpan');
					
					// Iteriere über alle gefundenen <span> Elemente und entferne sie
					spansToRemove.forEach(function(span) {
					  span.remove(); // Entfernt das <span> Element aus dem DOM
					});
				});
			} else {
				const positionsSpanExists = document.getElementById("positionsSpan");
				if (positionsSpanExists){
					skip = true;
				}
			}
			if (!skip) {
				if (artikelID.innerText === "Artikel-ID"){
					artikelID.innerHTML = `Pos.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Artikel-ID`
				}
				cellIndexArtikelID = artikelID.cellIndex;
				cellIndexArtikelNameElement = artikelNameElement.cellIndex;

				// Initialisiere ein leeres Array, um die Inhalte zu speichern
				let inhalteArray = [];

				// Initialisiere das Positionsobjekt
				let positionsObj = {};

				// Initialisiere die Positionszähler
				let hauptPosition = 0;
				let unterPosition = 0;

				// Wähle alle Zeilen im Tabellenkörper (tbody) aus
				let zeilen = document.querySelectorAll('tbody tr');

				// Iteriere über jede Zeile
				zeilen.forEach(function(zeile) {
					// Hole alle Zellen (td) in der aktuellen Zeile
					let zellen = zeile.querySelectorAll('td');

					// Prüfe, ob die Zelle mit dem angegebenen Index existiert
					if (zellen.length > cellIndexArtikelNameElement) {
						// Hole das textarea-Element innerhalb der Zelle
						let textarea = zellen[cellIndexArtikelNameElement].querySelector('textarea');

						if (textarea && textarea.value.trim() !== '') {
							// Hole den Wert des textarea-Elements
							let inhalt = textarea.value.trim();
							// Füge den Inhalt dem Array hinzu
							inhalteArray.push(inhalt);

							// Überprüfe, ob der Text mit "- " beginnt (Unterposition)
							if (inhalt.startsWith('- ')) {
								unterPosition += 1;
								let positionsNummer = hauptPosition + '.' + unterPosition;
								positionsObj[positionsNummer] = inhalt;
								
								// Füge die Positionsnummer als <span> vor dem <a>-Element in der Zelle links hinzu
								let zelleLinks = zellen[cellIndexArtikelID];
								let linkElement = zelleLinks.querySelector('a');

								if (linkElement) {
								// Erstelle ein neues <span>-Element für die Positionsnummer
								let positionsSpan = document.createElement('span');
								positionsSpan.id = "positionsSpan";
								positionsSpan.style = "margin-left: 6px;";
								positionsSpan.textContent = positionsNummer; // Nur die Positionsnummer
								
								// Füge das <span>-Element vor dem <a>-Element ein
								zelleLinks.insertBefore(positionsSpan, linkElement);
								}
							} else {
								// Es ist eine Hauptposition
								hauptPosition += 1;
								unterPosition = 0; // Unterposition zurücksetzen
								let positionsNummer = hauptPosition + '.';
								positionsObj[positionsNummer] = inhalt;

								// Füge die Positionsnummer als <span> vor dem <a>-Element in der Zelle links hinzu
								let zelleLinks = zellen[cellIndexArtikelID];
								let linkElement = zelleLinks.querySelector('a');

								if (linkElement) {
								// Erstelle ein neues <span>-Element für die Positionsnummer
								let positionsSpan = document.createElement('span');
								positionsSpan.id = "positionsSpan";
								positionsSpan.style = "margin-left: 6px;";
								positionsSpan.textContent = positionsNummer; // Nur die Positionsnummer
								
								// Füge das <span>-Element vor dem <a>-Element ein
								zelleLinks.insertBefore(positionsSpan, linkElement);
								}
							}
						} else {
						// Wenn kein Text oder kein Textarea vorhanden ist, füge nichts hinzu
						inhalteArray.push(null);
						}
					} else {
						// Falls die Zelle nicht existiert, optional null oder einen Platzhalter hinzufügen
						inhalteArray.push(null);
					}
				});

				// Jetzt enthält 'positionsObj' die gewünschten Positionsnummern und Texte
				//console.log(positionsObj);
			}
		}
    }
}

if (!localStorage.getItem("savedHeightArtikeltext")) {
	localStorage.setItem("savedHeightArtikeltext", "400");
}
if (!localStorage.getItem("savedHeightTechnischeDaten")) {
	localStorage.setItem("savedHeightTechnischeDaten", "400");
}

function manageHeights() {
    const iframe = document.querySelector('iframe');
    if (!iframe || !iframe.contentDocument) return;

    const contentDocument = iframe.contentDocument;

    // Funktion zum Anwenden von Höhe
    function applyHeight(elements, height) {
        elements.forEach(el => {
            el.style.height = height + "px";
        });
    }

    // Überwachung von Änderungen an der Höhe
    function observeHeightChanges(elements, type) {
        elements.forEach(el => {
            // Prüfe, ob der Observer bereits hinzugefügt wurde
            if (!el._observerAdded) {
                const observer = new MutationObserver(() => {
                    // Erfasse die neue Höhe
                    const newHeight = parseInt(el.style.height.replace("px", ""));
                    if (!isNaN(newHeight)) {
                        // Speichere die neue Höhe in den LocalStorage
                        const key = type === "Artikeltext" ? "savedHeightArtikeltext" : "savedHeightTechnischeDaten";
                        localStorage.setItem(key, newHeight);

                        // Wende die neue Höhe auf alle Elemente des gleichen Typs an
                        const allElements = type === "Artikeltext"
                            ? filterElementsByParentText(contentDocument.querySelectorAll('[id^="cke_"][id$="_contents"]'), "Artikeltext")
                            : filterElementsByParentText(contentDocument.querySelectorAll('[id^="cke_"][id$="_contents"]'), "Technische Daten");

                        applyHeight(allElements, newHeight);
                    }
                });

                // Beobachte Änderungen an den Inline-Styles
                observer.observe(el, { attributes: true, attributeFilter: ["style"] });

                el._observerAdded = true; // Markiere das Element als überwacht
            }
        });
    }

    const elements = contentDocument.querySelectorAll('[id^="cke_"][id$="_contents"]');
    const filteredElementsArtikeltext = filterElementsByParentText(elements, "Artikeltext");
    const filteredElementsTechnischeDaten = filterElementsByParentText(elements, "Technische Daten");

    // Anwenden der gespeicherten Höhe
    const savedHeightArtikeltext = parseInt(localStorage.getItem("savedHeightArtikeltext") || "400");
    const savedHeightTechnischeDaten = parseInt(localStorage.getItem("savedHeightTechnischeDaten") || "400");

    applyHeight(filteredElementsArtikeltext, savedHeightArtikeltext);
    applyHeight(filteredElementsTechnischeDaten, savedHeightTechnischeDaten);

    // Überwachen der manuellen Änderungen
    observeHeightChanges(filteredElementsArtikeltext, "Artikeltext");
    observeHeightChanges(filteredElementsTechnischeDaten, "Technische Daten");
	// versteckt alle Technische Daten Abschnitte, da aktuell global nicht verwendet in Plenty
	hideTechnischeDaten();
}

function hideTechnischeDaten() {
	const iframe = document.querySelector('iframe');
    if (!iframe || !iframe.contentDocument) return;

    const contentDocument = iframe.contentDocument;
	const elements = Array.from(contentDocument.querySelectorAll('*'))
    .filter(el => el.innerText === 'Technische Daten');

  	elements.forEach(el => {
		const parent = el.parentElement;
		if (parent && parent.className === "PlentyConfigTableRow") {
			if (parent.style.display !== 'none') {
				parent.style.display = 'none';
			}
		}
	});
}

// Hilfsfunktion zum Filtern von Elementen nach Parent-Text
function filterElementsByParentText(elements, text) {
    return Array.from(elements).filter(element => {
        const idMatch = element.id.match(/^cke_\d+_contents$/);
        if (!idMatch) return false;

        let parent = element;
        for (let i = 0; i < 6; i++) {
            if (parent.parentElement) {
                parent = parent.parentElement;
            } else {
                return false;
            }
        }
        return parent.firstChild && parent.firstChild.innerText === text;
    });
}

function addEventListenersToSelectedRow() {
    const elements = document.querySelectorAll(
        '.mat-mdc-row.mdc-data-table__row.cdk-row.outline-icons.ng-star-inserted'
    );

    elements.forEach((element) => {
        if (!element.hasAttribute('data-listeners-added')) {
            // Doppelklick-Eventlistener auf die Zeile
            element.addEventListener('dblclick', (event) => {
                // Prüfe anhand des gesamten Eventpfades, ob ein Element ein TD ist, das ein Mengen-Input enthält.
                const path = event.composedPath ? event.composedPath() : [];
                for (let el of path) {
                    if (el.tagName === "TD" && el.querySelector('input[type="number"]')) {
                        // Doppelklick erfolgte in einem TD mit Input – Aktion unterbinden!
                        return;
                    }
                }

                const secondButton = element.querySelector('button:nth-of-type(2)');
                if (secondButton) {
                    secondButton.click();
					// ➜  verhindert, dass der Button den Fokus behält
					secondButton.blur();
                    // Nach Doppelklick Fokus setzen, sofern die Zeile noch selektiert ist
                    setTimeout(() => {
                        if (element.classList.contains('selected')) {
                            const numberInput = element.querySelector('input[type="number"]');
                            if (numberInput && !isSearchActive && document.activeElement !== numberInput) {
								//console.log("Zeile 2063: focussing...");
                                numberInput.focus();
                                numberInput.select();
                            }
                        }
                    }, 0);
                }
                // Markiere, dass diese Aktion vom Nutzer initiiert wurde
                element.setAttribute('data-user-selected', 'true');
            });

            // Enter-Taste
            element.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    if (isSearchActive) return;

                    const focusedInput = document.activeElement;
                    if (focusedInput && focusedInput.tagName === 'INPUT') {
                        return; // Wenn gerade im Input getippt wird, nicht überschreiben
                    }

                    const secondButton = element.querySelector('button:nth-of-type(2)');
                    if (secondButton) {
                        event.preventDefault();
                        secondButton.click();
						// ➜  verhindert, dass der Button den Fokus behält
						secondButton.blur();
                    }
                    element.setAttribute('data-user-selected', 'true');
                }
            });

            // Klick-Eventlistener (zur Simulation von Doppelklicks)
            element.addEventListener('click', (event) => {
                // Prüfe, ob der Klick in einem TD mit einem Mengen-Input erfolgt.
                const path = event.composedPath ? event.composedPath() : [];
                for (let el of path) {
                    if (el.tagName === "TD" && el.querySelector('input[type="number"]')) {
                        // In der Mengenzelle – normale Fokussierung, aber keine Doppelklick-Simulation.
                        setTimeout(() => {
                            if (element.classList.contains('selected')) {
                                const numberInput = element.querySelector('input[type="number"]');
                                if (numberInput && !isSearchActive && document.activeElement !== numberInput) {
									//console.log("Zeile 2104: focussing...");
                                    //numberInput.focus();
                                    //numberInput.select();
									//deaktiviert wegen doppel
                                }
                            }
                        }, 0);
                        element.setAttribute('data-user-selected', 'true');
                        return;
                    }
                }

                // Andernfalls: Doppelklick-Simulation wie gehabt.
                const now = Date.now();
                const lastSelectionTime = element.getAttribute('data-last-selection-time');
                const doubleClickArmed = element.getAttribute('data-double-click-armed');

                if (!doubleClickArmed) {
                    // Erste Markierung dieser Zeile (durch Klick)
                    element.setAttribute('data-double-click-armed', 'true');
                    element.setAttribute('data-last-selection-time', now.toString());
                } else {
                    // Bereits armed – prüfe, ob es sich um einen Doppelklick handelt.
                    if (lastSelectionTime) {
                        const delta = now - parseInt(lastSelectionTime, 10);
                        if (delta <= 250) {
                            // Simuliere Doppelklick
                            const dblClickEvent = new MouseEvent('dblclick', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            element.dispatchEvent(dblClickEvent);
                            element.removeAttribute('data-double-click-armed');
                            element.removeAttribute('data-last-selection-time');
                            return;
                        } else {
                            element.setAttribute('data-last-selection-time', now.toString());
                        }
                    }
                }

                // Bei einem normalen Klick: Fokus setzen, sofern die Zeile noch selektiert ist.
                setTimeout(() => {
                    if (element.classList.contains('selected')) {
                        const numberInput = element.querySelector('input[type="number"]');
                        if (numberInput && !isSearchActive && document.activeElement !== numberInput) {
							//console.log("Zeile 2150: focussing...");
                            numberInput.focus();
                            numberInput.select();
                        }
                    }
                }, 0);
                element.setAttribute('data-user-selected', 'true');
            });

            // Zusätzlich: An allen TD-Elementen, die ein Mengen-Input enthalten, wird ein dblclick-Listener installiert,
            // der das Event stoppt – so wird sichergestellt, dass Doppelklicks in diesen Zellen nicht zur Zeile durchgereicht werden.
            const tdElements = element.querySelectorAll('td');
            tdElements.forEach(td => {
                if (td.querySelector('input[type="number"]') && !td.hasAttribute('data-dblclick-td-listener-added')) {
                    td.addEventListener('dblclick', (event) => {
                        event.stopPropagation();
                    });
                    td.setAttribute('data-dblclick-td-listener-added', 'true');
                }
            });

            element.setAttribute('data-listeners-added', 'true');
        }

        // Frischen State sicherstellen
        element.removeAttribute('data-last-selection-time');
        element.removeAttribute('data-double-click-armed');
    });
}

// Tab und Shift+Tab per Tastatur: User-Aktion => data-user-selected setzen
document.addEventListener('keydown', (event) => {
    const focusedElement = document.activeElement;
	const itemSearchBar = document.querySelector(
		'input[role="combobox"][placeholder="Suchen"][class*="mat-mdc-input-element"]'
	);

    // Shift+Tab: zum vorherigen Mengenfeld
    if (event.key === 'Tab' && event.shiftKey) {
        if (focusedElement && focusedElement.closest('.mat-mdc-row.selected')) {
            const elements = document.querySelectorAll(
                '.mat-mdc-row.mdc-data-table__row.cdk-row.outline-icons.ng-star-inserted'
            );
            const currentIndex = Array.from(elements).indexOf(focusedElement.closest('.mat-mdc-row'));
            const previousElement = elements[currentIndex - 1];

            if (previousElement) {
                const previousNumberInput = previousElement.querySelector('input[type="number"]');
                if (previousNumberInput) {
                    event.preventDefault();
                    previousNumberInput.focus();
                    previousNumberInput.select();
                    previousElement.setAttribute('data-user-selected', 'true');
                }
            } else {
				//previousElement nicht gefunden, also springe in die Suchleiste
				event.preventDefault();
				if (itemSearchBar) {
					itemSearchBar.click();
					itemSearchBar.focus();
				}
			}
        }
    }

    // Tab: zum nächsten Mengenfeld
    else if (event.key === 'Tab' && !event.shiftKey) {
        if (focusedElement && focusedElement.closest('.mat-mdc-row.selected')) {
            const elements = document.querySelectorAll(
                '.mat-mdc-row.mdc-data-table__row.cdk-row.outline-icons.ng-star-inserted'
            );
            const currentIndex = Array.from(elements).indexOf(focusedElement.closest('.mat-mdc-row'));
            const nextElement = elements[currentIndex + 1];

            if (nextElement) {
                const nextNumberInput = nextElement.querySelector('input[type="number"]');
                if (nextNumberInput) {
                    event.preventDefault();
                    nextNumberInput.focus();
                    nextNumberInput.select();
                    nextElement.setAttribute('data-user-selected', 'true');
                }
            }
        } else if (focusedElement === itemSearchBar) {
			//previousElement nicht gefunden, also springe in die Suchleiste
			const tagBar = document.querySelector('.mat-mdc-row.mdc-data-table__row.cdk-row.outline-icons.ng-star-inserted');
			if (tagBar) {
				const tagBarQuantityInputField = document.querySelector('.mat-mdc-row.mdc-data-table__row.cdk-row.outline-icons.ng-star-inserted').querySelector('input[type="number"]');
				if (tagBarQuantityInputField) {
					event.preventDefault();
					//console.log("Zeile 2237: focussing...");
					tagBarQuantityInputField.focus();
					tagBarQuantityInputField.select();
				}
			}
		}
    }
});

// MutationObserver Callback
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (
            mutation.type === 'childList' ||
            (mutation.type === 'attributes' && mutation.attributeName === 'class')
        ) {
            addEventListenersToSelectedRow();

            // Prüfen, ob eine neu ausgewählte Zeile ohne data-user-selected existiert
            const allRows = document.querySelectorAll('.mat-mdc-row.mdc-data-table__row.cdk-row.outline-icons.ng-star-inserted');
            const autoSelectedRow = Array.from(allRows).find(row => 
                row.classList.contains('selected') && !row.hasAttribute('data-user-selected')
            );

            if (autoSelectedRow) {
                autoSelectedRow.setAttribute('data-user-selected', 'auto'); 
                requestAnimationFrame(() => {
                    if (!isSearchActive) {
                        const numberInput = autoSelectedRow.querySelector('input[type="number"]');
                        if (numberInput && numberInput.offsetParent !== null) {
							//console.log("Zeile 2267: focussing...");
							//console.log(numberInput);
                            numberInput.focus();
                            numberInput.select();
                        } else {
                            setTimeout(() => {
                                if (!isSearchActive && autoSelectedRow.classList.contains('selected')) {
                                    const retryInput = autoSelectedRow.querySelector('input[type="number"]');
                                    if (retryInput && retryInput.offsetParent !== null) {
										//alert("Zeile 2275: focussing...");
                                        retryInput.focus();
                                        retryInput.select();
                                    }
                                }
                            }, 50);
                        }
                    } else {
                        setTimeout(() => {
                            if (!isSearchActive && autoSelectedRow.classList.contains('selected')) {
                                const delayedInput = autoSelectedRow.querySelector('input[type="number"]');
                                if (delayedInput && delayedInput.offsetParent !== null) {
									//console.log("Zeile 2287: focussing...");
                                    delayedInput.focus();
                                    delayedInput.select();
                                }
                            }
                        }, 200);
                    }
                });
            }
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
});

/*let isSearchActive = false;
// statt eines Arrays mit reinen Strings ...
const validPaths = ['/order-ui/new', '/order-ui_1/new', '/order-ui_2/new', '/order-ui_3/new', '/order-ui_4/new', '/order-ui_5/new', '/order-ui_6/new', '/order-ui_7/new', '/order-ui_8/new', '/order-ui_9/new', '/items/edit'];

// Diese Funktion wird periodisch aufgerufen, um den Suchzustand zu prüfen
function checkSearchState() {
    const currentPath = window.location.pathname; 
    if (validPaths.some(path => currentPath.endsWith(path))) {
		document.querySelector('terra-filter-toolbar-chip-list').innerText
        const selectedRow = document.querySelector('.mat-mdc-row.selected');
        let currentlyActive = false;
        if (!selectedRow) {
            currentlyActive = true;
        }
        if (currentlyActive !== isSearchActive) {
            isSearchActive = currentlyActive;
            if (!isSearchActive && selectedRow) {
				const numberInput = selectedRow.querySelector('input[type="number"]');
				if (numberInput) {
					//console.log("focussing...");
					//console.log(numberInput);
					numberInput.focus();
					numberInput.select();
				} else {
					//console.log("not focussing... activeElement is:");
					//console.log(document.activeElement);
				}
			} else {
				//console.log("conditions not met!");
			}
        }
    } else {
        if (isSearchActive) {
            isSearchActive = false;
        }
    }
}*/

const isSearchActive = false;
const validPaths = ['/order-ui/new', '/order-ui_1/new', '/order-ui_2/new', '/order-ui_3/new', '/order-ui_4/new', '/order-ui_5/new', '/order-ui_6/new', '/order-ui_7/new', '/order-ui_8/new', '/order-ui_9/new', '/items/edit'];
let searchCriteriaInnerText;
function checkNewItemSearchResults() {
    const currentPath = window.location.pathname;
	const searchCriteriaElement = document.querySelector('terra-filter-toolbar-chip-list')
    if (validPaths.some(path => currentPath.endsWith(path)) && searchCriteriaElement) {
		let newSearchCriteriaInnerText = searchCriteriaElement.innerText
        const selectedRow = document.querySelector('.mat-mdc-row.selected');
        if (!selectedRow) {
            return;
        };
		const numberInput = selectedRow.querySelector('input[type="number"]');
		if (!numberInput) {
            return;
        };
        if (searchCriteriaInnerText !== newSearchCriteriaInnerText) {
			const selectedRow2 = document.querySelector('.mat-mdc-row.selected');
			const numberInput2 = selectedRow2.querySelector('input[type="number"]');
			//console.log("focussing...");
			//console.log(numberInput2);
			numberInput2.focus();
			numberInput2.select();
			numberInput2.click();
			const activeElement = document.activeElement
			//nur Suchtext aktualisieren (um künftiges Triggern zu verhindern) wenn auch wirklich der numberInput erfolgreich angewählt wurde
			if (activeElement === numberInput2) {
				searchCriteriaInnerText = newSearchCriteriaInnerText;
			} else {
				//console.log("going for selectedRow3 / numberInput3...");
				const selectedRow3 = document.querySelector('.mat-mdc-row.selected');
				const numberInput3 = selectedRow3.querySelector('input[type="number"]');
				numberInput3.focus();
				numberInput3.select();
				numberInput3.click();
				if (activeElement === numberInput3) {
					searchCriteriaInnerText = newSearchCriteriaInnerText;
				}
			}
        }
    }
}

function attachFocusHandlerToAddItemBtn() {
	/* URL-Wache ---------------------------------------------------------- */
	if (!/^\/plenty\/terra\/order\/order-ui[^/]*\/new$/.test(window.location.pathname)) {
	  return null;
	}
  
	/* 2 Buttons + 1 Step-Header, alle sollen denselben Click-Handler bekommen */
	const BTN_TEXTS    = [
	  'arrow_forward\nARTIKEL HINZUFÜGEN',
	  'arrow_back\nARTIKEL HINZUFÜGEN'
	];
	const STEP_SUBSTR  = 'Artikel hinzufügen';   // Teilstring genügt
	const MARKER_ATTR  = 'data-focus-handler';
  
	/* gemeinsame Handler-Routine ---------------------------------------- */
	const clickHandler = () => {
	  setTimeout(() => {
		const itemSearchBar = document.querySelector(
		  'input[role="combobox"][placeholder="Suchen"][class*="mat-mdc-input-element"]'
		);
		if (itemSearchBar) {
			itemSearchBar.click();
			itemSearchBar.focus();
		}
	  }, 200);
	};
  
	/* Ziel-Elemente ermitteln ------------------------------------------ */
	const buttons = Array.from(document.querySelectorAll('button'))
	  .filter(b => BTN_TEXTS.includes(b.innerText));
  
	const stepHeader = Array.from(document.querySelectorAll('mat-step-header'))
	  .find(h => h.innerText.includes(STEP_SUBSTR));
  
	/* Helfer: Marker setzen + Listener anhängen ------------------------- */
	function armElement(el) {
	  if (!el || el.hasAttribute(MARKER_ATTR)) return;
	  el.setAttribute(MARKER_ATTR, 'true');
	  el.addEventListener('click', clickHandler);
	}
  
	buttons.forEach(armElement);   // beide „ARTIKEL HINZUFÜGEN“-Buttons
	armElement(stepHeader);        // und das Step-Header-Element
  
	/* Rückgabe: erster Button > Step-Header, sonst null ----------------- */
	return buttons[0] || stepHeader || null;
  }
  

function selectItemSearchInputFieldOnCreation() {
	const validPaths = ['/order-ui/new', '/order-ui_1/new', '/order-ui_2/new', '/order-ui_3/new', '/order-ui_4/new', '/order-ui_5/new', '/order-ui_6/new', '/order-ui_7/new', '/order-ui_8/new', '/order-ui_9/new', '/items/edit'];

    const currentPath = window.location.pathname; 
    if (!validPaths.some(path => currentPath.endsWith(path))) {
		itemSearchBarExists = false;
		itemSearchBarExistsOld = false;
		return;
	}

	const itemSearchBar = document.querySelector(
		'input[role="combobox"][placeholder="Suchen"][class*="mat-mdc-input-element"]'
	);
	if (itemSearchBar) {
		itemSearchBarExists = true;
		if (!itemSearchBarExistsOld && itemSearchBarExists) {
			itemSearchBarExistsOld = itemSearchBarExists;
			itemSearchBar.click();
			itemSearchBar.focus();
			//console.log("itemSerachBar clicked");
		}
	} else {
		itemSearchBarExists = false;
		if (itemSearchBarExistsOld && !itemSearchBarExists) {
			itemSearchBarExistsOld = itemSearchBarExists;
		}
	}
	//console.log(itemSearchBarExistsOld + " " + itemSearchBarExists);
}

/**
 * Prüft, ob ein <terra-no-result-title>-Element mit dem **exakten**
 * InnerText „Keine Daten gefunden.“ vorhanden ist.  
 *
 * • Hat dieses Element das Attribut `alreadyClicked`, passiert nichts.  
 * • Fehlt es, wird das Attribut gesetzt **und** das Suchfeld angeklickt:
 *     input[role="combobox"][placeholder="Suchen"][class*="mat-mdc-input-element"]
 *
 * Gibt das gefundene Element zurück (oder null, falls keines).
 */
function focusSearchBarOnNoResults() {
	const validPaths = ['/order-ui/new', '/order-ui_1/new', '/order-ui_2/new', '/order-ui_3/new', '/order-ui_4/new', '/order-ui_5/new', '/order-ui_6/new', '/order-ui_7/new', '/order-ui_8/new', '/order-ui_9/new', '/items/edit'];

    const currentPath = window.location.pathname; 
    if (!validPaths.some(path => currentPath.endsWith(path))) {
		return;
	}

	const NO_RESULT_TEXT = 'Keine Daten gefunden.';
	const MARKER_ATTR    = 'alreadyClicked';
  
	const noResultEl = Array.from(document.querySelectorAll('terra-no-result-title'))
	  .find(el => el.innerText.trim() === NO_RESULT_TEXT);
  
	if (!noResultEl) return null;
  
	if (!noResultEl.hasAttribute(MARKER_ATTR)) {
	  noResultEl.setAttribute(MARKER_ATTR, 'true');
  
	  const itemSearchBar = document.querySelector(
		'input[role="combobox"][placeholder="Suchen"][class*="mat-mdc-input-element"]'
	  );
	  if (itemSearchBar) {
		itemSearchBar.click();
		itemSearchBar.focus();
	  }
	}
  
	return noResultEl;
}
  

/**
 * Start watching all existing and future
 * <mat-icon>add_shopping_cart</mat-icon> elements.
 *
 * On any *modification* of such an icon
 *   ▶ logs a message
 *   ▶ clicks the search-bar input
 *
 * Call **observeAddToCartBtnsForFocusSwitchOnItemSeachBar()** exactly once.
 */
function observeAddToCartBtnsForFocusSwitchOnItemSeachBar() {
	/* prevent double-initialisation */
	if (window.__addToCartObserverInit) return;
	window.__addToCartObserverInit = true;
  
	const ICON_NAME = 'add_shopping_cart';
	const iconObservers = new WeakMap();      // one MutationObserver per icon
  
	/* ───────────────── helpers ───────────────── */
  
	/** Start observing a qualifying icon (if not already watched). */
	function watchIcon(el) {
	  if (iconObservers.has(el) || el.textContent.trim() !== ICON_NAME) return;
  
	  const obs = new MutationObserver(muts => {
		if (muts.some(m => m.type === 'attributes' || m.type === 'characterData')) {
		  //console.log('[mat-icon modified]', el);
  
		  const itemSearchBar = document.querySelector(
			'input[role="combobox"][placeholder="Suchen"][class*="mat-mdc-input-element"]'
		  );
		  if (itemSearchBar) {
			itemSearchBar.click();
			itemSearchBar.focus();
		  }
		}
	  });
  
	  obs.observe(el, {
		attributes: true,
		characterData: true,
		subtree: true
	  });
	  iconObservers.set(el, obs);
	}
  
	/** Stop observing an icon that just left the DOM. */
	function unwatchIcon(el) {
	  const obs = iconObservers.get(el);
	  if (obs) {
		obs.disconnect();
		iconObservers.delete(el);
	  }
	}
  
	/** Apply a callback to element nodes in `nodes` and their <mat-icon> descendants. */
	function traverse(nodes, fn) {
	  nodes.forEach(node => {
		if (node.nodeType !== 1) return;         // ELEMENT_NODE only
		if (node.matches?.('mat-icon')) fn(node);
		node.querySelectorAll?.('mat-icon').forEach(fn);
	  });
	}
  
	/* ───────────────── kick-off ───────────────── */
  
	/* 1) watch icons already present on the page */
	document.querySelectorAll('mat-icon').forEach(watchIcon);
  
	/* 2) watch the whole DOM for additions/removals */
	const domObserver = new MutationObserver(muts => {
	  muts.forEach(m => {
		traverse(m.addedNodes,  watchIcon);
		traverse(m.removedNodes, unwatchIcon);
	  });
	});
  
	domObserver.observe(document.body, { childList: true, subtree: true });
  }
  

// Funktion zur Überprüfung und Erweiterung von Buttons
/*
function enhanceDuplicateCreateOrderButtons() {
    // Alle Buttons auf der Seite auswählen
    const buttons = document.querySelectorAll('button');

    buttons.forEach(button => {
        // Skip, wenn der Button bereits markiert wurde
        if (button.hasAttribute('data-enhanced')) return;

        // Überprüfen, ob der Button den gewünschten Text hat oder ein mat-icon mit dem Text "content_copy" enthält
        const matIcon = button.querySelector('mat-icon');

        if ((button.querySelector('span') && button.querySelector('span').innerText === 'Auftrag duplizieren') || ((matIcon && matIcon.innerText.trim() === 'content_copy') && button.querySelector('span') && button.querySelector('span').innerText !== 'Duplizieren')) {
            button.addEventListener('click', () => {
                auftragCopied = true;
                //console.log('"Auftrag duplizieren" wurde gedrückt.');
				const url = window.location.href;
				const currentOrderIdMatch = url.match(
					/\/plenty\/terra\/order\/(order-ui[^/]*)\/.*?(\d{6})/
				  );

				if (currentOrderIdMatch) {
					duplicatedOrderId = currentOrderIdMatch?.[2]; // ID aus der URL extrahieren
					currentDuplicatedOrderTab = currentOrderIdMatch?.[1];
					//console.log("duplicatedOrderId auf " + duplicatedOrderId + " gesetzt");
				}
            });
        } else if (button.innerText === 'Für alle Auftragspositionen') {
            button.addEventListener('click', () => {
                angebotConverted = true;
                //console.log('"Für alle Auftragspositionen" wurde gedrückt.');
				const url = window.location.href;
				const currentOrderIdMatch = url.match(
					/\/plenty\/terra\/order\/(order-ui[^/]*)\/.*?(\d{6})/
				  );

				if (currentOrderIdMatch) {
					duplicatedOrderId = currentOrderIdMatch?.[2]; // ID aus der URL extrahieren
					currentDuplicatedOrderTab = currentOrderIdMatch?.[1];
					//console.log("duplicatedOrderId auf " + duplicatedOrderId + " gesetzt");
				}
            });
        } else {
            // Falls der Button nicht relevant ist, überspringen
            return;
        }

        // Button als erweitert markieren
        button.setAttribute('data-enhanced', 'true');
    });
}
*/

// Function to extract the six-digit number from the URL
function extractSixDigitNumber(url) {
	const match = url.match(/\/plenty\/terra\/order\/order-ui[^/]*\/.*(\d{6})\/items\/edit/);
	return match ? match[1] : null;
}

// Function to add an event listener to the matching <a> element
function addClickListener(sixDigitNumber) {
	const anchorElement = document.querySelector(`a[href*="${sixDigitNumber}"]`);
	if (anchorElement && !anchorElement.hasAttribute('data-listener-added')) {
		const handleClick = async () => {
			//alert(`Example alert for ID: ${sixDigitNumber}`);
			anchorElement.removeEventListener('click', handleClick);
			anchorElement.removeAttribute('data-listener-added');
			await waitForOrderRefreshButtonAndPressIt();
		};

		anchorElement.addEventListener('click', handleClick);
		anchorElement.setAttribute('data-listener-added', 'true');
	}
}

// Function to check the URL and handle event listener logic
function checkUrlAndAttachListener() {
	const currentUrl = window.location.pathname;
	const sixDigitNumber = extractSixDigitNumber(currentUrl);

	if (sixDigitNumber) {
		addClickListener(sixDigitNumber);
	}
}

async function waitForOrderRefreshButtonAndPressIt() {
	//console.log("waitForOrderRefreshButtonAndPressIt() aufgerufen...");
	while (true) {
		let refreshIcon = Array.from(document.querySelectorAll('mat-icon')).find(icon => icon.innerText.trim() === 'refresh');
		if (!refreshIcon) {
			await sleep(10);
			continue;
		}
		const refreshButton = refreshIcon.parentElement;
		if (refreshButton && !refreshButton.hasAttribute("disabled")) {
			//console.log('Gefundenes mat-icon mit innerText "refresh":', refreshIcon);
			await sleep(100);
			while (true) {
				const isPlentyInactive = document.querySelector('terra-loading-spinner[hidden]');
				if (isPlentyInactive && refreshButton) {
					//console.log("refreshButton wird geklickt...");
					refreshButton.click();
					break;
				} else if (!refreshButton) {
					console.error("refresh-Button verschwunden, breche waitForOrderRefreshButtonAndPressIt ab!");
					return;
				}
				await sleep(10);
			}
			break;
		} else if (refreshButton && refreshButton.hasAttribute("disabled")) {
			//console.warn('refreshButton gefunden, aber hat Attribute "disabled".');
			await sleep(10);
		} else {
			//console.log('Kein mat-icon mit innerText "refresh" gefunden.');
			await sleep(10);
		}
	}
}

function processBarcodeElements() {
    try {
        // Alle iFrames abrufen
        const iframes = document.querySelectorAll('iframe');
        if (!iframes.length) {
            //console.log('Keine iFrames gefunden.');
            return;
        }

        iframes.forEach((iframe) => {
            if (!iframe.contentDocument) {
                //console.log('iFrame-Inhalt nicht zugänglich.');
                return;
            }

            // Elemente mit der Klasse "icon-item_barcode_show" abrufen
            const barcodeDivs = iframe.contentDocument.querySelectorAll(
                'div.adminActionIcon.icon_dist_top_action_item.icon-item_barcode_show'
            );

            if (!barcodeDivs.length) {
                //console.log('Keine passenden Elemente mit der Klasse icon-item_barcode_show gefunden.');
                return;
            }
            //console.log('Elemente mit der Klasse icon-item_barcode_show gefunden. Lege los!');

            barcodeDivs.forEach((barcodeDiv) => {
                // Überprüfen, ob das nächste Nachbarelement existiert und die gewünschte Klasse hat
                const nextSibling = barcodeDiv.nextElementSibling;
                if (
                    nextSibling &&
                    nextSibling.classList.contains('adminActionIcon') &&
                    nextSibling.classList.contains('icon_dist_top_action_item') &&
                    nextSibling.classList.contains('icon-item_serial_number')
                ) {
                    //console.log("nextSibling contains classNames... nextSibling ist:");
                    //console.log(nextSibling);

                    // Hilfsattribut überprüfen, um Duplizierung nur einmal durchzuführen
                    if (barcodeDiv.getAttribute('data-duplicated')) {
                        return;
                    }

                    // Eltern-Element abrufen
                    const parent = barcodeDiv.parentElement;
                    if (!parent) {
                        //console.log('Elternelement nicht gefunden.');
                        return;
                    }

                    // Artikel-ID aus dem ersten Kind ohne Klasse abrufen
                    let firstChildWithoutClass = Array.from(parent.children).find(
                        (child) => child.nodeType === 1 && !child.className
                    );

                    // Überprüfen, ob der InnerText eine sechsstellige Zahl ist
                    if (!firstChildWithoutClass || !/^[0-9]{6}$/.test(firstChildWithoutClass.innerText.trim())) {
                        //console.log('Kein gültiger InnerText mit einer sechsstelligen Zahl gefunden.');
                        return;
                    }

                    const artikelId = firstChildWithoutClass.innerText.trim();
                    //console.log("Artikel-ID ist gültig: " + artikelId);

                    // Div duplizieren
                    const duplicatedDiv = barcodeDiv.cloneNode(true);

                    // Style hinzufügen
                    duplicatedDiv.style.backgroundColor = '#ffaaaa';
                    duplicatedDiv.style.color = '#000';

                    // Event Listener hinzufügen
                    duplicatedDiv.addEventListener('click', () => {
                        window.open(`https://www.tradeo-tools.de/items/label/${artikelId}`, '_blank');
                        //window.open(`https://www.google.com/search?q=${artikelId}`, '_blank');
                    });

                    // Als zweites Kind im Parent hinzufügen
                    if (parent.children.length > 1) {
                        parent.insertBefore(duplicatedDiv, parent.children[1]);
                    } else {
                        parent.appendChild(duplicatedDiv);
                    }

                    // Hilfsattribut setzen
                    barcodeDiv.setAttribute('data-duplicated', 'true');
                }
            });
        });
    } catch (error) {
        console.error('Fehler bei der Verarbeitung:', error);
    }
}

/*function retrieveOrderInfo() {
	const match = window.location.href.match(/\/order\/order-ui(?:_[^/]+)?\/(\d{6})(?:\/|\/.*)?/);
	let orderId;

	if (match) {
		orderId = match[1]; // die gefundene 6-stellige Zahl
	} else {
		return;
	};

	const matLabels = document.querySelectorAll('mat-label');
	let auftragsTyp = false;

	matLabels.forEach(label => {
	if (label.innerText.trim() === "Auftragstyp") {
		auftragsTyp = label.parentElement.parentElement.parentElement.nextElementSibling.firstElementChild.value;
	};
	});

	let sprache = false;

	matLabels.forEach(label => {
	if (label.innerText.trim() === "Sprache") {
		sprache = label.parentElement.parentElement.parentElement.nextElementSibling.innerText;
	};
	});

	if (sprache !== "Deutsch") {
		if (auftragsTyp === "Auftrag") {
			auftragsTyp = "Order";
		} else if (auftragsTyp === "Angebot") {
			auftragsTyp = "Quotation";
		} else if (auftragsTyp === "Retoure") {
			auftragsTyp = "Return";
		} else if (auftragsTyp === "Gutschrift") {
			auftragsTyp = "Refund Order";
		} else if (auftragsTyp === "Gewährleistung") {
			auftragsTyp = "Warranty Order";
		};
	};

	let output = (auftragsTyp + " " + orderId);
	//console.log(output);
	return output;
};
retrieveOrderInfo();

HINWEIS: Das ist nur eine Notiz für das OID-ausschreib-Macro

*/

function addButtonsToNewOrderMenu() {
	const url = window.location.href;
	if (!url.includes('/plenty/terra/order/order-ui/new')) {
		return;
	}

	const headers = document.querySelectorAll('mat-step-header');
	const selected = document.querySelector('mat-step-header[aria-selected="true"]');
	const activeTabNumber = selected ? [...headers].indexOf(selected) : -1; // -1, wenn keins ausgewählt

	const activeTabPanel = document.querySelectorAll('div[role="tabpanel"]')[activeTabNumber];

	if (activeTabNumber !== 0 && activeTabNumber !== 2) {
		return;
	}

	const paymentSelector = activeTabPanel.querySelectorAll('div[class="col-12 d-flex"]')[2];

	if (!paymentSelector) {
		return;
	}

	if (paymentSelector.getAttribute('data-check')) {
		return;
	}

	// Setze das Attribut data-check = "true"

	const previousPaymentMethodButtons = document.querySelectorAll('button[paymentMethodButton]');
	previousPaymentMethodButtons.forEach(button => button.remove());

	document.querySelectorAll('div.col-12.d-flex').forEach(el => {
		el.removeAttribute('data-check');
	});

	paymentSelector.setAttribute('data-check', 'true');

	const buttonVorkasse = document.createElement('button');
	buttonVorkasse.textContent = 'Vorkasse';
	buttonVorkasse.title = 'Vorkasse';
	buttonVorkasse.style.backgroundColor = '#FDEB65';
	buttonVorkasse.style.color = 'black';
	buttonVorkasse.style.width = '120px';
	buttonVorkasse.style.height = '30px';
	buttonVorkasse.style.marginLeft = '8px';
	buttonVorkasse.style.marginTop = '8px';
	buttonVorkasse.style.marginBottom = '14px';
	buttonVorkasse.setAttribute("paymentMethodButton", "true");

	const buttonKreditkarte = document.createElement('button');
	buttonKreditkarte.textContent = 'Kreditkarte';
	buttonKreditkarte.title = 'Mollie: Kreditkarte';
	buttonKreditkarte.style.backgroundColor = '#222222';
	buttonKreditkarte.style.color = 'white';
	buttonKreditkarte.style.width = '120px';
	buttonKreditkarte.style.height = '30px';
	buttonKreditkarte.style.marginLeft = '8px';
	buttonKreditkarte.style.marginTop = '8px';
	buttonKreditkarte.style.marginBottom = '14px';
	buttonKreditkarte.setAttribute("paymentMethodButton", "true");

	const buttonPayPal = document.createElement('button');
	buttonPayPal.textContent = 'PayPal';
	buttonPayPal.title = 'PayPal: PayPal';
	buttonPayPal.style.backgroundColor = '#0070E0';
	buttonPayPal.style.color = 'white';
	buttonPayPal.style.width = '120px';
	buttonPayPal.style.height = '30px';
	buttonPayPal.style.marginLeft = '8px';
	buttonPayPal.style.marginTop = '8px';
	buttonPayPal.style.marginBottom = '14px';
	buttonPayPal.setAttribute("paymentMethodButton", "true");

	const buttonRechnung = document.createElement('button');
	buttonRechnung.textContent = 'Rechnung';
	buttonRechnung.title = 'Rechnung';
	buttonRechnung.style.backgroundColor = '#BC65EB';
	buttonRechnung.style.color = 'white';
	buttonRechnung.style.width = '120px';
	buttonRechnung.style.height = '30px';
	buttonRechnung.style.marginLeft = '8px';
	buttonRechnung.style.marginTop = '8px';
	buttonRechnung.style.marginBottom = '14px';
	buttonRechnung.setAttribute("paymentMethodButton", "true");

	const buttonBarzahlung = document.createElement('button');
	buttonBarzahlung.textContent = 'Barzahlung';
	buttonBarzahlung.title = 'Barzahlung';
	buttonBarzahlung.style.backgroundColor = '#1B5E20';
	buttonBarzahlung.style.color = 'white';
	buttonBarzahlung.style.width = '120px';
	buttonBarzahlung.style.height = '30px';
	buttonBarzahlung.style.marginLeft = '8px';
	buttonBarzahlung.style.marginTop = '8px';
	buttonBarzahlung.style.marginBottom = '14px';
	buttonBarzahlung.setAttribute("paymentMethodButton", "true");

	const container = paymentSelector.parentElement;

	container.insertBefore(buttonVorkasse, paymentSelector);
	buttonVorkasse.addEventListener('click', async () => {
	await changePaymentMethodNewOrder("Vorkasse");
	});

	container.insertBefore(buttonKreditkarte, paymentSelector);
	buttonKreditkarte.addEventListener('click', async () => {
	await changePaymentMethodNewOrder("Mollie: Kreditkarte");
	});

	container.insertBefore(buttonPayPal, paymentSelector);
	buttonPayPal.addEventListener('click', async () => {
	await changePaymentMethodNewOrder("PayPal: PayPal");
	});

	container.insertBefore(buttonRechnung, paymentSelector);
	buttonRechnung.addEventListener('click', async () => {
	await changePaymentMethodNewOrder("Rechnung");
	});

	container.insertBefore(buttonBarzahlung, paymentSelector);
	buttonBarzahlung.addEventListener('click', async () => {
	await changePaymentMethodNewOrder("Barzahlung");
	});

	//buttonVorkasse.style.marginLeft = '0px';
}

function moveZahlungsartToEnd() {
  const paymentMethodHost = document.querySelector('terra-order-ui-payment-method');
  if (!paymentMethodHost) return;

  const root = paymentMethodHost.parentElement?.parentElement;
  if (!root) return;

  const cards = root.querySelectorAll('div[class*="my-view-draggable-element col-6"');

  let zahlungsartEl = null;

  for (const el of cards) {
    const txt = (el.innerText || '').trim();
    if (txt.startsWith('Zahlungsart')) {
      zahlungsartEl = el;
      break;
    }
  }

  if (!zahlungsartEl) return;

  const parent = zahlungsartEl.parentElement;
  if (!parent) return;

  // Wenn bereits letztes Child → nichts tun
  if (parent.lastElementChild === zahlungsartEl) {
    return;
  }

  // Element als letztes Child des Parents einreihen
  parent.appendChild(zahlungsartEl);
};



function addButtonsToOrder() {
	const matLabels = document.querySelectorAll('mat-label');
	let auftragsTyp = false;

	matLabels.forEach(label => {
	if (label.innerText.trim() === "Auftragstyp") {
		auftragsTyp = label.parentElement.parentElement.parentElement.nextElementSibling.firstElementChild.value;
	}
	});

	//console.log(auftragsTyp);

	if (!auftragsTyp) {
		return;
	}

	const wawiPresenceContainer = document.querySelector('div[id="wawi-presence-container"]');

	if (!auftragsTyp) {
		return;
	}

	moveZahlungsartToEnd()

	//auskommentiert, weil tagBar in Verwendung:
	//const firstRow = document.querySelectorAll('terra-my-view-column')[0]
	const tagBar = document.querySelector('div[class="sortable-list sortableDisabled row"]');
	const secondRow = document.querySelector('terra-order-ui-payment-method').parentElement.parentElement
	const url = window.location.href;
	const regex = /plenty\/terra\/order\/order-ui[^/]*\/.*(\d{6})/; // Regex für order-ui mit Anhang vor dem nächsten /
	const match = url.match(regex);
	let oid = null;
	if (match && match[1]) {
		oid = match[1];
	}

	if (tagBar.getAttribute('data-check') && tagBar.getAttribute('id').includes(oid)) {
		return;
	}

	if (!tagBar) {
		return;
	}

	// Setze das Attribut data-check = "true"
	tagBar.setAttribute('data-check', 'true');
	tagBar.id = "tagBar_" + oid;

	const previousStatusButtons = document.querySelectorAll('button[statusButton]');
	previousStatusButtons.forEach(button => button.remove());
	const previousPaymentMethodButtons = document.querySelectorAll('button[paymentMethodButton]');
	previousPaymentMethodButtons.forEach(button => button.remove());

	const button2 = document.createElement('button');
	button2.textContent = '2';
	button2.title = 'Warten auf Freischaltung';
	button2.style.backgroundColor = '#FDEB65';
	button2.style.color = 'black';
	button2.style.width = '54px';
	button2.style.height = '30px';
	button2.style.marginLeft = '8px';
	button2.style.marginBottom = '8px';
	button2.setAttribute("statusButton", "true");

	const button2dot01 = document.createElement('button');
	button2dot01.textContent = '2.01';
	button2dot01.title = 'Ungültige Upgrade-Konstellation, warten auf Kundenrückmeldung';
	button2dot01.style.backgroundColor = '#F8C546';
	button2dot01.style.color = 'black';
	button2dot01.style.width = '54px';
	button2dot01.style.height = '30px';
	button2dot01.style.marginLeft = '8px';
	button2dot01.style.marginBottom = '8px';
	button2dot01.setAttribute("statusButton", "true");

	const button2dot1 = document.createElement('button');
	button2dot1.textContent = '2.1';
	button2dot1.title = 'Reserviert';
	button2dot1.style.backgroundColor = '#F8C546';
	button2dot1.style.color = 'black';
	button2dot1.style.width = '54px';
	button2dot1.style.height = '30px';
	button2dot1.style.marginLeft = '8px';
	button2dot1.style.marginBottom = '8px';
	button2dot1.setAttribute("statusButton", "true");

	const button2dot32 = document.createElement('button');
	button2dot32.textContent = '2.32';
	button2dot32.title = 'Angebotsprüfung';
	button2dot32.style.backgroundColor = '#BC65EB';
	button2dot32.style.color = 'white';
	button2dot32.style.width = '54px';
	button2dot32.style.height = '30px';
	button2dot32.style.marginLeft = '8px';
	button2dot32.style.marginBottom = '8px';
	button2dot32.setAttribute("statusButton", "true");

	const button2dot5 = document.createElement('button');
	button2dot5.textContent = '2.5';
	button2dot5.title = 'Angebot erfolgreich';
	button2dot5.style.backgroundColor = '#3B804D';
	button2dot5.style.color = 'white';
	button2dot5.style.width = '54px';
	button2dot5.style.height = '30px';
	button2dot5.style.marginLeft = '8px';
	button2dot5.style.marginBottom = '8px';
	button2dot5.setAttribute("statusButton", "true");

	const button2dot7 = document.createElement('button');
	button2dot7.textContent = '2.7';
	button2dot7.title = 'Bonitätsprüfung durch Mitarbeiter';
	button2dot7.style.backgroundColor = '#BC65EB';
	button2dot7.style.color = 'white';
	button2dot7.style.width = '54px';
	button2dot7.style.height = '30px';
	button2dot7.style.marginLeft = '8px';
	button2dot7.style.marginBottom = '8px';
	button2dot7.setAttribute("statusButton", "true");

	const button2dot9 = document.createElement('button');
	button2dot9.textContent = '2.9';
	button2dot9.title = 'Freigabe erteilt (offene Rechnung)';
	button2dot9.style.backgroundColor = '#61CE7C';
	button2dot9.style.color = 'black';
	button2dot9.style.width = '54px';
	button2dot9.style.height = '30px';
	button2dot9.style.marginLeft = '8px';
	button2dot9.style.marginBottom = '8px';
	button2dot9.setAttribute("statusButton", "true");

	const button2dot91 = document.createElement('button');
	button2dot91.textContent = '2.91';
	button2dot91.title = 'Rechnungskauf abgelehnt';
	button2dot91.style.backgroundColor = '#D8503F';
	button2dot91.style.color = 'white';
	button2dot91.style.width = '54px';
	button2dot91.style.height = '30px';
	button2dot91.style.marginLeft = '8px';
	button2dot91.style.marginBottom = '8px';
	button2dot91.setAttribute("statusButton", "true");

	const button3 = document.createElement('button');
	button3.textContent = '3';
	button3.title = 'Warten auf Zahlung';
	button3.style.backgroundColor = '#F6B341';
	button3.style.color = 'black';
	button3.style.width = '54px';
	button3.style.height = '30px';
	button3.style.marginLeft = '8px';
	button3.style.marginBottom = '8px';
	button3.setAttribute("statusButton", "true");

	const button3dot93 = document.createElement('button');
	button3dot93.textContent = '3.93';
	button3dot93.title = 'Rücktrittserklärung aus 3.91 und 3.92';
	button3dot93.style.backgroundColor = '#873226';
	button3dot93.style.color = 'white';
	button3dot93.style.width = '54px';
	button3dot93.style.height = '30px';
	button3dot93.style.marginLeft = '8px';
	button3dot93.style.marginBottom = '8px';
	button3dot93.setAttribute("statusButton", "true");

	const button4dot91 = document.createElement('button');
	button4dot91.textContent = '4.91';
	button4dot91.title = 'Ust.ID-Prüfung fehlgeschlagen, in Bearbeitung';
	button4dot91.style.backgroundColor = '#D8503F';
	button4dot91.style.color = 'white';
	button4dot91.style.width = '54px';
	button4dot91.style.height = '30px';
	button4dot91.style.marginLeft = '8px';
	button4dot91.style.marginBottom = '8px';
	button4dot91.setAttribute("statusButton", "true");

	const button5 = document.createElement('button');
	button5.textContent = '5';
	button5.title = 'Auftragsprüfung';
	button5.style.backgroundColor = '#FFFF73';
	button5.style.color = 'black';
	button5.style.width = '54px';
	button5.style.height = '30px';
	button5.style.marginLeft = '8px';
	button5.style.marginBottom = '8px';
	button5.setAttribute("statusButton", "true");

	const button5dot1 = document.createElement('button');
	button5dot1.textContent = '5.1';
	button5dot1.title = 'Bereit für Kommissionierung';
	button5dot1.style.backgroundColor = '#61CE7C';
	button5dot1.style.color = 'black';
	button5dot1.style.width = '54px';
	button5dot1.style.height = '30px';
	button5dot1.style.marginLeft = '8px';
	button5dot1.style.marginBottom = '8px';
	button5dot1.setAttribute("statusButton", "true");

	const button5dot12 = document.createElement('button');
	button5dot12.textContent = '5.12';
	button5dot12.title = 'Bereit für Kommissionierung mit Upgrades';
	button5dot12.style.backgroundColor = '#F9CE53';
	button5dot12.style.color = 'black';
	button5dot12.style.width = '54px';
	button5dot12.style.height = '30px';
	button5dot12.style.marginLeft = '8px';
	button5dot12.style.marginBottom = '8px';
	button5dot12.setAttribute("statusButton", "true");

	const button6dot01 = document.createElement('button');
	button6dot01.textContent = '6.01';
	button6dot01.title = 'Auftrag geändert nach FF';
	button6dot01.style.backgroundColor = '#123F9E';
	button6dot01.style.color = 'white';
	button6dot01.style.width = '54px';
	button6dot01.style.height = '30px';
	button6dot01.style.marginLeft = '8px';
	button6dot01.style.marginBottom = '8px';
	button6dot01.setAttribute("statusButton", "true");

	const button8 = document.createElement('button');
	button8.textContent = '8';
	button8.title = 'Storniert';
	button8.style.backgroundColor = '#999999';
	button8.style.color = 'black';
	button8.style.width = '54px';
	button8.style.height = '30px';
	button8.style.marginLeft = '8px';
	button8.style.marginBottom = '8px';
	button8.setAttribute("statusButton", "true");

	const button8dot2 = document.createElement('button');
	button8dot2.textContent = '8.2';
	button8dot2.title = 'Retoure storniert';
	button8dot2.style.backgroundColor = '#999999';
	button8dot2.style.color = 'black';
	button8dot2.style.width = '54px';
	button8dot2.style.height = '30px';
	button8dot2.style.marginLeft = '8px';
	button8dot2.style.marginBottom = '8px';
	button8dot2.setAttribute("statusButton", "true");

	const button8dot5 = document.createElement('button');
	button8dot5.textContent = '8.5';
	button8dot5.title = 'Stornierte Angebote';
	button8dot5.style.backgroundColor = '#999999';
	button8dot5.style.color = 'black';
	button8dot5.style.width = '54px';
	button8dot5.style.height = '30px';
	button8dot5.style.marginLeft = '8px';
	button8dot5.style.marginBottom = '8px';
	button8dot5.setAttribute("statusButton", "true");

	const button9dot10 = document.createElement('button');
	button9dot10.textContent = '9.10';
	button9dot10.title = 'Retoure, warten auf Rückmeldung des Kunden';
	button9dot10.style.backgroundColor = '#EAC24E';
	button9dot10.style.color = 'black';
	button9dot10.style.width = '54px';
	button9dot10.style.height = '30px';
	button9dot10.style.marginLeft = '8px';
	button9dot10.style.marginBottom = '8px';
	button9dot10.setAttribute("statusButton", "true");

	const button9dot21 = document.createElement('button');
	button9dot21.textContent = '9.21';
	button9dot21.title = 'Retourenfreigabe mit Label';
	button9dot21.style.backgroundColor = '#F9CE53';
	button9dot21.style.color = 'black';
	button9dot21.style.width = '54px';
	button9dot21.style.height = '30px';
	button9dot21.style.marginLeft = '8px';
	button9dot21.style.marginBottom = '8px';
	button9dot21.setAttribute("statusButton", "true");

	const button9dot22 = document.createElement('button');
	button9dot22.textContent = '9.22';
	button9dot22.title = 'Retourenfreigabe mit Rücksendeinfo';
	button9dot22.style.backgroundColor = '#F9CE53';
	button9dot22.style.color = 'black';
	button9dot22.style.width = '54px';
	button9dot22.style.height = '30px';
	button9dot22.style.marginLeft = '8px';
	button9dot22.style.marginBottom = '8px';
	button9dot22.setAttribute("statusButton", "true");

	const button9dot31 = document.createElement('button');
	button9dot31.textContent = '9.31';
	button9dot31.title = 'Retoure, Warten auf Wareneingang';
	button9dot31.style.backgroundColor = '#F9CE53';
	button9dot31.style.color = 'black';
	button9dot31.style.width = '54px';
	button9dot31.style.height = '30px';
	button9dot31.style.marginLeft = '8px';
	button9dot31.style.marginBottom = '8px';
	button9dot31.setAttribute("statusButton", "true");

	const button9dot32 = document.createElement('button');
	button9dot32.textContent = '9.32';
	button9dot32.title = 'Retoure (Austausch), Warten auf Wareneingang';
	button9dot32.style.backgroundColor = '#F9CE53';
	button9dot32.style.color = 'black';
	button9dot32.style.width = '54px';
	button9dot32.style.height = '30px';
	button9dot32.style.marginLeft = '8px';
	button9dot32.style.marginBottom = '8px';
	button9dot32.setAttribute("statusButton", "true");

	const button9dot33 = document.createElement('button');
	button9dot33.textContent = '9.33';
	button9dot33.title = 'Retoure (Vorab-Austausch), Warten auf Wareneingang';
	button9dot33.style.backgroundColor = '#F9CE53';
	button9dot33.style.color = 'black';
	button9dot33.style.width = '54px';
	button9dot33.style.height = '30px';
	button9dot33.style.marginLeft = '8px';
	button9dot33.style.marginBottom = '8px';
	button9dot33.setAttribute("statusButton", "true");

	const button9dot80 = document.createElement('button');
	button9dot80.textContent = '9.80';
	button9dot80.title = 'Retoure freigegeben zur Gutschrift';
	button9dot80.style.backgroundColor = '#B8675E';
	button9dot80.style.color = 'white';
	button9dot80.style.width = '54px';
	button9dot80.style.height = '30px';
	button9dot80.style.marginLeft = '8px';
	button9dot80.style.marginBottom = '8px';
	button9dot80.setAttribute("statusButton", "true");

	const button9dot91 = document.createElement('button');
	button9dot91.textContent = '9.91';
	button9dot91.title = 'Retoure erledigt';
	button9dot91.style.backgroundColor = '#031026';
	button9dot91.style.color = 'white';
	button9dot91.style.width = '54px';
	button9dot91.style.height = '30px';
	button9dot91.style.marginLeft = '8px';
	button9dot91.style.marginBottom = '8px';
	button9dot91.setAttribute("statusButton", "true");

	const button9dot92 = document.createElement('button');
	button9dot92.textContent = '9.92';
	button9dot92.title = 'Widerruf erledigt';
	button9dot92.style.backgroundColor = '#031026';
	button9dot92.style.color = 'white';
	button9dot92.style.width = '54px';
	button9dot92.style.height = '30px';
	button9dot92.style.marginLeft = '8px';
	button9dot92.style.marginBottom = '8px';
	button9dot92.setAttribute("statusButton", "true");




	const buttonDummy = document.createElement('button');
	buttonDummy.textContent = ''; // kein Text
	buttonDummy.title = '';       // kein Tooltip

	// Unbenutzbar + aus dem A11y/Tabflow raus
	buttonDummy.disabled = true;
	buttonDummy.tabIndex = -1;
	buttonDummy.setAttribute('aria-hidden', 'true');
	// falls unterstützt:
	buttonDummy.setAttribute('inert', ''); // oder: buttonDummy.inert = true;

	// Spacing/Optik
	buttonDummy.style.width = '120px';
	buttonDummy.style.height = '25px';
	buttonDummy.style.marginLeft = '8px';
	buttonDummy.style.marginBottom = '8px';

	// Unsichtbar/transparent, aber nimmt Platz ein
	buttonDummy.style.opacity = '0';
	buttonDummy.style.pointerEvents = 'none';
	buttonDummy.style.border = 'none';
	buttonDummy.style.outline = 'none';
	buttonDummy.style.boxShadow = 'none';
	buttonDummy.style.background = 'transparent';
	buttonDummy.style.color = 'transparent';
	buttonDummy.style.userSelect = 'none';
	buttonDummy.style.cursor = 'default';

	buttonDummy.setAttribute('paymentMethodButton', 'true');




	const buttonVorkasse = document.createElement('button');
	buttonVorkasse.textContent = 'Vorkasse';
	buttonVorkasse.title = 'Vorkasse';
	buttonVorkasse.style.backgroundColor = '#FDEB65';
	buttonVorkasse.style.color = 'black';
	buttonVorkasse.style.width = '120px';
	buttonVorkasse.style.height = '30px';
	buttonVorkasse.style.marginLeft = '8px';
	buttonVorkasse.style.marginBottom = '8px';
	buttonVorkasse.setAttribute("paymentMethodButton", "true");

	const buttonKreditkarte = document.createElement('button');
	buttonKreditkarte.textContent = 'Kreditkarte';
	buttonKreditkarte.title = 'Mollie: Kreditkarte';
	buttonKreditkarte.style.backgroundColor = '#222222';
	buttonKreditkarte.style.color = 'white';
	buttonKreditkarte.style.width = '120px';
	buttonKreditkarte.style.height = '30px';
	buttonKreditkarte.style.marginLeft = '8px';
	buttonKreditkarte.style.marginBottom = '8px';
	buttonKreditkarte.setAttribute("paymentMethodButton", "true");

	const buttonPayPal = document.createElement('button');
	buttonPayPal.textContent = 'PayPal';
	buttonPayPal.title = 'PayPal: PayPal';
	buttonPayPal.style.backgroundColor = '#0070E0';
	buttonPayPal.style.color = 'white';
	buttonPayPal.style.width = '120px';
	buttonPayPal.style.height = '30px';
	buttonPayPal.style.marginLeft = '8px';
	buttonPayPal.style.marginBottom = '8px';
	buttonPayPal.setAttribute("paymentMethodButton", "true");

	const buttonRechnung = document.createElement('button');
	buttonRechnung.textContent = 'Rechnung';
	buttonRechnung.title = 'Rechnung';
	buttonRechnung.style.backgroundColor = '#BC65EB';
	buttonRechnung.style.color = 'white';
	buttonRechnung.style.width = '120px';
	buttonRechnung.style.height = '30px';
	buttonRechnung.style.marginLeft = '8px';
	buttonRechnung.style.marginBottom = '8px';
	buttonRechnung.setAttribute("paymentMethodButton", "true");

	const buttonBarzahlung = document.createElement('button');
	buttonBarzahlung.textContent = 'Barzahlung';
	buttonBarzahlung.title = 'Barzahlung';
	buttonBarzahlung.style.backgroundColor = '#1B5E20';
	buttonBarzahlung.style.color = 'white';
	buttonBarzahlung.style.width = '120px';
	buttonBarzahlung.style.height = '30px';
	buttonBarzahlung.style.marginLeft = '8px';
	buttonBarzahlung.style.marginBottom = '8px';
	buttonBarzahlung.setAttribute("paymentMethodButton", "true");


	if (auftragsTyp === "Angebot") {
		tagBar.insertBefore(button8dot5, tagBar.firstChild);
		button8dot5.addEventListener('click', async () => {
			await changeStatus("8.5");
		});

		tagBar.insertBefore(button2dot5, tagBar.firstChild);
		button2dot5.addEventListener('click', async () => {
			await changeStatus("2.5");
		});

		tagBar.insertBefore(button2dot32, tagBar.firstChild);
		button2dot32.addEventListener('click', async () => {
			await changeStatus("2.32");
		});

		//button2dot32.style.marginLeft = '0px';
	} else if (auftragsTyp === "Auftrag") {
		tagBar.insertBefore(button8, tagBar.firstChild);
		button8.addEventListener('click', async () => {
			await changeStatus("8");
		});

		tagBar.insertBefore(button6dot01, tagBar.firstChild);
		button6dot01.addEventListener('click', async () => {
			await changeStatus("6.01");
		});
		
		tagBar.insertBefore(button5dot12, tagBar.firstChild);
		button5dot12.addEventListener('click', async () => {
			await changeStatus("5.12");
		});

		tagBar.insertBefore(button5dot1, tagBar.firstChild);
		button5dot1.addEventListener('click', async () => {
			await changeStatus("5.1");
		});

		tagBar.insertBefore(button5, tagBar.firstChild);
		button5.addEventListener('click', async () => {
			await changeStatus("5");
		});

		tagBar.insertBefore(button4dot91, tagBar.firstChild);
		button4dot91.addEventListener('click', async () => {
			await changeStatus("4.91");
		});

		tagBar.insertBefore(button3dot93, tagBar.firstChild);
		button3dot93.addEventListener('click', async () => {
			await changeStatus("3.93");
		});

		tagBar.insertBefore(button3, tagBar.firstChild);
		button3.addEventListener('click', async () => {
			await changeStatus("3");
		});

		tagBar.insertBefore(button2dot91, tagBar.firstChild);
		button2dot91.addEventListener('click', async () => {
			await changeStatus("2.91");
		});

		tagBar.insertBefore(button2dot9, tagBar.firstChild);
		button2dot9.addEventListener('click', async () => {
			await changeStatus("2.9");
		});

		tagBar.insertBefore(button2dot7, tagBar.firstChild);
		button2dot7.addEventListener('click', async () => {
			await changeStatus("2.7");
		});

		tagBar.insertBefore(button2dot1, tagBar.firstChild);
		button2dot1.addEventListener('click', async () => {
			await changeStatus("2.1");
		});

		tagBar.insertBefore(button2dot01, tagBar.firstChild);
		button2dot01.addEventListener('click', async () => {
			await changeStatus("2.01");
		});

		tagBar.insertBefore(button2, tagBar.firstChild);
		button2.addEventListener('click', async () => {
			await changeStatus("2");
		});

		//button2.style.marginLeft = '0px';
	} else if (auftragsTyp === "Retoure") {
		tagBar.insertBefore(button9dot92, tagBar.firstChild);
		button9dot92.addEventListener('click', async () => {
			await changeStatus("9.92");
		});

		tagBar.insertBefore(button9dot91, tagBar.firstChild);
		button9dot91.addEventListener('click', async () => {
			await changeStatus("9.91");
		});

		tagBar.insertBefore(button9dot80, tagBar.firstChild);
		button9dot80.addEventListener('click', async () => {
			await changeStatus("9.80");
		});

		tagBar.insertBefore(button9dot33, tagBar.firstChild);
		button9dot33.addEventListener('click', async () => {
			await changeStatus("9.33");
		});

		tagBar.insertBefore(button9dot32, tagBar.firstChild);
		button9dot32.addEventListener('click', async () => {
			await changeStatus("9.32");
		});

		tagBar.insertBefore(button9dot31, tagBar.firstChild);
		button9dot31.addEventListener('click', async () => {
			await changeStatus("9.31");
		});

		tagBar.insertBefore(button9dot22, tagBar.firstChild);
		button9dot22.addEventListener('click', async () => {
			await changeStatus("9.22");
		});

		tagBar.insertBefore(button9dot21, tagBar.firstChild);
		button9dot21.addEventListener('click', async () => {
			await changeStatus("9.21");
		});

		tagBar.insertBefore(button9dot10, tagBar.firstChild);
		button9dot10.addEventListener('click', async () => {
			await changeStatus("9.10");
		});

		tagBar.insertBefore(button8dot2, tagBar.firstChild);
		button8dot2.addEventListener('click', async () => {
			await changeStatus("8.2");
		});

		//button8dot2.style.marginLeft = '0px';
	} else if (auftragsTyp === "Gewährleistung") {
		tagBar.insertBefore(button8, tagBar.firstChild);
		button8.addEventListener('click', async () => {
			await changeStatus("8");
		});

		tagBar.insertBefore(button6dot01, tagBar.firstChild);
		button6dot01.addEventListener('click', async () => {
			await changeStatus("6.01");
		});

		tagBar.insertBefore(button5dot12, tagBar.firstChild);
		button5dot12.addEventListener('click', async () => {
			await changeStatus("5.12");
		});

		tagBar.insertBefore(button5dot1, tagBar.firstChild);
		button5dot1.addEventListener('click', async () => {
			await changeStatus("5.1");
		});

		tagBar.insertBefore(button5, tagBar.firstChild);
		button5.addEventListener('click', async () => {
			await changeStatus("5");
		});

		tagBar.insertBefore(button2, tagBar.firstChild);
		button2.addEventListener('click', async () => {
			await changeStatus("2");
		});

		//button2.style.marginLeft = '0px';
	}

	if (auftragsTyp === "Auftrag" || auftragsTyp === "Angebot" || auftragsTyp === "Gewährleistung") {
		const count = secondRow.querySelectorAll('div[class*="my-view-draggable-element"]').length;
		let insertBeforeSelector = null;
		if (count % 2 === 0) {
		// gerade Anzahl
			insertBeforeSelector = secondRow.lastElementChild.previousElementSibling;
		} else {
		// ungerade Anzahl
			insertBeforeSelector = secondRow.lastElementChild;
		}

		secondRow.insertBefore(buttonBarzahlung, insertBeforeSelector)
		buttonBarzahlung.addEventListener('click', async () => {
			await changePaymentMethod("Barzahlung");
		});

		secondRow.insertBefore(buttonRechnung, insertBeforeSelector)
		buttonRechnung.addEventListener('click', async () => {
			await changePaymentMethod("Rechnung");
		});

		secondRow.insertBefore(buttonPayPal, insertBeforeSelector)
		buttonPayPal.addEventListener('click', async () => {
			await changePaymentMethod("PayPal: PayPal");
		});

		secondRow.insertBefore(buttonKreditkarte, insertBeforeSelector)
		buttonKreditkarte.addEventListener('click', async () => {
			await changePaymentMethod("Mollie: Kreditkarte");
		});

		secondRow.insertBefore(buttonVorkasse, insertBeforeSelector)
		buttonVorkasse.addEventListener('click', async () => {
			await changePaymentMethod("Vorkasse");
		});

		//buttonVorkasse.style.marginLeft = '0px';
	}

	if (auftragsTyp === "Retoure") {
		secondRow.insertBefore(buttonDummy, insertBeforeSelector)
	}

	// Selektiere das gewünschte mat-icon Element
	const emailIcon = Array.from(document.querySelectorAll('mat-icon.mat-icon.notranslate'))
		.find(icon => icon.innerText.trim() === 'email');

	let emailButton = null;

	if (emailIcon && emailIcon.parentElement) {
		emailButton = emailIcon.parentElement;
	} else {
		console.error("Email Button nicht gefunden, kann nicht duplizieren!");
	}

	const oidCurrentBtn = document.querySelector(`button[id*="${oid}"]`);
	//console.log("VOR if-Bedingung-Check: emailButton vorhanden, oid = " + oid + ", oidCurrentBtn = " + oidCurrentBtn + ", emailButton has Attribute data-check = " + emailButton.hasAttribute('data-check'));
	// Überprüfe, ob das Element existiert und das Attribut "data-check" nicht vorhanden ist
	if ((emailButton && !emailButton.hasAttribute('data-check') && oid) || (emailButton && emailButton.hasAttribute('data-check') && !oidCurrentBtn && oid)) {
		//console.log("if-Bedingung true. emailButton vorhanden, oid = " + oid + ", oidCurrentBtn = " + oidCurrentBtn + ", emailButton has Attribute data-check = " + emailButton.hasAttribute('data-check') + ". Entferne bestehende Buttons und erstelle sie neu.");
		// Füge das Hilfsattribut hinzu
		if (!emailButton.hasAttribute('data-check')) emailButton.setAttribute('data-check', 'true');

		const previousEmailButtons = document.querySelectorAll('button[emailType]');
		previousEmailButtons.forEach(button => button.remove());

		// Dupliziere das Element zwei Mal
		const parent = emailButton.parentElement; // Elternknoten holen, um die Duplikate einzufügen
		if (parent && auftragsTyp === "Angebot") {
			const clone = emailButton.cloneNode(true); // Erstelle eine Kopie des Elements
			
			clone.removeAttribute('mat-ripple-loader-disabled');
			clone.removeAttribute('disabled');
			clone.classList.remove('mat-mdc-button-disabled');
			parent.insertBefore(clone, wawiPresenceContainer); // Füge die Kopie als Kind des Elternknotens ein, aber VOR dem wawiPresenceContainer
			//parent.appendChild(clone); // Füge die Kopie als Kind des Elternknotens ein
			const span = document.createElement('span');
			span.style.cssText = 'font-weight: bold; position: absolute; left: 9.5px; bottom: 2px; font-size: 10px;';
			span.textContent = 'ANG';
			clone.title = 'Angebot senden';
			clone.id = 'an_' + oid;
			clone.setAttribute('emailType', 'angebot');
			clone.appendChild(span);
			clone.addEventListener('click', async () => {
				const emailType = clone.getAttribute('emailType');
				if (emailType) {
					await sendEmail(emailType);
				}
			});
		} else if (parent && auftragsTyp === "Auftrag") {
			for (let i = 0; i < 3; i++) {
				const clone = emailButton.cloneNode(true); // Erstelle eine Kopie des Elements
				parent.insertBefore(clone, wawiPresenceContainer); // Füge die Kopie als Kind des Elternknotens ein, aber VOR dem wawiPresenceContainer
				//parent.appendChild(clone); // Füge die Kopie als Kind des Elternknotens ein
				clone.removeAttribute('mat-ripple-loader-disabled');
				clone.removeAttribute('disabled');
				clone.classList.remove('mat-mdc-button-disabled');
				const span = document.createElement('span');
				if (i === 0) {
					clone.setAttribute('emailType', 'bestellbestaetigung');
					span.style.cssText = 'font-weight: bold; position: absolute; left: 14px; bottom: 2px; font-size: 10px;';
					span.textContent = 'BB';
					clone.title = 'Bestellbestätigung senden';
					clone.id = 'bb_' + oid;
				} else if (i === 1) {
					clone.setAttribute('emailType', 'rechnungsversand');
					span.style.cssText = 'font-weight: bold; position: absolute; left: 14px; bottom: 2px; font-size: 10px;';
					span.textContent = 'RE';
					clone.title = 'Rechnung senden';
					clone.id = 're_' + oid;
				} else {
					clone.setAttribute('emailType', 'software');
					span.style.cssText = 'font-weight: bold; position: absolute; left: 12.5px; bottom: 2px; font-size: 10px;';
					span.textContent = 'SW';
					clone.title = 'Softwareversand';
					clone.id = 'sw_' + oid;
				}
				clone.addEventListener('click', async () => {
					const emailType = clone.getAttribute('emailType');
					if (emailType) {
						await sendEmail(emailType);
					}
				});		
				clone.appendChild(span);
			}
		}
	}
}

async function sendEmail(emailType) {
	const auftragsInfoContainer = document.querySelector('terra-order-ui-details-view');
	const panelTitles = auftragsInfoContainer.querySelectorAll('mat-panel-title');
	const matchingPanelTitle = Array.from(panelTitles).find(title => title.innerText.includes('Dokumente'));
	const dokumentePanelDiv = matchingPanelTitle.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
	let docSearchTerm = null;
	let iteration = 0;

	if (emailType === "angebot") {
		docSearchTerm = "offer_AN-";
		docCreateSearchTerm = "Angebot";
		alertMessageDocNotPresent = "Kein Angebotsdokument vorhanden!";
		alertMessageDocNotReady = "Angebotsdokument noch in Erstellung!";
	} else if (emailType === "rechnungsversand") {
		docSearchTerm = "invoice_RG-";
		docCreateSearchTerm = "Rechnung";
		alertMessageDocNotPresent = "Kein Rechnungsdokument vorhanden!";
		alertMessageDocNotReady = "Rechnungsdokument noch in Erstellung!";
	} else if (emailType !== "bestellbestaetigung" && emailType !== "software") {
		console.error("emailType invalid!");
		return;
	}

	let documentPresent = null;
	if (emailType !== "bestellbestaetigung" && emailType !== "software") {
		const tdElements = Array.from(dokumentePanelDiv.querySelectorAll('td'));

		if (docSearchTerm === "invoice_RG-") {
			let foundReversal = false;

			// Iteriere durch die td-Elemente
			for (let td of tdElements) {
				if (td.innerText.includes("reversal_document_")) {
					foundReversal = true; // Markiere, dass ein "reversal_document_" gefunden wurde
				}

				if (td.innerText.includes(docSearchTerm)) {
					if (foundReversal) {
						documentPresent = null;
						break;
					} else {
						// Ansonsten das Element speichern
						documentPresent = td;
						break;
					}
				}
			}
		} else {
			// Standardfall: Finde das Element basierend auf docSearchTerm
			documentPresent = Array.from(tdElements).find(td => td.innerText.includes(docSearchTerm));
		}
		if (!documentPresent) {
			//alert(alertMessageDocNotPresent);
			const docButtons = dokumentePanelDiv.querySelectorAll('mat-icon');
			if (!docButtons) {
				console.error("docButtons nicht gefunden!");
				return;
			}
			const docAddButtonIcon = Array.from(docButtons).find(icon => icon.innerText.trim() === 'add');
			if (!docAddButtonIcon || !docAddButtonIcon.parentElement) {
				console.error("docAddButtonIcon nicht gefunden!");
				return;
			}
			const docAddButton = docAddButtonIcon.parentElement;
			docAddButton.click();
			while (true) {
				iteration++;
				if (iteration === 2000) {
					//console.warn("(DOKUMENTENERSTELLUNG) erster while loop in der sendEmail (DOKUMENTENERSTELLUNG) Funktion timed out!");
					return;
				}
				await sleep(10);
				const overlayContainer = document.querySelector('div[class="cdk-overlay-container"]');
				const overlay = overlayContainer.lastChild;
				if (!overlay) continue;
				const buttonSpans = overlay.querySelectorAll('span')
				if (!buttonSpans) continue;
				const correctButtonSpan = Array.from(buttonSpans).find(span => span.innerText.trim() === docCreateSearchTerm);
				if (!correctButtonSpan || !correctButtonSpan.parentElement) continue;
				const docCreateBtn = correctButtonSpan.parentElement;
				docCreateBtn.click();
				break;
			}
			while (true) {
				iteration++;
				if (iteration === 2000) {
					//console.warn("(DOKUMENTENERSTELLUNG) zweiter while loop in der sendEmail (DOKUMENTENERSTELLUNG) Funktion timed out!");
					return;
				}
				await sleep(10);
				const overlay = document.querySelector('terra-order-documents-create-dialog')
				if (!overlay) continue;
				const buttons = overlay.querySelectorAll('button')
				if (!buttons) continue;
				const correctButton = Array.from(buttons).find(node => node.innerText.trim() === 'add\nERSTELLEN');
				if (!correctButton) continue;
				correctButton.click();
				document.querySelector('terra-my-view-row').style.opacity = "0.5";
				document.querySelector('terra-my-view-row').style.pointerEvents = "none";
				break;
			}
			while (true) {
				iteration++;
				if (iteration % 100 === 0) {
					//console.log((iteration / 100) + ". Sekunde vorüber, suche refreshButton, um DocList zu refreshen...");
					const refreshIcon = Array.from(dokumentePanelDiv.querySelectorAll('mat-icon')).find(icon => icon.innerText.trim() === 'refresh');
					if (!refreshIcon) {
						console.error("refresh icon nicht gefunden, breche Funktion sendEmail ab!");
						return;
					}
					const refreshButton = refreshIcon.parentElement;
					if (!refreshButton) {
						console.error("refresh button nicht gefunden, breche Funktion sendEmail ab!");
						return;
					}
					//console.log("refreshButton gefunden, refreshe DocList...");
					refreshButton.click();
				}
				if (iteration === 2000) {
					//console.warn("(DOKUMENTENERSTELLUNG) dritter while loop in der sendEmail (DOKUMENTENERSTELLUNG) Funktion timed out!");
					document.querySelector('terra-my-view-row').style.opacity = "1";
					document.querySelector('terra-my-view-row').style.pointerEvents = "all";
					return;
				}
				await sleep(10);
				const tdElements = dokumentePanelDiv.querySelectorAll('td');

				if (docSearchTerm === "invoice_RG-") {
					let foundReversal = false;
		
					// Iteriere durch die td-Elemente
					for (let td of tdElements) {
						if (td.innerText.includes("reversal_document_")) {
							foundReversal = true; // Markiere, dass ein "reversal_document_" gefunden wurde
						}
		
						if (td.innerText.includes(docSearchTerm)) {
							if (foundReversal) {
								documentPresent = null;
								break;
							} else {
								// Ansonsten das Element speichern
								documentPresent = td;
								break;
							}
						}
					}
				} else {
					// Standardfall: Finde das Element basierend auf docSearchTerm
					if (!tdElements || tdElements.length < 2) {
						continue;
					}
					documentPresent = Array.from(tdElements).find(td => td.innerText.includes(docSearchTerm));
				}

				if (!documentPresent) continue;
				const readyStateElement = documentPresent.nextElementSibling;
				if (!readyStateElement) continue;
				const readyState = readyStateElement.innerText;
				if (readyState === "Fertig") {
					//console.log("Dokument ist jetzt fertig, mache weiter...");
					break;
				}
			}
			while (true) {
				iteration++;
				if (iteration === 2000) {
					//console.warn("(DOKUMENTENERSTELLUNG) vierter while loop in der sendEmail (DOKUMENTENERSTELLUNG) Funktion timed out!");
					document.querySelector('terra-my-view-row').style.opacity = "1";
					document.querySelector('terra-my-view-row').style.pointerEvents = "all";
					return;
				}
				await sleep(10);
				const emailIcon = Array.from(document.querySelectorAll('mat-icon.mat-icon.notranslate'))
					.find(icon => icon.innerText.trim() === 'email');
				if (emailIcon && emailIcon.parentElement && !emailIcon.hasAttribute("disabled")) {
					document.querySelector('terra-my-view-row').style.opacity = "1";
					document.querySelector('terra-my-view-row').style.pointerEvents = "all";
					break;
				} else if (!emailIcon || !emailIcon.parentElement) {
					console.error("Email Button nicht gefunden, breche ab!");
					document.querySelector('terra-my-view-row').style.opacity = "1";
					document.querySelector('terra-my-view-row').style.pointerEvents = "all";
					return;
				}
			}
			await sleep(500);
		}
		const readyStateElement = documentPresent.nextElementSibling;
		if (!readyStateElement) {
			console.error("readyStateElement nicht gefunden, breche ab!");
			return;
		}
		const readyState = readyStateElement.innerText;
		if (readyState !== "Fertig") {
			document.querySelector('terra-my-view-row').style.opacity = "0.5";
			document.querySelector('terra-my-view-row').style.pointerEvents = "none";
			while (true) {
				iteration++;
				if (iteration === 2000) {
					//console.warn("(DOKUMENTENERSTELLUNG) dritter while loop in der sendEmail (DOKUMENTENERSTELLUNG) Funktion timed out!");
					document.querySelector('terra-my-view-row').style.opacity = "1";
					document.querySelector('terra-my-view-row').style.pointerEvents = "all";
					return;
				}
				await sleep(10);
				const tdElements = dokumentePanelDiv.querySelectorAll('td');
				documentPresent = Array.from(tdElements).find(td => td.innerText.includes(docSearchTerm));
				if (!documentPresent) continue;
				const readyStateElement = documentPresent.nextElementSibling;
				if (!readyStateElement) continue;
				const readyState = readyStateElement.innerText;
				if (readyState === "Fertig") break;
			}
			while (true) {
				iteration++;
				if (iteration === 2000) {
					//console.warn("(DOKUMENTENERSTELLUNG) vierter while loop in der sendEmail (DOKUMENTENERSTELLUNG) Funktion timed out!");
					document.querySelector('terra-my-view-row').style.opacity = "1";
					document.querySelector('terra-my-view-row').style.pointerEvents = "all";
					return;
				}
				await sleep(10);
				const emailIcon = Array.from(document.querySelectorAll('mat-icon.mat-icon.notranslate'))
					.find(icon => icon.innerText.trim() === 'email');
				if (emailIcon && emailIcon.parentElement && !emailIcon.hasAttribute("disabled")) {
					document.querySelector('terra-my-view-row').style.opacity = "1";
					document.querySelector('terra-my-view-row').style.pointerEvents = "all";
					break;
				} else if (!emailIcon || !emailIcon.parentElement) {
					console.error("Email Button nicht gefunden, breche ab!");
					document.querySelector('terra-my-view-row').style.opacity = "1";
					document.querySelector('terra-my-view-row').style.pointerEvents = "all";
					return;
				}
			}
			await sleep(500);
		}
	}
	const emailIcon = Array.from(document.querySelectorAll('mat-icon.mat-icon.notranslate'))
		.find(icon => icon.innerText.trim() === 'email');

	let emailButton = null;

	if (emailIcon && emailIcon.parentElement) {
		emailButton = emailIcon.parentElement;
	} else {
		console.error("Email Button nicht gefunden, breche ab!");
		return;
	}
	emailButton.click();
	let searchTerm = null;
	while (true) {
		iteration++;
		if (iteration === 2000) {
			//console.warn("erster while loop in der sendEmail Funktion timed out!");
			return;
		}
		await sleep(10);
		const emailDialog = document.querySelector('terra-email-service-dialog');
		if (!emailDialog) continue;
		const searchBar = emailDialog.querySelector('input[class*="mat-mdc-form-field-input-control mdc-text-field__input cdk-text-field-autofill-monitored"]')
		if (!searchBar) continue;
		if (emailType === "angebot") {
			searchTerm = "(382) [EXP] Angebot";
			searchBar.value = "382";
		} else if (emailType === "bestellbestaetigung") {
			searchTerm = "(376) [EXP] Bestellbestätigung";
			searchBar.value = "376";
		} else if (emailType === "rechnungsversand") {
			searchTerm = "(438) [EXP] Rechnungsversand manuell";
			searchBar.value = "438";
		} else if (emailType === "software") {
			searchTerm = "(484) [EXP] Softwareversand";
			searchBar.value = "484";
		}
		searchBar.focus();
		searchBar.dispatchEvent(eventChange);
		const typeSelectors = document.querySelectorAll('mat-option');

		const typeSelectorID =
		Array.from(typeSelectors).find(el => el?.innerText?.trim().endsWith('ID')) || null;

		if (!typeSelectorID) {
			console.warn("Kann Suchfilter nicht auf Typ ID stellen! Breche E-Mail-Versand-Funktion ab...");
			return;
		}
		typeSelectorID.click();
		break;
	}
	while (true) {
		iteration++;
		if (iteration === 2000) {
			console.warn("dritter while loop in der sendEmail Funktion timed out!");
			return;
		}
		await sleep(10);
		const overlay = document.querySelector('div[class="cdk-global-overlay-wrapper"]')
		if (!overlay) continue;
		const targetSelection = overlay.querySelectorAll('terra-tree-node-label');
		if (!targetSelection) continue;
		const matchingElement = Array.from(targetSelection).find(node => node.innerText.includes(searchTerm));
		if (!matchingElement || !matchingElement.parentElement) continue;
		matchingElement.parentElement.click();
		await sleep(10);
		const buttons = overlay.querySelectorAll('mat-icon');
		if (!buttons) continue;
		const sendIcon = Array.from(buttons)
			.find(icon => icon.innerText.trim() === 'send');
		if (!sendIcon) continue;
		const sendButton = sendIcon.parentElement;
		if (!sendButton) continue;
		const isPlentyInactive = document.querySelector('terra-loading-spinner[hidden]');
		if (isPlentyInactive && sendButton && !sendButton.hasAttribute('disabled')) {
			break;
		}
	}
	iteration = 0;
	await sleep(200);
	if (emailType === "software") {
		while (true) {
			iteration++;
			if (iteration === 2000) {
				console.warn("software while loop in der sendEmail Funktion timed out!");
				return;
			}
			await sleep(10);
			const overlay = document.querySelector('div[class="cdk-global-overlay-wrapper"]')
			if (!overlay) continue;
			const buttonLabels = overlay.querySelectorAll('span[class=mdc-button__label]');
			if (!buttonLabels) continue;
			const vorlageLadenSpan = Array.from(buttonLabels).find(node => node.innerText.trim() === "VORLAGE LADEN");
			if (!vorlageLadenSpan) continue;
			const vorlageLadenButton = vorlageLadenSpan.parentElement
			if (!vorlageLadenButton) continue;
			vorlageLadenButton.click();
			break;
		}
		return;
	}
	while (true) {
		iteration++;
		if (iteration === 2000) {
			console.warn("vierter while loop in der sendEmail Funktion timed out!");
			return;
		}
		await sleep(10);
		const overlay = document.querySelector('div[class="cdk-global-overlay-wrapper"]')
		if (!overlay) continue;
		const buttons = overlay.querySelectorAll('mat-icon');
		if (!buttons) continue;
		const sendIcon = Array.from(buttons)
			.find(icon => icon.innerText.trim() === 'send');
		if (!sendIcon) continue;
		const sendButton = sendIcon.parentElement;
		if (!sendButton) continue;
		while (true) {
			const isPlentyInactive = document.querySelector('terra-loading-spinner[hidden]');
			if (isPlentyInactive && sendButton && !sendButton.hasAttribute('disabled')) {
				sendButton.click();
				break;
			} else if (isPlentyInactive && sendButton && sendButton.hasAttribute('disabled')) {
				console.warn('sendButton verfügbar und plenty ist inaktiv, aber sendButton ist disabled - klicke nicht, und loope weiter, bis sendButton verfübgar!');
			} else if (!sendButton) {
				console.error('sendButton nicht gefunden! Breche sendEmail ab...');
				return;
			} 
			await sleep(10);
		}
		await sleep(100);
		const abortButton = sendButton.previousElementSibling;
		if (!abortButton) continue;
		abortButton.click();
		break;
	}
}

async function changeStatus(status){
	const matLabels = document.querySelectorAll('mat-label');
	let statusLabel = null;
	let statusSelector = null;

	matLabels.forEach(label => {
	if (label.innerText.trim() === "Status") {
		statusLabel = label;
	}
	});
	if (statusLabel) {
		statusSelector = statusLabel.parentElement.parentElement.parentElement.parentElement.querySelector('mat-select');
		if (statusSelector) statusSelector.click();
		else console.error("statusSelector nicht gefunden!");
		if (document.querySelector('div[role="listbox"]')) {
			document.querySelector('div[role="listbox"]').style.display="none";
		}
	} else {
		console.error("statusLabel nicht gefunden!")
	}
	//console.log(statusLabel);
	//console.log(statusSelector);
	while (true) {
		const statusOptionsContainer = document.querySelector('div[role="listbox"]')
		//console.log("test");
		if (statusOptionsContainer) {
			const statusOptions = statusOptionsContainer.querySelectorAll('mat-option');
			if (statusOptions.length > 0) {
				const matchingOption = Array.from(statusOptions).find(option => option.innerText.trim().startsWith(`[${status}]`));
				if (matchingOption) {
					matchingOption.click();
					//console.log(matchingOption);
					break;
				} else {
					console.error("Status nicht gefunden! Breche changeStatus ab...");
					if (document.querySelector('div[role="listbox"]')) {
						document.querySelector('div[role="listbox"]').style.display="block";
					}
				}
			}
		}
		await sleep(10);
	}
	await sleep(100);
	const saveButton = document.querySelector('section.terra-page-header-actions').querySelector('button');
	if (saveButton) {
		while (true) {
			const isPlentyInactive = document.querySelector('terra-loading-spinner[hidden]');
			if (isPlentyInactive && saveButton) {
				saveButton.click();
				break;
			} else if (!saveButton) {
				console.error('saveButton nicht gefunden! Breche changeStatus ab...');
				return;
			}
			await sleep(10);
		}
	} else {
		console.error("saveButton nicht gefunden - gewünschter Status ausgewählt, doch Änderung nicht gespeichert!")
	}
}

async function changePaymentMethod(paymentMethod){
	const matLabels = document.querySelectorAll('mat-label');
	let paymentMethodLabel = null;
	let paymentMethodSelector = null;

	matLabels.forEach(label => {
	if (label.innerText.trim() === "Zahlungsart") {
		paymentMethodLabel = label;
	}
	});
	if (paymentMethodLabel) {
		paymentMethodSelector = paymentMethodLabel.parentElement.parentElement.parentElement.parentElement.querySelector('mat-select');
		if (paymentMethodSelector) paymentMethodSelector.click();
		else console.error("paymentMethodSelector nicht gefunden!");
		if (document.querySelector('div[role="listbox"]')) {
			document.querySelector('div[role="listbox"]').style.display="none";
		}
	} else {
		console.error("paymentMethodLabel nicht gefunden!")
	}
	//console.log(paymentMethodLabel);
	//console.log(paymentMethodSelector);
	while (true) {
		const paymentMethodOptionsContainer = document.querySelector('div[role="listbox"]')
		//console.log("test");
		if (paymentMethodOptionsContainer) {
			const paymentMethodOptions = paymentMethodOptionsContainer.querySelectorAll('mat-option');
			if (paymentMethodOptions.length > 0) {
				const matchingOption = Array.from(paymentMethodOptions).find(option => option.innerText.trim().startsWith(paymentMethod));
				if (matchingOption) {
					matchingOption.click();
					//console.log(matchingOption);
					break;
				} else {
					console.error("Zahlungsart nicht gefunden!");
					if (document.querySelector('div[role="listbox"]')) {
						document.querySelector('div[role="listbox"]').style.display="block";
					}
				}
			}
		}
		await sleep(10);
	}
	await sleep(100);
	const saveButton = document.querySelector('section.terra-page-header-actions').querySelector('button');
	if (saveButton) {
		while (true) {
			const isPlentyInactive = document.querySelector('terra-loading-spinner[hidden]');
			if (isPlentyInactive && saveButton) {
				saveButton.click();
				break;
			} else if (!saveButton) {
				console.error('saveButton nicht gefunden! Breche changePaymentMethod ab...');
				if (document.querySelector('div[role="listbox"]')) {
					document.querySelector('div[role="listbox"]').style.display="block";
				}
				return;
			}
			await sleep(10);
		}
	} else {
		console.error("saveButton nicht gefunden - gewünschte Zahlungsmethode ausgewählt, doch Änderung nicht gespeichert!")
		if (document.querySelector('div[role="listbox"]')) {
			document.querySelector('div[role="listbox"]').style.display="block";
		}
	}
}

let changePaymentMethodNewOrderActive = false;

async function changePaymentMethodNewOrder(paymentMethod){
	let paymentMethodLabel = null;
	let paymentMethodSelector = null;
	let paymentMethodSearchInput = null;

	const headers = document.querySelectorAll('mat-step-header');
	const selected = document.querySelector('mat-step-header[aria-selected="true"]');
	const activeTabNumber = selected ? [...headers].indexOf(selected) : -1; // -1, wenn keins ausgewählt

	const activeTabPanel = document.querySelectorAll('div[role="tabpanel"]')[activeTabNumber];

	if (activeTabNumber !== 0 && activeTabNumber !== 2) {
		return;
	}

	const matLabels = activeTabPanel.querySelectorAll('mat-label');

	const paymentSelector = activeTabPanel.querySelectorAll('div[class="col-12 d-flex"]')[2];

	matLabels.forEach(label => {
	if (label.innerText.trim() === "Zahlungsart") {
		paymentMethodLabel = label;
	}
	});

	if (changePaymentMethodNewOrderActive) {
		return;
	}

	if (paymentMethodLabel) {
		changePaymentMethodNewOrderActive = true;
		paymentMethodSearchInput = paymentMethodLabel.parentElement.parentElement.parentElement.parentElement.querySelector('input');
		paymentMethodSearchInput.value = "";
		paymentMethodSearchInput.dispatchEvent(eventChange);
		paymentMethodSearchInput.dispatchEvent(eventInput);
		if (paymentSelector.querySelector('mat-error')) {
			paymentSelector.querySelector('mat-error').style.display="none";
		}
		paymentMethodSelector = paymentMethodLabel.parentElement.parentElement.firstChild;
		if (paymentMethodSelector) {
			paymentMethodSelector.click();
		} else {
			console.error("paymentMethodSelector nicht gefunden!");
			if (paymentSelector.querySelector('mat-error')) {
				paymentSelector.querySelector('mat-error').style.display="block";
			}
		}
		if (document.querySelector('div[role="listbox"]')) {
			document.querySelector('div[role="listbox"]').style.display="none";
		}
	} else {
		changePaymentMethodNewOrderActive = false;
		console.error("paymentMethodLabel nicht gefunden!")
		return;
	}
	//console.log(paymentMethodLabel);
	//console.log(paymentMethodSelector);
	while (true) {
		await sleep(10);
		const paymentMethodOptionsContainer = document.querySelector('div[role="listbox"]')
		//console.log("test");
		if (paymentMethodOptionsContainer) {
			const paymentMethodOptions = paymentMethodOptionsContainer.querySelectorAll('mat-option');
			if (paymentMethodOptions.length > 0) {
				const matchingOption = Array.from(paymentMethodOptions).find(option => option.innerText.trim().startsWith(paymentMethod));
				if (matchingOption) {
					matchingOption.click();
					//console.log(matchingOption);
					changePaymentMethodNewOrderActive = false;
					break;
				} else {
					console.error("Zahlungsart nicht gefunden!");
					if (document.querySelector('div[role="listbox"]')) {
						document.querySelector('div[role="listbox"]').style.display="block";
					}
					if (paymentSelector.querySelector('mat-error')) {
						paymentSelector.querySelector('mat-error').style.display="block";
					}
					return;
				}
			}
		}
	}
}

async function plentyWorking() {
	while (true) {
		const isPlentyInactive = document.querySelector('terra-loading-spinner[hidden]');
		if (isPlentyInactive) {
			//console.log("plenty not active");
		} else {
			//console.log("plenty active");
		}
		await sleep(10);
	}
}

async function watchOrderUI() {
	while (true) {
	  await sleep(100);
	  const path = window.location.pathname;
  
	  // URL-Wechsel erkennen und Polling aktivieren, wenn /order-ui***/overview in der URL steht
	  if (path !== lastPath) {
		lastPath = path;
		waitingForSearchBar = /\/order-ui.*\/overview/.test(path);
	  }
  
	  if (waitingForSearchBar) {
		const itemSearchBar = document.querySelector(
		  'input[role="combobox"][placeholder="Suchen"][class*="mat-mdc-input-element"]'
		);
		if (!itemSearchBar) continue;
  
		// 1) einmal klicken & fokussieren
		itemSearchBar.click();
		itemSearchBar.focus();
  
		// 2) gesamten Text markieren
		const len = itemSearchBar.value.length;
		itemSearchBar.setSelectionRange(0, len);
  
		// 3) Event-Listener nur einmal anhängen
		if (!itemSearchBar.hasAttribute('data-listeners-attached')) {
		  itemSearchBar.setAttribute('data-listeners-attached', 'true');
  
		  const keyHandler = async function(e) {
			if (e.key === 'Enter') {
			  e.preventDefault();
			  e.stopImmediatePropagation();

			  // Alle Zahlen (ohne eckige Klammern) als Strings
				const statusCodes = [
				"1","1.1","1.2",
				"2","2.01","2.1","2.2","2.3","2.31","2.32","2.33","2.4","2.45","2.5","2.7","2.8","2.9","2.91",
				"3","3.01","3.1","3.2","3.3","3.4","3.5","3.6","3.7","3.8","3.9","3.91","3.92","3.93",
				"4","4.9","4.91",
				"5","5.1","5.11","5.12","5.2","5.3","5.31","5.32","5.4","5.5","5.51","5.6","5.9",
				"6","6.01","6.1","6.3","6.31","6.32","6.58","6.59","6.6","6.61","6.62",
				"7","7.1","7.2","7.3","7.31","7.4","7.41","7.5","7.6","7.7","7.71","7.8","7.88","7.89","7.91","7.95","7.99",
				"8","8.1","8.15","8.17","8.2","8.3","8.5","8.6","8.61","8.9",
				"9.00","9.10","9.21","9.22","9.25","9.26","9.31","9.32","9.33","9.34","9.40","9.45","9.80","9.91","9.92","9.95",
				"10","10.1","10.2","10.3",
				"11","11.1","11.3","11.4","11.5","11.6","11.7","11.8","11.9",
				"12","13","14","15.30","15.31","15.32"
				];

				// Check: steht der eingegebene Code (ohne Klammern) in der Liste?
				if (!statusCodes.includes(String(itemSearchBar.value).trim()) && e.altKey && !e.shiftKey) {
					alert("Status '" + itemSearchBar.value + "' existiert nicht.");
					return;
				}
				// else: ok, weitermachen...


			  const overlay = document.querySelector('div[class="cdk-overlay-container"]');
			  overlay.style.display="none";
  
			  // Klick auf Filter-Button
			  const filterButton = itemSearchBar.parentElement.parentElement.querySelector('button[id="filterButton"]');
			  if (e.shiftKey || e.altKey) {
				//console.log("klicke Filterbutton...");
			    filterButton.click();
			  }
  
			  // Auf Such-Button warten
			  let searchBtn = null;
			  while (!(searchBtn = document.querySelector('button[type="submit"][mat-button]'))) {
				if (!(e.shiftKey || e.altKey)) {
					//console.log("break out of searchBtnWait loop...");
					break;
				}
				//console.log("searchBtnWait...");
				await sleep(50);
			  }
  
			  // Auf Reset-Filter-Button warten
			  let resetFilterBtn = null;
			  if (searchBtn) {
				while (!(resetFilterBtn = searchBtn.previousElementSibling)) {
					//console.log("resetFilterBtnWait...");
					await sleep(50);
				}
			  }

			  // optional, oben einmal definieren
				const norm = s => (s || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

				let auftragsstatusField;
				while (!(auftragsstatusField = Array.from(document.querySelectorAll('mat-form-field'))
						.find(el => norm(el.innerText).includes('Auftragsstatus =')))) {
					if (!(e && (e.shiftKey || e.altKey))) {
						//console.log("break out of auftragsstatusField wait loop...");
						break;
					}
					//console.log("auftragsstatusField wait...");
					await sleep(50);
				}

			  
  
			  // Eingabefelder holen
			  //const auftragsID       = document.querySelector('input[placeholder="Auftrags-ID"]');
			  const kontaktID        = document.querySelector('input[placeholder="Kontakt-ID"]');
			  //const artikelDatenID   = document.querySelector('input[placeholder="Artikeldaten"]');
			  //const extAuftragsNr    = document.querySelector('input[placeholder="Externe Auftragsnummer"]');
			  const dokumentenNr     = document.querySelector('input[placeholder="Dokumentennummer"]');

			  //const kontaktDaten     = document.querySelector('input[placeholder="Kontaktdaten"]');
			  let listbox = document.querySelector('div[role="listbox"]');
			  let selectedOption = null;
			  if (listbox && !(e.shiftKey || e.altKey)) {
				selectedOption = listbox.querySelector('mat-option[class*="mat-mdc-option-active"]');
				selectedOptionName = selectedOption.innerText;
				const replayButton = (() => { const c = document.querySelector('div[class*="filter-wrapper"]'); return c ? [...c.querySelectorAll('button')].find(b => (b.innerText || '').trim().toLowerCase() === 'replay') || null : null; })();
				if (replayButton) {
					replayButton.click();
					itemSearchBar.click();
					itemSearchBar.focus();
					while (!listbox) {
						listbox = document.querySelector('div[role="listbox"]');
						//console.log("listboxWait...");
						await sleep(10);
					}
				}
				// Erwartet: listbox (Element) und selectedOptionName (String)
				selectedOption = listbox
				? Array.from(listbox.querySelectorAll('mat-option'))
					.find(opt => (opt.innerText || '').trim() === String(selectedOptionName).trim()) || null
				: null;

				if (!selectedOption) {
					console.warn('[selectedOption] Kein mat-option mit genau passendem innerText gefunden:', selectedOptionName);
				}

				//console.log(selectedOption.innerText);
			  }
			  if (e.shiftKey || e.altKey) {
			    resetFilterBtn.click();
			  }
			  

			  /*
			  // Aktionen je nach Modifier
			  if (!(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)) {
				//console.log('enter gedrückt - Auftragssuche');
				auftragsID.value = itemSearchBar.value;
				auftragsID.dispatchEvent(eventInput);
			  } else if (e.shiftKey && !e.altKey) {
				//console.log('shift + enter gedrückt - Kontakt-ID-Suche');
				kontaktID.value = itemSearchBar.value;
				kontaktID.dispatchEvent(eventInput);
			  } else if (e.ctrlKey) {
				//console.log('control + enter gedrückt - Artikeldaten-Suche');
				artikelDatenID.value = itemSearchBar.value;
				artikelDatenID.dispatchEvent(eventInput);
			  } else if (e.altKey && !e.shiftKey) {
				//console.log('option + enter gedrückt - Dokumentennummer-Suche');
				dokumentenNr.value = itemSearchBar.value;
				dokumentenNr.dispatchEvent(eventInput);
			  } else if (e.metaKey) {
				//console.log('command + enter gedrückt - Kontaktdaten-Suche');
				kontaktDaten.value = itemSearchBar.value;
				kontaktDaten.dispatchEvent(eventInput);
			  } else if (e.shiftKey && e.altKey) {
				//console.log('shift + option + enter gedrückt - Ext. Auftragsnummer-Suche');
				extAuftragsNr.value = itemSearchBar.value;
				extAuftragsNr.dispatchEvent(eventInput);
			  }
			  searchBtn.click();*/

			  // Aktionen je nach Modifier
			  if (e.shiftKey && !e.altKey) {
				//console.log('shift + enter gedrückt - Kontakt-ID-Suche');
				kontaktID.value = itemSearchBar.value;
				kontaktID.dispatchEvent(eventInput);
			  } else if (e.altKey && !e.shiftKey) {
				//console.log('option + enter gedrückt - Dokumentennummer-Suche');
				//artikelDatenID.value = itemSearchBar.value;
				//artikelDatenID.dispatchEvent(eventInput);
				// Exakter Match (inkl. Zeilenumbruch)
				if (!auftragsstatusField) {
					console.error("auftragsstatusField nicht gefunden!");
					overlay.style.display="block";
					return;
				}
				const auftragsstatusFieldTrigger = auftragsstatusField.querySelector('mat-label');
				if (!auftragsstatusFieldTrigger) {
					console.error("auftragsstatusFieldTrigger nicht gefunden!");
					overlay.style.display="block";
					return;
				}
				auftragsstatusFieldTrigger.click();
				const step1 = document.querySelector('div[class*="cdk-overlay-"]');
				if (!step1) {
					console.error("step1 element nicht gefunden! watchOrderUI()");
					overlay.style.display="block";
					return;
				}
				const step2 = step1.querySelector('mat-form-field[filter-search-input]');
				if (!step2) {
					console.error("step2 element nicht gefunden! watchOrderUI()");
					overlay.style.display="block";
					return;
				}
				const statusInput = step2.querySelector('input');
				if (!statusInput) {
					console.error("statusInput element nicht gefunden! watchOrderUI()");
					overlay.style.display="block";
					return;
				}
				statusInput.value = itemSearchBar.value;
				statusInput.dispatchEvent(eventInput);
				const targetOption = Array.from(step1.querySelectorAll('mat-option'))
				  .find(opt => (opt.innerText || '').includes(`[${itemSearchBar.value}]`));
				if (!targetOption) {
					console.error("targetOption element nicht gefunden! watchOrderUI()");
					overlay.style.display="block";
					return;
				}
				targetOption.click();
			  } else if (e.shiftKey && e.altKey) {
				//console.log('shift + option + enter gedrückt - Ext. Auftragsnummer-Suche');
				dokumentenNr.value = itemSearchBar.value;
				dokumentenNr.dispatchEvent(eventInput);
			  }
			  if (!(e.shiftKey || e.altKey) && selectedOption) {
				//console.log(selectedOption.innerText);
			    selectedOption.click();
			  } else {
				searchBtn.click();
			  }

			  itemSearchBar.value = "";
			  itemSearchBar.dispatchEvent(eventInput);
			  overlay.style.display="block";
			}
		  };
  
		  // Capture-Phase und passive: false, damit preventDefault greift
		  itemSearchBar.addEventListener('keydown', keyHandler, { capture: true, passive: false });
		  itemSearchBar.addEventListener('keypress', keyHandler, { capture: true, passive: false });
		}
  
		// Polling beenden, damit es nur einmal pro URL-Wechsel ausgeführt wird
		waitingForSearchBar = false;
	  }
	}
  }

  // Gegeben im Script:
// function sleep(time) { return new Promise(resolve => setTimeout(resolve, time)); }

async function openBasketOnNewOrderUi() {
  'use strict';

  const TARGET_PATH_FRAGMENT = '/plenty/terra/order/order-ui/new';
  const TARGET_TEXT_RAW = 'chevron_right\nWarenkorb';

  const normalize = s => (s || '').replace(/\s+/g, ' ').trim();
  const TARGET_TEXT_NORM = normalize(TARGET_TEXT_RAW);

  // entspricht dem gewünschten "boolean"
  let isOnTargetUrl = false;

  // Sucht das mat-panel-title mit exakt passendem (normalisiertem) innerText
  const findTargetTitleEl = () => {
    const nodes = document.querySelectorAll('mat-panel-title');
    for (const el of nodes) {
      if (normalize(el.innerText) === TARGET_TEXT_NORM) return el;
    }
    return null;
  };

  while (true) {
    const hrefAtTickStart = location.href;
    const matchesTarget = hrefAtTickStart.includes(TARGET_PATH_FRAGMENT);

    if (!matchesTarget) {
      // URL passt nicht -> boolean auf false
      isOnTargetUrl = false;
      await sleep(500);
      continue;
    }

    // URL passt -> boolean auf true; nur bei Wechsel von false -> true Aktion starten
    if (!isOnTargetUrl) {
      // --- 1) Suche nach dem gewünschten mat-panel-title (alle 100ms) ---
      let titleEl = null;
      while (true) {
        // Falls URL sich während der Suche ändert: Abbrechen und außen neu starten
        if (location.href !== hrefAtTickStart) {
          // Zurück in den 500ms-Takt (Neustart)
          isOnTargetUrl = false;
          break;
        }

        titleEl = findTargetTitleEl();
        if (titleEl) break;

        await sleep(100); // schneller Poll, solange Element nicht gefunden wurde
      }

      // Wenn wir wegen URL-Änderung abgebrochen haben, sofort weiter zum nächsten Tick
      if (!titleEl) {
        await sleep(500);
        continue;
      }

      // --- 2) Innerhalb des gefundenen Titles auf den Button warten (alle 100ms) ---
      while (true) {
        if (location.href !== hrefAtTickStart) {
          // URL änderte sich -> Abbruch/Neustart
          isOnTargetUrl = false;
          break;
        }

        const btn = titleEl.querySelector('button');
        if (btn instanceof HTMLElement) {
          try {
            btn.click();
          } catch (_) {
            // optionales Logging möglich
          }
          isOnTargetUrl = true; // Aktion erfolgte auf „steigender Flanke“
          break;
        }

        await sleep(100); // schneller Poll, bis der Button da ist
      }
    }

    // Grundtakt: 500ms
    await sleep(500);
  }
}







async function showAllOrdersOfCustomer(cid) {
	while (true) {
		const itemSearchBar = document.querySelector(
		  'input[role="combobox"][placeholder="Suchen"][class*="mat-mdc-input-element"]'
		);
		if (!itemSearchBar) break;
  
		// 1) einmal klicken & fokussieren
		itemSearchBar.click();
		itemSearchBar.focus();
  
		// 2) gesamten Text markieren
		const len = itemSearchBar.value.length;
		itemSearchBar.setSelectionRange(0, len);

		const overlay = document.querySelector('div[class="cdk-overlay-container"]');
		overlay.style.display="none";

		// Klick auf Filter-Button
		const filterButton = itemSearchBar.parentElement.parentElement.querySelector('button[id="filterButton"]');
		filterButton.click();

		// Auf Such-Button warten
		let searchBtn = null;
		while (!(searchBtn = document.querySelector('button[type="submit"][mat-button]')))
			await sleep(50);

		// Auf Reset-Filter-Button warten
		let resetFilterBtn = null;
		while (!(resetFilterBtn = searchBtn.previousElementSibling))
			await sleep(50);

		// Eingabefelder holen
		const kontaktID        = document.querySelector('input[placeholder="Kontakt-ID"]');

		resetFilterBtn.click();

		//console.log('shift + enter gedrückt - Kontakt-ID-Suche');
		kontaktID.value = cid;
		kontaktID.dispatchEvent(eventInput);
		
		searchBtn.click();
		itemSearchBar.value = "";
		itemSearchBar.dispatchEvent(eventInput);
		overlay.style.display="block";
		await sleep(100);
		break;
	}
}

// === Debug-Toggle (ausblenden von Debug-Logs) ===
window.__ORDERS_DEBUG = false; // bei Bedarf auf true setzen, um Logs zu sehen
function ORDERS_LOG(...args) {
  if (window.__ORDERS_DEBUG) console.debug('[OrdersButtons]', ...args);
}

function addAllOrdersButtons() {
  // Re-Entrancy verhindern (falls häufig getriggert)
  if (window.__addAllOrdersButtonsBusy) return;
  window.__addAllOrdersButtonsBusy = true;

  try {
	const url = window.location.href;
	if (!/\/order-ui(?:_\d+)?\/overview/.test(url)) return;


    // ===== TEIL 1: "Kontakt-ID" Tiles -> Button "Alle Aufträge" =====
    const tiles = Array.from(document.querySelectorAll('mat-grid-tile'));

    tiles.forEach(tile => {
      const existingDup = tile.querySelector('a[data-dup="auftraege"]');
      const existingSep = tile.querySelector('span[data-sep="auftraege"]');

      // Nur Tiles beachten, deren Text mit "Kontakt-ID" beginnt
      const startsWithKontaktId = ((tile.innerText || '').trim().startsWith('Kontakt-ID'));
      if (!startsWithKontaktId) {
        if (existingDup) existingDup.remove();
        if (existingSep) existingSep.remove();
        return;
      }

      // Gültigen Original-Link suchen (nicht unser Duplikat, enthält Ziffern)
      const originalLink = Array
        .from(tile.querySelectorAll('a'))
        .find(a => !a.hasAttribute('data-dup') && /\d/.test((a.textContent || '').trim()));

      if (!originalLink) {
        if (existingDup) existingDup.remove();
        if (existingSep) existingSep.remove();
        return;
      }

      // Original-Link NICHT verändern
      const originalText = (originalLink.textContent || '').trim();
      const cidMatch = originalText.match(/\d+/);
      const cid = cidMatch ? cidMatch[0] : '';
      if (!cid) {
        if (existingDup) existingDup.remove();
        if (existingSep) existingSep.remove();
        return;
      }

      // Separator (    |   ) direkt hinter dem Original-Link sicherstellen
      let sep = existingSep;
      if (!sep) {
        sep = document.createElement('span');
        sep.setAttribute('data-sep', 'auftraege');
        sep.textContent = '    |   ';   // 4 Leerzeichen, Pipe, 3 Leerzeichen
        sep.style.whiteSpace = 'pre';
      }
      if (sep.previousSibling !== originalLink) {
        originalLink.insertAdjacentElement('afterend', sep);
      }

      // Duplikat-Button "Alle Aufträge" direkt hinter dem Separator sicherstellen
      let dup = existingDup;
      const needRecreate =
        !dup ||
        dup.getAttribute('data-cid') !== cid ||
        dup.previousSibling !== sep ||
        dup.textContent !== 'Alle Aufträge';

      if (needRecreate) {
        if (dup) dup.remove();

        dup = document.createElement('a');
        dup.textContent = 'Alle Aufträge';
        dup.setAttribute('data-dup', 'auftraege');
        dup.setAttribute('data-cid', cid);
        dup.setAttribute('href', 'javascript:void(0)');
        dup.setAttribute('role', 'button');
        dup.setAttribute('tabindex', '0');

        if (originalLink.className) dup.className = originalLink.className;

        dup.addEventListener('click', async (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          try {
            await showAllOrdersOfCustomer(cid);
          } catch (e) {
            console.error('showAllOrdersOfCustomer fehlgeschlagen:', e);
          }
        });

        dup.addEventListener('keydown', async (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            ev.stopPropagation();
            try {
              await showAllOrdersOfCustomer(cid);
            } catch (e) {
              console.error('showAllOrdersOfCustomer fehlgeschlagen:', e);
            }
          }
        });

        sep.insertAdjacentElement('afterend', dup);
      }
    });

    // ===== TEIL 2: a.order-type-text -> Button "Referenzierte Bestellungen" =====
    // Gruppiere relevante Anker pro Parent (meist das Tile), damit pro Parent GENAU EIN Button erzeugt wird.
    const allOrderTypeAnchors = Array.from(document.querySelectorAll('a.order-type-text'))
      .filter(a => !a.hasAttribute('data-dup')); // nur echte Originale

    const groups = new Map(); // parentElement -> [anchors]
    for (const a of allOrderTypeAnchors) {
      const parent = a.closest('mat-grid-tile') || a.parentElement || document;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(a);
    }

    groups.forEach((anchors, parent) => {
      // Nur einmal pro Parent erzeugen:
      //  - Ziel (zum "Klicken"): das ERSTE relevante <a>
      //  - Position: Button rechts von dem LETZTEN relevanten <a>
      if (!anchors.length) return;

      const firstA = anchors[0];
      const lastA  = anchors[anchors.length - 1];

      // Bestehende Duplikate innerhalb dieses Parents prüfen/aufräumen
      const existingDupKey = 'referenzierte-bestellungen';
      const existingDupls = Array.from(parent.querySelectorAll(`a[data-dup-key="${existingDupKey}"]`));
      const existingSep = parent.querySelector(`span[data-sep-key="sep-${existingDupKey}"]`);

      // CID ermitteln: aus dem nächstliegenden Kontakt-Link im gleichen Tile, sonst aus erstem Anchor-Text
      let cid = '';
      const kontaktLink = parent.querySelector('a:not([data-dup])');
      if (kontaktLink && /\d/.test((kontaktLink.textContent || '').trim())) {
        const m = (kontaktLink.textContent || '').trim().match(/\d+/);
        if (m) cid = m[0];
      } else {
        const m2 = (firstA.textContent || '').trim().match(/\d+/);
        if (m2) cid = m2[0];
      }

      // Separator nach dem LETZTEN relevanten <a> sicherstellen
      const SEP_TEXT = '    |   ';
      let sep2 = existingSep;
      if (!sep2) {
        sep2 = document.createElement('span');
        sep2.setAttribute('data-sep-key', `sep-${existingDupKey}`);
        sep2.textContent = SEP_TEXT;
        sep2.style.whiteSpace = 'pre';
      } else {
        if (sep2.textContent !== SEP_TEXT) {
          sep2.textContent = SEP_TEXT;
          sep2.style.whiteSpace = 'pre';
        }
      }
      if (sep2.previousSibling !== lastA) {
        lastA.insertAdjacentElement('afterend', sep2);
      }

      // Genau EIN Duplikat-Button direkt hinter sep2 sicherstellen
      let dup2 = sep2.nextSibling && sep2.nextSibling.nodeType === 1 && sep2.nextSibling.matches(`a[data-dup-key="${existingDupKey}"]`)
        ? sep2.nextSibling
        : null;

      // Alle weiteren (falsch platzierten) Duplikate in diesem Parent entfernen
      existingDupls.forEach(d => { if (d !== dup2) d.remove(); });

      const needRecreate2 =
        !dup2 ||
        dup2.getAttribute('data-cid') !== cid ||
        dup2.textContent !== 'Referenzierte Bestellungen';

      if (needRecreate2) {
        if (dup2) dup2.remove();

        dup2 = document.createElement('a');
        dup2.textContent = 'Referenzierte Bestellungen';
        dup2.setAttribute('data-dup', 'custom-action');
        dup2.setAttribute('data-dup-key', existingDupKey);
        dup2.setAttribute('data-cid', cid);
        dup2.setAttribute('href', 'javascript:void(0)');
        dup2.setAttribute('role', 'button');
        dup2.setAttribute('tabindex', '0');

        // WICHTIG für openReferencedOrders(ev): wir hängen den Button HINTER das letzte <a>,
        // aber beim Klick soll das ERSTE relevante <a> angesteuert werden.
        // Deshalb geben wir per Dataset die "Zielstrategie" mit.
        dup2.dataset.targetAnchor = 'first'; // (Hinweis für die Handler-Logik)

        dup2.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          try {
            // openReferencedOrders nutzt ev.currentTarget, um das korrekte Parent und Ziel zu finden
            openReferencedOrders(ev);
          } catch (e) {
            console.error('[referenzierte-bestellungen] fehlgeschlagen:', e);
          }
        });

        dup2.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            ev.stopPropagation();
            try {
              openReferencedOrders(ev);
            } catch (e) {
              console.error('[referenzierte-bestellungen] fehlgeschlagen:', e);
            }
          }
        });

        sep2.insertAdjacentElement('afterend', dup2);
      }
    });

  } finally {
    window.__addAllOrdersButtonsBusy = false;
  }
}





// === Debounce-Helfer ===
function debounce(fn, wait = 250) { // etwas höher, dämpft Event-Flut & Logs
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

// === Observer-Bootstrap (mit Logging-Toggle & Body-Fallback) ===
(function OrdersButtonsObserverBootstrap(){
  const URL_PATTERN = /\/order-ui(?:_\d+)?\/overview/;
  const CONTAINER_SELECTOR = 'terra-table-inner-container';
  const debouncedRun = debounce(() => {
    ORDERS_LOG('debouncedRun -> addAllOrdersButtons');
    try { addAllOrdersButtons(); } catch (e) { console.error(e); }
  }, 250);

  let observer = null;
  let bodyObserver = null;
  let lastUrl = location.href;

  function startObserverIfReady(retry = 20) {
	if (!URL_PATTERN.test(location.href)) {
	stopObserver();
	return;
	}

    // Den richtigen Container suchen (erstes Element, das tatsächlich Tiles enthält)
    let container = Array.from(document.querySelectorAll(CONTAINER_SELECTOR))
      .find(el => el.querySelector('mat-grid-tile')) || document.querySelector(CONTAINER_SELECTOR);

    if (!container) {
      ORDERS_LOG('Container noch nicht da, retry...', retry);
      stopObserver();
      if (retry > 0) setTimeout(() => startObserverIfReady(retry - 1), 250);
      return;
    }

    if (!observer) {
      // 1) Sofort ausführen
      ORDERS_LOG('Initial addAllOrdersButtons()');
      try { addAllOrdersButtons(); } catch (e) { console.error(e); }

      // 2) Kleiner Delay-Run (nach erstem Render)
      setTimeout(() => {
        ORDERS_LOG('Delayed addAllOrdersButtons()');
        try { addAllOrdersButtons(); } catch (e) { console.error(e); }
      }, 250);

      observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
            ORDERS_LOG('container mutation -> childList');
            debouncedRun();
            break;
          }
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true
      });

      ORDERS_LOG('Container-Observer gestartet auf:', container);
    }

    // Fallback: Body beobachten, aber nur reagieren, wenn mat-grid-tile involviert
    if (!bodyObserver) {
      bodyObserver = new MutationObserver((mutations) => {
        const relevant = mutations.some(m =>
          (m.addedNodes && [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('mat-grid-tile') || n.querySelector?.('mat-grid-tile')))) ||
          (m.removedNodes && [...m.removedNodes].some(n => n.nodeType === 1 && n.matches?.('mat-grid-tile'))) ||
          (m.target && m.target.closest && m.target.closest('mat-grid-tile'))
        );
        if (relevant) {
          ORDERS_LOG('body fallback mutation -> tiles detected');
          debouncedRun();
        }
      });
      bodyObserver.observe(document.body, { childList: true, subtree: true });
      ORDERS_LOG('Body-Fallback-Observer gestartet.');
    }
  }

  function stopObserver() {
    if (observer) {
      try { observer.disconnect(); } catch {}
      observer = null;
      ORDERS_LOG('Container-Observer gestoppt');
    }
    if (bodyObserver) {
      try { bodyObserver.disconnect(); } catch {}
      bodyObserver = null;
      ORDERS_LOG('Body-Fallback-Observer gestoppt');
    }
  }

  // URL-Wechsel (SPA)
  window.addEventListener('popstate', () => setTimeout(startObserverIfReady, 50));
  window.addEventListener('hashchange', () => setTimeout(startObserverIfReady, 50));

  // Fallback: URL-Poll, falls SPA keine Events feuert
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      ORDERS_LOG('URL change detected -> re-init observers');
      stopObserver();
      startObserverIfReady();
    }
  }, 500);

  // Initial
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => startObserverIfReady());
  } else {
    startObserverIfReady();
  }

  // Debug-APIs
  window.__OrdersButtonsObserver = {
    start: () => startObserverIfReady(),
    stop: () => stopObserver(),
    forceRun: () => { ORDERS_LOG('forceRun()'); try { addAllOrdersButtons(); } catch (e) { console.error(e); } }
  };
})();

/*
async function openReferencedOrders(ev) {
  const btn = ev?.currentTarget || ev?.target;
  if (!btn || !(btn instanceof Element)) return;

  // Ziel: IMMER das ERSTE relevante a im selben Parent (Tile) klicken
  const parent = btn.closest('mat-grid-tile') || btn.parentElement || document;
  const anchors = Array.from(parent.querySelectorAll('a.order-type-text'))
    .filter(a => !a.hasAttribute('data-dup')); // nur Originale

  // Erstes relevantes <a>, Fallback: vorheriges <a> (wie früher)
  let target = anchors[0] || null;
  if (!target) {
    let node = btn.previousSibling;
    while (node && !(node.nodeType === 1 && node.matches('a:not([data-dup])'))) {
      node = node.previousSibling;
    }
    if (node && node instanceof HTMLElement) target = node;
  }

  if (!target) {
    console.warn('[openReferencedOrders] Kein Ziel-<a> gefunden.');
    return;
  }

  // CSP-sicher klicken: javascript:-Href temporär neutralisieren
  const origHref = target.getAttribute('href') || '';
  const isJsHref = origHref.trim().toLowerCase().startsWith('javascript:');

  try {
    if (isJsHref) target.removeAttribute('href');

    const opts = { bubbles: true, cancelable: true, view: window };
    target.dispatchEvent(new PointerEvent('pointerdown', opts));
    target.dispatchEvent(new MouseEvent('mousedown', opts));
    target.dispatchEvent(new MouseEvent('mouseup', opts));
    target.dispatchEvent(new MouseEvent('click', opts));
  } finally {
    if (isJsHref) target.setAttribute('href', origHref);
  }

  // Danach auf das erste "account_tree"-Icon warten und dessen Parent klicken
  while (true) {
    await sleep(100);

    const icon = Array.from(document.querySelectorAll('mat-icon'))
      .find(el => (el.textContent || el.innerText || '').trim() === 'account_tree');

    if (!icon) continue;

    const iconParent = icon.parentElement;
    if (iconParent && iconParent instanceof HTMLElement) {
      const opts = { bubbles: true, cancelable: true, view: window };
      iconParent.dispatchEvent(new PointerEvent('pointerdown', opts));
      iconParent.dispatchEvent(new MouseEvent('mousedown', opts));
      iconParent.dispatchEvent(new MouseEvent('mouseup', opts));
      iconParent.dispatchEvent(new MouseEvent('click', opts));
    } else {
      console.warn('[openReferencedOrders] mat-icon gefunden, aber kein klickbares parentElement.');
    }
    break;
  }
}
*/

async function openReferencedOrders(ev) {
  const btn = ev?.currentTarget || ev?.target;
  if (!btn || !(btn instanceof Element)) return;

  // Ziel: IMMER das ERSTE relevante a im selben Parent (Tile) klicken
  const parent = btn.closest('mat-grid-tile') || btn.parentElement || document;
  const anchors = Array.from(parent.querySelectorAll('a.order-type-text'))
    .filter(a => !a.hasAttribute('data-dup')); // nur Originale

  // Erstes relevantes <a>, Fallback: vorheriges <a>
  let target = anchors[0] || null;
  if (!target) {
    let node = btn.previousSibling;
    while (node && !(node.nodeType === 1 && node.matches('a:not([data-dup])'))) {
      node = node.previousSibling;
    }
    if (node && node instanceof HTMLElement) target = node;
  }

  if (!target) {
    console.warn('[openReferencedOrders] Kein Ziel-<a> gefunden.');
    return;
  }

  // CSP-sicher klicken: javascript:-Href temporär neutralisieren
  const origHref = target.getAttribute('href') || '';
  const isJsHref = origHref.trim().toLowerCase().startsWith('javascript:');

  try {
    if (isJsHref) target.removeAttribute('href');

    const opts = { bubbles: true, cancelable: true, view: window };
    target.dispatchEvent(new PointerEvent('pointerdown', opts));
    target.dispatchEvent(new MouseEvent('mousedown', opts));
    target.dispatchEvent(new MouseEvent('mouseup', opts));
    target.dispatchEvent(new MouseEvent('click', opts));
  } finally {
    if (isJsHref) target.setAttribute('href', origHref);
  }

  // Danach auf das erste "account_tree"-Icon warten
  let iconParent = null;
  while (true) {
    await sleep(100);

    const icon = Array.from(document.querySelectorAll('mat-icon'))
      .find(el => (el.textContent || el.innerText || '').trim() === 'account_tree');

    if (!icon) continue;

    iconParent = icon.parentElement instanceof HTMLElement ? icon.parentElement : null;
    if (iconParent) break;
  }

  // Vor dem Klick: genau dieses "active"-Element ermitteln und BEOBACHTEN (kein Styling/Marker setzen)
  const watched = document.querySelector('li[class*="active"]');

  // Klick auf iconParent (CSP-sicher)
  {
    const opts = { bubbles: true, cancelable: true, view: window };
    iconParent.dispatchEvent(new PointerEvent('pointerdown', opts));
    iconParent.dispatchEvent(new MouseEvent('mousedown', opts));
    iconParent.dispatchEvent(new MouseEvent('mouseup', opts));
    iconParent.dispatchEvent(new MouseEvent('click', opts));
  }

  // Wenn es nichts zu beobachten gibt, sind wir fertig
  if (!(watched instanceof HTMLElement)) return;

  const hasActive = () =>
    watched.classList
      ? watched.classList.contains('active')
      : /\bactive\b/.test(watched.className || '');

  // PHASE A: Beobachten, bis das beobachtete Element verschwindet ODER die active-Klasse verliert
  while (true) {
    await sleep(100);
    if (!document.contains(watched)) {
      // Element verschwunden -> Ende
      return;
    }
    if (!hasActive()) {
      // active verloren -> weiter zu PHASE B
      break;
    }
  }

  // PHASE B: Beobachten GENAU DIESES Elements,
  // bis es entweder verschwindet ODER die active-Klasse wieder bekommt
  while (true) {
    await sleep(100);
    if (!document.contains(watched)) {
		console.warn("openReferencedOrders: Auftragsreiter, auf den gewartet wird, verschwunden!");
      // Element verschwunden -> Ende
      return;
    }
    if (hasActive()) {
		// terra-tree-node-label "Übersicht" finden und dessen Parent klicken (CSP-sicher)
		const label = Array.from(document.querySelectorAll('terra-tree-node-label'))
			.find(el => (el.textContent || el.innerText || '').trim() === 'Übersicht');

		const parent = label?.parentElement;
		if (parent instanceof HTMLElement) {
			const origHref = parent.getAttribute?.('href') || '';
			const isJsHref = typeof origHref === 'string' && origHref.trim().toLowerCase().startsWith('javascript:');

			try {
			if (isJsHref) parent.removeAttribute('href');
			const opts = { bubbles: true, cancelable: true, view: window };
			parent.dispatchEvent(new PointerEvent('pointerdown', opts));
			parent.dispatchEvent(new MouseEvent('mousedown', opts));
			parent.dispatchEvent(new MouseEvent('mouseup', opts));
			parent.dispatchEvent(new MouseEvent('click', opts));
			} finally {
			if (isJsHref) parent.setAttribute('href', origHref);
			}
		} else {
			console.warn('[openReferencedOrders] Kein terra-tree-node-label "Übersicht" (Parent) gefunden.');
		}

		return;
		}

  }
}









function searchBarEnterEnhancementForSearchFilterReset() {
  const root = document.querySelector('terra-order-ui-variations-search-table');
  const field = root?.querySelector('mat-form-field[filter-search-input]');
  const input = field?.querySelector('input[placeholder="Suchen"]');

  if (!root || !field || !input) {
    //console.warn("[searchBarEnterEnhancementForSearchFilterReset] Ziel-Element(e) nicht gefunden.");
    return;
  }

  // doppelte Listener vermeiden
  if (input.dataset.enterEnhancementAttached === "1") return;
  input.dataset.enterEnhancementAttached = "1";

  const clickButtonByText = (scopeEl, text) => {
    if (!scopeEl) return null;
    const btns = scopeEl.querySelectorAll('button');
    for (const b of btns) {
      const t = (b.innerText || "").trim().toLowerCase();
      if (t === text) {
        b.click();
        return b;
      }
    }
    return null;
  };

  input.addEventListener('keydown', (ev) => {
    // nur reagieren, wenn Enter gedrückt wird und das Input aktiv ist
    if (ev.key === 'Enter' || ev.keyCode === 13) {
      // alles unterbinden, damit nichts anderes feuert
      ev.preventDefault();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();

      // 1) Replay-Button IM ROOT drücken (falls vorhanden)
      clickButtonByText(root, 'replay');

      // 2) Search-Button IM FILTER-FELD drücken (falls vorhanden)
      const clicked = clickButtonByText(field, 'search');

      if (!clicked) {
        console.warn("[searchBarEnterEnhancementForSearchFilterReset] 'search'-Button im Filter-Feld nicht gefunden.");
      }
    }
  }, true); // Capture-Phase hilft, andere Handler frühzeitig zu stoppen
}




function searchBarEnterEnhancementForSearchFilterReset() {
  // alternativer Root zulassen: entweder variations-search-table ODER contact-table
  const root =
    document.querySelector('terra-order-ui-variations-search-table') ||
    document.querySelector('terra-contact-table');

  if (!root) {
    //console.warn("[searchBarEnterEnhancementForSearchFilterReset] Kein Root gefunden (weder 'terra-order-ui-variations-search-table' noch 'terra-contact-table').");
    return;
  }

  const field = root.querySelector('mat-form-field[filter-search-input]');
  const input = field?.querySelector('input[placeholder="Suchen"]');

  if (!field || !input) {
    //console.warn("[searchBarEnterEnhancementForSearchFilterReset] Filterfeld oder Input nicht gefunden.");
    return;
  }

  // doppelte Listener vermeiden
  if (input.dataset.enterEnhancementAttached === "1") return;
  input.dataset.enterEnhancementAttached = "1";

  const clickButtonByText = (scopeEl, text) => {
    if (!scopeEl) return null;
    const btns = scopeEl.querySelectorAll('button');
    for (const b of btns) {
      const t = (b.innerText || "").trim().toLowerCase();
      if (t === text) {
        b.click();
        return b;
      }
    }
    return null;
  };

  input.addEventListener('keydown', (ev) => {
    // nur reagieren, wenn Enter gedrückt wird und das Input aktiv ist
    if (ev.key === 'Enter' || ev.keyCode === 13) {
      // alles unterbinden, damit nichts anderes feuert
      ev.preventDefault();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();

      // neue Logik: erst prüfen, ob beide Selektoren existieren
      const listbox = document.querySelector('div[role="listbox"]');
      const selectedOption = listbox?.querySelector('mat-option[class*="mat-mdc-option-active"]') || null;

      if (!listbox || !selectedOption) {
        // wenn nicht vorhanden, auch KEIN replay drücken
        console.warn("[searchBarEnterEnhancementForSearchFilterReset] Listbox und/oder erste mat-option nicht gefunden – keine Aktion ausgeführt.");
        return;
      }

      // beide vorhanden -> erst replay im ROOT drücken (falls vorhanden) ...
      clickButtonByText(root, 'replay');

      // ... dann die erste mat-option klicken
      selectedOption.click();
    }
  }, true); // Capture-Phase hilft, andere Handler frühzeitig zu stoppen
}










function fixMyViewColumns() {
  const rows = document.querySelectorAll(
    'terra-my-view-container div.container-fluid terra-my-view-row > div.row'
  );

  rows.forEach((row) => {
    // Nur echte Grid-Spalten mit col-… Klassen nehmen
    const cols = Array.from(row.children).filter((el) =>
      el.matches('[class*="col-"]')
    );
    if (!cols.length) return;

    const width = (100 / cols.length) + '%';

    // Row selbst auf Flex setzen, kein Wrap
    row.style.display = 'flex';
    row.style.flexWrap = 'nowrap';

    cols.forEach((col) => {
      col.style.flex = `0 0 ${width}`; // Basisbreite = 100% / n
      col.style.maxWidth = width;      // Bootstrap max-width aushebeln
      col.style.minWidth = '0';        // Inhalt darf schrumpfen
    });
  });
}














const DEFAULT_USER_NAME = "UNBEKANNT";
let presenceUserName = null; // wird aus dem Header gelesen
let lastPresenceLayoutKey = null;

function getUserNameFromPage() {
  // Dein gefundenes Element:
  const el = document.querySelector(
    'a[terranewrelicevent="NAV_BAR:RIGHT_SECTION:ACCOUNTS"]'
  );

  if (!el) return null;

  // innerHTML ist bei dir schon der Name, aber textContent ist robuster
  const raw =
    (el.textContent || el.innerText || el.innerHTML || "").trim();

  return raw || null;
}

// URL-Pattern:
// "order-ui" gefolgt von optional "_" + Zahl,
// dann "/" + sechsstellige Zahl => die 6-stellige Zahl ist die orderId
function getOrderIdFromLocation() {
  const path = window.location.pathname; // z.B. /terra/order-ui_123/654321
  const match = path.match(/order-ui(?:_\d+)?\/(\d{6})/);
  if (match) {
    return match[1]; // die 6-stellige Order-ID
  }
  return null;
}

function ensurePresenceContainer() {
  let container = document.querySelector("#wawi-presence-container");
  if (container) return container;

  const headerSection = document.querySelector('section[class="terra-page-header-actions"]');
  if (!headerSection) return null;

  const host = headerSection.querySelector("terra-order-ui-toolbar-elements");
  if (!host) return null;

  container = document.createElement("div");
  container.id = "wawi-presence-container";
  container.style.display = "inline-flex";
  container.style.alignItems = "center";
  container.style.marginLeft = "4px";
  container.style.marginTop = "8px";
  container.style.position = "absolute";
  // keine eigenen Farben hier – die kommen auf die einzelnen Kacheln

  host.appendChild(container);
  return container;
}

function createPresenceTile(label, isSelf) {
  const tile = document.createElement("div");
  tile.className = "wawi-presence-tile";
  tile.style.display = "inline-flex";
  tile.style.alignItems = "center";
  tile.style.marginLeft = "8px";
  tile.style.marginBottom = "0px";
  tile.style.padding = "3px 12px 1px 12px";
  tile.style.fontSize = "13px";
  tile.style.fontWeight = "500";
  tile.style.fontFamily = "system-ui, sans-serif";
  tile.style.color = "#ffffff";
  tile.style.borderRadius = "20px";

  if (isSelf) {
    // "Ich"-Kachel
    tile.textContent = "Ich";
    tile.style.background = "rgba(31, 31, 31, 1)";
  } else {
    // andere User
    tile.textContent = label;
    tile.style.background = "rgba(79, 79, 79, 1)";
  }

  if (label.includes("Altermann")) {
	tile.style.background = "rgba(161, 100, 0, 1)";
  } else if (label.includes("Koop")) {
	tile.style.background = "rgba(0, 100, 0, 1)";
  } else if (label.includes("Schwarz")) {
	tile.style.background = "rgba(111, 119, 0, 1)";
  } else if (label.includes("Herudek")) {
	tile.style.background = "rgba(95, 0, 95, 1)";
  } else if (label.includes("Burkard")) {
	tile.style.background = "rgba(0, 37,105, 1)";
  } else if (label.includes("Lotter")) {
	tile.style.background = "rgba(120, 0, 0, 1)";
  }

  return tile;
}

let presenceIntervalId = null;
let lastOrderId = null;

function updatePresenceOnce() {
  const currentOrderId = getOrderIdFromLocation();
  const container = document.querySelector("#wawi-presence-container");

  // Wenn Username noch nicht geladen wurde, warten wir
  if (!presenceUserName) {
    return;
  }

  // 1) Kein Auftrag in der URL
  if (!currentOrderId) {
    // Wenn wir vorher in einem Auftrag waren -> CLEAR schicken
    if (lastOrderId) {
      chrome.runtime.sendMessage(
        { type: "presenceClear", orderId: lastOrderId },
        () => {}
      );
      console.log("[Presence] Auftrag verlassen:", lastOrderId);
      lastOrderId = null;
    }
    // Container entfernen
    if (container) {
      container.remove();
    }
    lastPresenceLayoutKey = null;
    return;
  }

  // 2) Es gibt eine Order-ID -> Container sicherstellen
  let presenceContainer = container;
  if (!presenceContainer) {
    presenceContainer = ensurePresenceContainer();
    if (!presenceContainer) {
      // Host-Container ist noch nicht im DOM, wir warten bis zum nächsten Tick
      return;
    }
  }

  // 3) Order-Wechsel: alten Auftrag auf dem Server löschen
  if (lastOrderId && currentOrderId !== lastOrderId) {
    chrome.runtime.sendMessage(
      { type: "presenceClear", orderId: lastOrderId },
      () => {}
    );
    console.log("[Presence] Auftrag gewechselt:", lastOrderId, "→", currentOrderId);
  }
  lastOrderId = currentOrderId;

  const userName = presenceUserName || DEFAULT_USER_NAME;

  // 4) Presence-Update an Background schicken
  chrome.runtime.sendMessage(
    {
      type: "presenceUpdate",
      orderId: currentOrderId,
      userName
    },
    (response) => {
      if (!response || !response.ok) {
        console.warn(
          "[Presence] Fehler bei Presence-Update:",
          response && response.error
        );
        // Bei Nichtfunktionalität: keine Kacheln anzeigen
        if (presenceContainer) {
          presenceContainer.innerHTML = "";
        }
        lastPresenceLayoutKey = null;
        return;
      }

      const clients = Array.isArray(response.clients) ? response.clients : [];
      const selfClientId = response.selfClientId || null;

      const activeClientCount =
        typeof response.activeClientCount === "number"
          ? response.activeClientCount
          : clients.length;

      // Keine aktiven Clients -> Container leeren
      if (activeClientCount === 0 || clients.length === 0) {
        presenceContainer.innerHTML = "";
        lastPresenceLayoutKey = null;
        return;
      }

      // Clients in "ich" und "andere" aufteilen
      const others = [];
      let hasSelf = false;

      for (const c of clients) {
        if (selfClientId && c.clientId === selfClientId) {
          hasSelf = true;
        } else {
          others.push(c);
        }
      }

      // Layout-Key anhand der clientIds bauen (Reihenfolge: others, dann self)
      const otherIds = others.map((c) => c.clientId).join(",");
      const selfIdPart = hasSelf && selfClientId ? selfClientId : "";
      const layoutKey = otherIds + "|" + selfIdPart;

      // Wenn sich das Layout nicht geändert hat -> nichts am DOM machen
      if (layoutKey === lastPresenceLayoutKey) {
        return;
      }
      lastPresenceLayoutKey = layoutKey;

      // Ab hier: wirklich neu rendern, weil sich etwas geändert hat

      presenceContainer.innerHTML = "";

      // 1) Alle anderen User linksbündig anhängen
      others.forEach((c) => {
        const tile = createPresenceTile(c.userName, false);
        presenceContainer.appendChild(tile);
      });

      // 2) Eigene "Ich"-Kachel ganz rechts
      if (hasSelf) {
        const selfTile = createPresenceTile("Ich", true);
        presenceContainer.appendChild(selfTile);
      }
    }
  );
}

function initPresenceWatcher() {
  // Sicherstellen, dass kein altes Interval läuft
  if (presenceIntervalId !== null) {
    clearInterval(presenceIntervalId);
    presenceIntervalId = null;
  }

  function startLoop() {
    // erste Ausführung sofort
    updatePresenceOnce();
    // dann im Intervall (1s, kannst du natürlich anpassen)
    presenceIntervalId = setInterval(updatePresenceOnce, 1000);
  }

  function waitForUserName() {
    const name = getUserNameFromPage();
    if (name) {
      presenceUserName = name;
      console.log("[Presence] Benutzername erkannt:", presenceUserName);
      startLoop();
      return;
    }

    // Wenn noch nicht da, nach 500ms nochmal probieren
    setTimeout(waitForUserName, 500);
  }

  waitForUserName();
}

// Script-Start
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPresenceWatcher);
} else {
  initPresenceWatcher();
}












async function initialize() {
	var test = document.querySelector('iframe[class="iframeBase"]')
	while (test == null){
		await sleep(100)
		var test2 = document.querySelector('div[class="save"]')
		if (test2 !== null){
			var theButton = document.querySelector('div[class="save"]').firstElementChild
			var box = theButton.getBoundingClientRect(),
					coordX = box.left + (box.right - box.left) / 2,
					coordY = box.top + (box.bottom - box.top) / 2;
			simulateMouseEvent (theButton, "click", coordX, coordY);
			var theButton = ""
			var box = ""
			await sleep(10000)
		}
		test = document.querySelector('iframe[class="iframeBase"]')
	}

	fixMyViewColumns();
	setInterval(manageHeights, 500);
	observeAddToCartBtnsForFocusSwitchOnItemSeachBar();
	monitorOrderPage();
	artikelUebersichtLauncher();
	setInterval(adjustElementWidths, 500);
	addEventListenersToSelectedRow();
	//setInterval(enhanceDuplicateCreateOrderButtons, 200);
	setInterval(checkUrlAndAttachListener, 200);
	setInterval(processBarcodeElements, 500);
	setInterval(addButtonsToOrder, 500)
	setInterval(addButtonsToNewOrderMenu, 500)
	setInterval(checkNewItemSearchResults, 100);
	setInterval(selectItemSearchInputFieldOnCreation, 200);
	setInterval(attachFocusHandlerToAddItemBtn, 200);
	setInterval(focusSearchBarOnNoResults, 200);
	watchOrderUI();
	openBasketOnNewOrderUi();
	setInterval(searchBarEnterEnhancementForSearchFilterReset, 500)
}
initialize()

