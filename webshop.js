dataDE = "";
dataEN = "";
loopCnt = 0;
length = 0;
lengthOld = 0;
err = false;

styleA = "text-align: center; font-weight: bold; font-size: 120%; position: absolute; margin-left: 48px; margin-right: auto; margin-top: -6px; width: 76px;"; // Button in Artikelbeschreibung MITTE (ArtNr)
styleB = "text-align: center; font-weight: bold; font-size: 120%; position: absolute; margin-left: 10px; margin-right: auto; margin-top: -6px; width: 40px;"; // Button in Artikelbeschreibung LINKS (DE)
styleC = "text-align: center; font-weight: bold; font-size: 120%; position: absolute; margin-left: 122px; margin-right: auto; margin-top: -6px; width: 40px;"; // Button in Artikelbeschreibung RECHTS (EN)

styleD = "text-align: center; font-weight: bold; font-size: 120%; position: absolute; top: 66%; left: 50%; transform: translateX(-50%); width: 76px;"; // Button in Artikel-Tile MITTE (ArtNr)
styleE = "text-align: center; font-weight: bold; font-size: 120%; position: absolute; top: 66%; left: calc(50% - 56px); transform: translateX(-50%); width: 40px;"; // Button in Artikel-Tile LINKS (DE)
styleF = "text-align: center; font-weight: bold; font-size: 120%; position: absolute; top: 66%; left: calc(50% + 56px); transform: translateX(-50%); width: 40px;"; // Button in Artikel-Tile RECHTS (EN)

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, time);
  });
}

function createBtns(currentID, currentBez, style1, style2, style3, target) {
  let artBtn = document.createElement("button");
  let artBtn2 = document.createElement("button");
  let artBtn3 = document.createElement("button");
  dataDE = currentBez + "\nhttps://servershop24.de/a-" + currentID + "/";
  dataEN = currentBez + "\nhttps://servershop24.de/en/a-" + currentID + "/";
  artBtn.id = "artBtn" + currentID;
  artBtn2.id = dataDE;
  artBtn3.id = dataEN;
  artBtn.setAttribute("class", "copy1");
  artBtn2.setAttribute("class", "copy2");
  artBtn3.setAttribute("class", "copy2");
  artBtn2.setAttribute("href", dataDE);
  artBtn3.setAttribute("href", dataEN);
  let newContent = document.createTextNode(currentID);
  let newContent2 = document.createTextNode("DE");
  let newContent3 = document.createTextNode("EN");
  artBtn.appendChild(newContent);
  artBtn2.appendChild(newContent2);
  artBtn3.appendChild(newContent3);
  artBtn.style = style1;
  artBtn2.style = style2;
  artBtn3.style = style3;
  target.appendChild(artBtn);
  target.appendChild(artBtn2);
  target.appendChild(artBtn3);
  artBtn.addEventListener("click", e =>
    navigator.clipboard.writeText(e.target.innerText)
      .catch(error => console.error(error.stack))
  );
  artBtn2.addEventListener("click", e =>
    navigator.clipboard.writeText(e.target.id)
      .catch(error => console.error(error.stack))
  );
  artBtn3.addEventListener("click", e =>
    navigator.clipboard.writeText(e.target.id)
      .catch(error => console.error(error.stack))
  );
}

async function showArtIDs() {
  start:
  while (true) {
    try {
      await sleep(500);
      const artikelNrInArtikelbeschreibung = document.querySelector('dd');
      if (artikelNrInArtikelbeschreibung) {
        const buttonPresent = document.querySelector('dd').querySelector('button');
        if (!buttonPresent) {
          const target = artikelNrInArtikelbeschreibung;
          const currentID = document.querySelector('dd').innerText;
          const currentBez = document.querySelector('h1[class="h3 title item-title"]').innerText;
          createBtns(currentID, currentBez, styleA, styleB, styleC, target);
        }
      }
      let length = document.querySelectorAll('a[href*="/a-"]').length;
      if (lengthOld !== length) {
        lengthOld = length;
        await sleep(500);
        const currentLength = document.querySelectorAll('a[href*="/a-"]').length;
        if (currentLength !== length) {
          continue;
        }
        for (let i = 0; i < length; i++) {
          const currentElement = document.querySelectorAll('a[href*="/a-"]')[i];
          const currentHREF = currentElement.href;
          let currentID = currentHREF.slice(currentHREF.length - 1);
          if (currentID == "/") {
            currentID = currentHREF.slice(currentHREF.length - 7);
            currentID = currentID.slice(0, -1);
          } else {
            currentID = currentHREF.slice(currentHREF.length - 6);
          }
          currentIDIsNaN = isNaN(currentID);
          if (!currentIDIsNaN) {
            const artBtn = document.createElement("button");
            const artBtnID = "artBtn" + currentID;
            artBtn.id = artBtnID;
            artBtn.setAttribute("class", "copy");
            const newContent = document.createTextNode(currentID);
            artBtn.appendChild(newContent);
            const parentElementClassName = currentElement.parentElement.parentElement.className;
            const includesUpgrade = parentElementClassName.includes("single-upgrade");
            if (includesUpgrade) {
              // HARDWARE CARE PACKS
              const artikelButtonPresent = currentElement.parentElement.querySelector('button[id*="artBtn"]');
              if (artikelButtonPresent) {
                const artikelButtonValid = currentElement.parentElement.querySelector(`button[id*="${currentID}"]`);
                if (artikelButtonValid) {
                  continue;
                } else {
                  const buttons = currentElement.parentElement.querySelectorAll('button');
                  buttons.forEach(button => button.remove());
                  //console.log("alle Buttons aus einer Upgrade-Artikelzeile entfernt! Artikelnummer: " + currentID);
                }
              }
              let artBtn = document.createElement("button");
              artBtn.id = artBtnID;
              artBtn.setAttribute("class", "copy1");
              let newContent = document.createTextNode(currentID);
              artBtn.appendChild(newContent);
              artBtn.style = "text-align: center; font-weight: bold; font-size: 100%; position: relative; margin-left: auto; margin-right: auto; width: 70px;";
              currentElement.parentElement.insertBefore(artBtn, currentElement);
              artBtn.addEventListener("click", e =>
                navigator.clipboard.writeText(e.target.innerText)
                  .catch(error => console.error(error.stack))
              );
            } else {
              // ARTIKEL-IDs
              const target = currentElement.parentElement.parentElement;
              const productListElement = currentElement.parentElement.parentElement.parentElement.className;
              const productList = productListElement.includes("product-list");
              if (productList) {
                const artikelButtonPresent = currentElement.parentElement.parentElement.querySelector('button[id*="artBtn"]');
                if (artikelButtonPresent) {
                  const artikelButtonValid = currentElement.parentElement.parentElement.querySelector(`button[id*="${currentID}"]`);
                  if (artikelButtonValid) {
                    continue;
                  } else {
                    const buttons = currentElement.parentElement.parentElement.querySelectorAll('button');
                    buttons.forEach(button => button.remove());
                    //console.log("alle Buttons aus einer Artikel-Tile entfernt! Artikelnummer: " + currentID);
                  }
                }
                const currentBez = currentElement.parentElement.querySelector('div[class="thumb-title"]').innerText;
                createBtns(currentID, currentBez, styleD, styleE, styleF, target);
              }
            }
          }
        }
      }
    } catch (error) {
      err = true;
      console.error(error.stack);
    } finally {
      if (err == true) {
        err = false;
        continue start;
      }
    }
  }
}

window.addEventListener('load', showArtIDs());
