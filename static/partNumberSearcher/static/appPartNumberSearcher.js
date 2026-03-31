const searchInput = document.getElementById("searchInput");
const btnClear = document.getElementById("btnClear");
const tbody = document.getElementById("tbody");

let allItems = [];
let filteredItems = [];

const targetOrigin = window.location.origin;

/* ===== GET DATA FROM PARENT ===== */
window.addEventListener("message", (event) => {
    if (event.origin !== targetOrigin) return;

    if (!event.data || event.data.type !== "PN_DICT"){
        return;
    }

    const pnDict = event.data.payload || {};

    allItems = dictToItemsSorted(pnDict);
    filteredItems = [...allItems];

    renderTable(filteredItems);
});


/* ===== FILTER ===== */
searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();

    if (!q) {
        filteredItems = [...allItems];
    } else {
        filteredItems = allItems.filter(it =>
            it.name.toLowerCase().includes(q) ||
            it.code.toLowerCase().includes(q) ||
            it.description.toLowerCase().includes(q)
        );
    }

    renderTable(filteredItems);
});

btnClear.addEventListener("click", () => {
    searchInput.value = "";
    filteredItems = [...allItems];
    renderTable(filteredItems);
});


/* ===== PROCESSING PN DICT ===== */
function dictToItemsSorted(pnDict) {
    const items = Object.entries(pnDict).map(([name, attrs]) => ({
        name,
        code: String(attrs.partNumber || ""),
        description: String(attrs.description || "")
    }));

    items.sort((a, b) => weightFunction(a) - weightFunction(b));
    return items;
}

function weightFunction(item) {
    const name = (item.name || "").toUpperCase();
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

/* ===== RENDERING ===== */
function renderTable(items) {
    tbody.innerHTML = ""
    const frag = document.createDocumentFragment();

    for (const it of items) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="name">${it.name}</td>
            <td class="code">${it.code}</td>
            <td class="desc">${it.description}</td>
        `;
        frag.appendChild(tr);
    }
    tbody.appendChild(frag);
}
