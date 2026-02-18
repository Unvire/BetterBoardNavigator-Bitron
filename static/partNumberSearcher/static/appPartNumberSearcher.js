/* Web odpowiednik:
   - PartNumberPDFExtractor (PyMuPDF) -> PDF.js extractText()
   - GUI (Tkinter Treeview + search) -> tabela + filter
   Źródłowa logika: szukanie nagłówka IPN/Description/Quantity/RefDes i wierszy z 8 cyfr. */

const btnLoad = document.getElementById("btnLoad");
const fileInput = document.getElementById("fileInput");
const searchInput = document.getElementById("searchInput");
const btnClear = document.getElementById("btnClear");
const tbody = document.getElementById("tbody");
const statusEl = document.getElementById("status");

// dane
let allItems = [];
let filteredItems = [];

// Ustaw worker PDF.js
// (CDN path pasuje do użytego pdf.min.js z CDNJS)
pdfjsLib.GlobalWorkerOptions.workerSrc = "static/pdfjs/pdf.worker.min.js";

btnLoad.addEventListener("click", () => fileInput.click());
btnClear.addEventListener("click", () => {
  searchInput.value = "";
  filteredItems = [...allItems];
  renderTable(filteredItems);
});

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    filteredItems = [...allItems];
  } else {
    filteredItems = allItems.filter((it) =>
      it.name.toLowerCase().includes(q) ||
      it.code.toLowerCase().includes(q) ||
      it.description.toLowerCase().includes(q)
    );
  }
  renderTable(filteredItems);
});

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  statusEl.textContent = `Wczytywanie: ${file.name} ...`;
  document.title = file.name;

  try {
    const lines = await extractTextLinesFromPdf(file);
    const pnDict = parsePartNumbersFromLines(lines);
    const items = dictToItemsSorted(pnDict);

    allItems = items;
    filteredItems = [...allItems];
    renderTable(filteredItems);

    statusEl.textContent = `Wczytano: ${file.name} • rekordów: ${allItems.length}`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Błąd podczas przetwarzania PDF (sprawdź konsolę).";
    allItems = [];
    filteredItems = [];
    renderTable([]);
  } finally {
    // pozwala wczytać ponownie ten sam plik (reset inputa)
    fileInput.value = "";
  }
});

/** PDF.js: wyciąga tekst stronami i zwraca listę linii (split po \n + czyszczenie). */
async function extractTextLinesFromPdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  let fullText = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => it.str).join("\n");
    fullText += pageText + "\n";
  }

  // Normalizacja podobna do split('\n') w Pythonie
  return fullText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Parser analogiczny do _searchComponentsData z partNumberScrapper.py */
function parsePartNumbersFromLines(lines) {
  const pnDict = {};

  const is8Digits = (s) => /^\d{8}$/.test(s);

  // W Pythonie:
  // header jeśli text[i]=='refdes' i text[i-1]=='quantity' i text[i-2]=='description' i text[i-3]=='ipn'
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i].toLowerCase();
    const prev1 = (lines[i - 1] || "").toLowerCase();
    const prev2 = (lines[i - 2] || "").toLowerCase();
    const prev3 = (lines[i - 3] || "").toLowerCase();

    const isHeader =
      cur === "refdes" &&
      prev1 === "quantity" &&
      prev2 === "description" &&
      prev3 === "ipn";

    if (!isHeader) continue;

    // po nagłówku idą rekordy: bitronCode(8 cyfr), description, quantity, refdes...
    let j = i + 1;
    while (j < lines.length && is8Digits(lines[j])) {
      const bitronCode = lines[j];
      const description = lines[j + 1] || "";
      // lines[j+2] to quantity (ignorujemy)
      let components = lines[j + 3] || "";

      j += 4;

      // W Pythonie dopisuje kolejne linie dopóki zawierają przecinek.
      // Robimy to samo, ale bezpieczniej: dopisuj, jeśli linia wygląda na ciąg refdesów.
      while (j < lines.length && looksLikeRefdesContinuation(lines[j])) {
        components += "," + lines[j];
        j++;
      }

      updatePartNumberDictInPlace(pnDict, components, bitronCode, description);
    }

    // przeskocz i dalej szukaj kolejnych tabel
    i = j - 1;
  }

  return pnDict;
}

/** Heurystyka: linia jest kontynuacją refdesów jeśli ma przecinek i nie jest nowym nagłówkiem ani 8 cyfr. */
function looksLikeRefdesContinuation(s) {
  if (!s) return false;
  const t = s.trim();
  if (/^\d{8}$/.test(t)) return false; // nowy IPN
  const low = t.toLowerCase();
  if (low === "ipn" || low === "description" || low === "quantity" || low === "refdes") return false;
  // typowo: "R1, R2, C10" albo "R1,R2"
  return t.includes(",") && /[A-Za-z]/.test(t);
}

/** Odpowiednik _updatePartNumberDictInPlace */
function updatePartNumberDictInPlace(pnDict, components, bitronCode, description) {
  const list = components
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  for (const component of list) {
    pnDict[component] = {
      partNumber: bitronCode,
      description: description,
    };
  }
}

/** Odpowiednik listy allItems + sorted(weightFunction) z GUI */
function dictToItemsSorted(pnDict) {
  const items = Object.entries(pnDict).map(([name, attrs]) => ({
    name,
    code: String(attrs.partNumber || ""),
    description: String(attrs.description || ""),
  }));

  items.sort((a, b) => weightFunction(a) - weightFunction(b));
  return items;
}

/** Port Twojego weightFunction z mainGUI.py */
function weightFunction(item) {
  const name = (item.name || "").toUpperCase();
  // jeśli nie pasuje do ^[A-Z]+[0-9]+ => Infinity (na koniec)
  if (!/^[A-Z]+[0-9]+/.test(name)) return Number.POSITIVE_INFINITY;

  let i = 0;
  let letterWeight = 1e6;
  let resultWeight = 0;

  while (i < name.length) {
    const code = name.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      resultWeight += code * letterWeight;
      letterWeight /= 10;
      i++;
    } else {
      break;
    }
  }

  const numPart = parseInt(name.slice(i), 10);
  return resultWeight + (Number.isFinite(numPart) ? numPart : 0);
}

function renderTable(items) {
  tbody.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const it of items) {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.className = "name";
    tdName.textContent = it.name;

    const tdCode = document.createElement("td");
    tdCode.className = "code";
    tdCode.textContent = it.code;

    const tdDesc = document.createElement("td");
    tdDesc.className = "desc";
    tdDesc.textContent = it.description;

    tr.appendChild(tdName);
    tr.appendChild(tdCode);
    tr.appendChild(tdDesc);
    frag.appendChild(tr);
  }

  tbody.appendChild(frag);
}
