document.addEventListener('copy', (event) => {
  // Verhindert die Standardkopieraktion
  event.preventDefault();

  // Holt den aktuellen Text der Auswahl
  const selection = window.getSelection();
  if (!selection) return;

  const plainText = selection.toString();

  // Überschreibt den Inhalt der Zwischenablage mit reinem Text
  event.clipboardData.setData('text/plain', plainText);
});
