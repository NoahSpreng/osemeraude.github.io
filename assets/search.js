/**
 * DISTRICT FA — Recherche globale
 * Colle ce fichier dans assets/ et inclus-le dans chaque page avant </body> :
 * <script src="../assets/search.js"></script>
 */

(function () {

  // ── Pages à scanner ──────────────────────────────────────────────────────
  const PAGES = [
    { file: "global.html",  label: "GLOBAL",  cls: "global"  },
    { file: "legal.html",   label: "LÉGAL",   cls: "legal"   },
    { file: "illegal.html", label: "ILLÉGAL", cls: "illegal" },
  ];

  let allRules = [];

  // ────────────────────────────────────────────────────────────────────────
  // OVERLAY HTML
  // ────────────────────────────────────────────────────────────────────────
  function injectOverlay() {
    document.body.insertAdjacentHTML("beforeend", `
    <div id="dfa-search-overlay" aria-hidden="true">
      <div id="dfa-search-backdrop"></div>
      <div id="dfa-search-modal">
        <div id="dfa-search-header">
          <div id="dfa-search-input-wrap">
            <svg id="dfa-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input id="dfa-search-input" type="text" placeholder="Rechercher une règle..." autocomplete="off" spellcheck="false"/>
            <kbd id="dfa-esc-hint">ESC</kbd>
          </div>
          <div id="dfa-filters">
            <button class="dfa-filter active" data-filter="all">TOUS</button>
            <button class="dfa-filter" data-filter="global">GLOBAL</button>
            <button class="dfa-filter" data-filter="legal">LÉGAL</button>
            <button class="dfa-filter" data-filter="illegal">ILLÉGAL</button>
          </div>
        </div>
        <div id="dfa-search-body">
          <div id="dfa-search-status">Chargement des règles...</div>
          <div id="dfa-results"></div>
        </div>
        <div id="dfa-search-footer">
          <span>↑↓ naviguer</span><span>↵ ouvrir</span><span>ESC fermer</span>
        </div>
      </div>
    </div>`);
  }

  // ────────────────────────────────────────────────────────────────────────
  // CSS
  // ────────────────────────────────────────────────────────────────────────
  function injectStyles() {
    const css = `
    #dfa-search-li { display: flex; align-items: center; }
    #dfa-search-btn {
      display: flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; background: transparent;
      border: 1px solid #333; border-radius: 3px; cursor: pointer;
      color: #888; transition: color .2s, border-color .2s, background .2s;
      flex-shrink: 0; padding: 0;
    }
    #dfa-search-btn:hover { color: #eee; border-color: #e03030; background: rgba(224,48,48,.08); }
    #dfa-search-btn svg { width: 15px; height: 15px; }

    #dfa-search-overlay {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 80px; opacity: 0; pointer-events: none; transition: opacity .2s;
    }
    #dfa-search-overlay.open { opacity: 1; pointer-events: all; }
    #dfa-search-backdrop {
      position: absolute; inset: 0;
      background: rgba(0,0,0,.85); backdrop-filter: blur(6px);
    }
    #dfa-search-modal {
      position: relative; z-index: 1; width: 100%; max-width: 720px;
      background: #111; border: 1px solid #2a2a2a; border-radius: 6px;
      display: flex; flex-direction: column; max-height: calc(100vh - 120px);
      overflow: hidden; transform: translateY(-12px); transition: transform .2s;
      box-shadow: 0 32px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(224,48,48,.1);
    }
    #dfa-search-overlay.open #dfa-search-modal { transform: translateY(0); }

    #dfa-search-header { border-bottom: 1px solid #1e1e1e; }
    #dfa-search-input-wrap { display: flex; align-items: center; gap: 12px; padding: 16px 20px; }
    #dfa-search-icon { width: 18px; height: 18px; color: #e03030; flex-shrink: 0; }
    #dfa-search-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #fff; font-size: 16px; font-family: inherit; letter-spacing: .3px;
    }
    #dfa-search-input::placeholder { color: #444; }
    #dfa-esc-hint {
      font-size: 10px; letter-spacing: 1px; border: 1px solid #333;
      border-radius: 3px; padding: 3px 8px; color: #555; font-family: inherit;
    }
    #dfa-filters { display: flex; padding: 0 20px 14px; }
    .dfa-filter {
      background: transparent; border: 1px solid #2a2a2a; color: #555;
      font-size: 10px; letter-spacing: 2px; padding: 5px 14px; cursor: pointer;
      font-family: inherit; transition: color .15s, background .15s, border-color .15s;
    }
    .dfa-filter:first-child { border-radius: 3px 0 0 3px; }
    .dfa-filter:last-child  { border-radius: 0 3px 3px 0; }
    .dfa-filter + .dfa-filter { border-left: none; }
    .dfa-filter:hover { color: #fff; border-color: #444; }
    .dfa-filter.active { color: #fff; background: #e03030; border-color: #e03030; }

    #dfa-search-body { overflow-y: auto; flex: 1; padding: 12px; }
    #dfa-search-status {
      text-align: center; padding: 40px; color: #444;
      font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    }

    .dfa-result {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 16px; border-radius: 4px; cursor: pointer;
      text-decoration: none; transition: background .15s; margin-bottom: 4px;
      border-left: 2px solid transparent;
    }
    .dfa-result:hover, .dfa-result.focused { background: #1a1a1a; }
    .dfa-result.focused { border-left-color: #e03030; }

    .dfa-result-badge {
      font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
      padding: 3px 10px; border-radius: 2px; flex-shrink: 0; font-weight: 700; font-family: inherit;
    }
    .dfa-badge-global  { background: rgba(255,255,255,.06); color: #888;    border: 1px solid rgba(255,255,255,.1); }
    .dfa-badge-legal   { background: rgba(46,204,113,.1);   color: #2ecc71; border: 1px solid rgba(46,204,113,.2); }
    .dfa-badge-illegal { background: rgba(224,48,48,.1);    color: #e03030; border: 1px solid rgba(224,48,48,.2); }

    .dfa-result-text { flex: 1; min-width: 0; }
    .dfa-result-title {
      color: #eee; font-size: 14px; font-weight: 600;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px;
    }
    .dfa-result-title mark { background: transparent; color: #e03030; font-weight: 800; }
    .dfa-result-sub  { color: #555; font-size: 11px; margin-bottom: 2px; }
    .dfa-result-page { color: #3a3a3a; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }

    .dfa-result-arrow { color: #333; font-size: 16px; transition: color .15s; }
    .dfa-result:hover .dfa-result-arrow,
    .dfa-result.focused .dfa-result-arrow { color: #e03030; }

    .dfa-group-label {
      font-size: 10px; letter-spacing: 3px; color: #333;
      text-transform: uppercase; padding: 8px 16px 4px;
    }

    #dfa-search-footer {
      border-top: 1px solid #1e1e1e; display: flex; gap: 20px;
      padding: 10px 20px; color: #3a3a3a; font-size: 10px; letter-spacing: 1px;
    }

    #dfa-search-body::-webkit-scrollbar { width: 4px; }
    #dfa-search-body::-webkit-scrollbar-track { background: transparent; }
    #dfa-search-body::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

    .dfa-highlight-anchor { animation: dfa-pulse 1.5s ease; }
    @keyframes dfa-pulse {
      0%  { outline: 2px solid rgba(224,48,48,.8); }
      100%{ outline: 2px solid rgba(224,48,48,0);  }
    }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ────────────────────────────────────────────────────────────────────────
  // BOUTON LOUPE NAVBAR
  // ────────────────────────────────────────────────────────────────────────
  function injectNavButton() {
    const navUl = document.querySelector("nav ul");
    if (!navUl) return;
    const btn = document.createElement("button");
    btn.id = "dfa-search-btn";
    btn.setAttribute("aria-label", "Rechercher");
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`;
    btn.addEventListener("click", openSearch);
    const li = document.createElement("li");
    li.id = "dfa-search-li";
    li.appendChild(btn);
    navUl.appendChild(li);
  }

  // ────────────────────────────────────────────────────────────────────────
  // GÉNÈRE UN SLUG depuis un texte
  // ────────────────────────────────────────────────────────────────────────
  function slug(text) {
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  // ────────────────────────────────────────────────────────────────────────
  // SCANNER LES PAGES
  // ────────────────────────────────────────────────────────────────────────
  async function scanPages() {
    const results = [];

    for (const page of PAGES) {
      try {
        const res = await fetch(page.file);
        if (!res.ok) continue;
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        doc.querySelectorAll(".acc-item").forEach((accItem) => {
          const accTitle = accItem.querySelector(".acc-title")?.textContent.trim() || "";
          const accSub   = accItem.querySelector(".acc-sub")?.textContent.trim()   || "";
          const accNum   = accItem.querySelector(".acc-num")?.textContent.trim()   || "";
          const accAnchor = "section-" + slug(accTitle);

          // Section principale
          results.push({
            title:  accTitle,
            sub:    accSub,
            num:    accNum,
            page:   page.file,
            anchor: accAnchor,
            label:  page.label,
            cls:    page.cls,
            type:   "section",
          });

          // Sous-sections
          accItem.querySelectorAll(".sub-item").forEach((subItem) => {
            const subTitle = subItem.querySelector(".sub-title")?.textContent.trim() || "";
            if (!subTitle) return;
            const subAnchor = accAnchor + "-sub-" + slug(subTitle);

            results.push({
              title:  subTitle,
              sub:    accTitle,
              num:    accNum,
              page:   page.file,
              anchor: subAnchor,
              label:  page.label,
              cls:    page.cls,
              type:   "sub",
            });
          });
        });
      } catch (e) { /* fetch bloqué en file:// */ }
    }

    allRules = results;
    updateStatus();
  }

  // ── Ajoute les IDs dans la page courante & gère l'arrivée avec #hash ────
  function addAnchorsToCurrentPage() {
    document.querySelectorAll(".acc-item").forEach((accItem) => {
      const accTitle  = accItem.querySelector(".acc-title")?.textContent.trim() || "";
      const accAnchor = "section-" + slug(accTitle);
      accItem.id = accAnchor;

      accItem.querySelectorAll(".sub-item").forEach((subItem) => {
        const subTitle = subItem.querySelector(".sub-title")?.textContent.trim() || "";
        if (!subTitle) return;
        subItem.id = accAnchor + "-sub-" + slug(subTitle);
      });
    });

    // Arrivée depuis la recherche avec un #hash
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        // Ouvre l'acc-item parent
        const accItem = target.closest(".acc-item") || target;
        accItem.classList.add("open");
        // Ouvre le sub-item si c'est une sous-section
        if (target.classList.contains("sub-item")) {
          target.classList.add("open");
        }
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("dfa-highlight-anchor");
          setTimeout(() => target.classList.remove("dfa-highlight-anchor"), 1600);
        }, 150);
      }
    }
  }

  function updateStatus() {
    const status = document.getElementById("dfa-search-status");
    if (!status) return;
    if (allRules.length === 0) {
      status.textContent = "Lance le site depuis un serveur local pour activer la recherche.";
    } else {
      status.textContent = allRules.length + " éléments indexés — commence à taper…";
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // RECHERCHE & RENDU
  // ────────────────────────────────────────────────────────────────────────
  let activeFilter = "all";
  let focusedIndex = -1;

  function hl(text, q) {
    if (!q) return text;
    const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    return text.replace(re, "<mark>$1</mark>");
  }

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    const container = document.getElementById("dfa-results");
    const status    = document.getElementById("dfa-search-status");
    if (!container) return;
    focusedIndex = -1;

    if (!q) {
      container.innerHTML = "";
      status.style.display = "block";
      updateStatus();
      return;
    }
    status.style.display = "none";

    const filtered = allRules.filter(r => {
      const matchFilter = activeFilter === "all" || r.cls === activeFilter;
      const matchSearch =
        r.title.toLowerCase().includes(q) ||
        (r.sub && r.sub.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:#444;font-size:12px;letter-spacing:2px">AUCUNE RÈGLE TROUVÉE</div>`;
      return;
    }

    const groups = {};
    filtered.forEach(r => {
      if (!groups[r.label]) groups[r.label] = [];
      groups[r.label].push(r);
    });

    let html = "";
    let idx = 0;
    for (const [label, rules] of Object.entries(groups)) {
      html += `<div class="dfa-group-label">${label}</div>`;
      rules.forEach(r => {
        const href     = r.page + "#" + r.anchor;
        const subtitle = r.type === "sub"
          ? `<div class="dfa-result-sub">↳ ${hl(r.sub, query)}</div>`
          : r.sub ? `<div class="dfa-result-sub">${hl(r.sub, query)}</div>` : "";
        html += `
          <a class="dfa-result" href="${href}" data-idx="${idx}">
            <span class="dfa-result-badge dfa-badge-${r.cls}">${r.label}</span>
            <div class="dfa-result-text">
              <div class="dfa-result-title">${r.num ? `<span style="color:#555;margin-right:8px">${r.num}</span>` : ""}${hl(r.title, query)}</div>
              ${subtitle}
              <div class="dfa-result-page">${r.page.replace(".html", "")}</div>
            </div>
            <span class="dfa-result-arrow">→</span>
          </a>`;
        idx++;
      });
    }
    container.innerHTML = html;
  }

  // ────────────────────────────────────────────────────────────────────────
  // KEYBOARD NAV
  // ────────────────────────────────────────────────────────────────────────
  function moveFocus(dir) {
    const cards = document.querySelectorAll(".dfa-result");
    if (!cards.length) return;
    cards.forEach(c => c.classList.remove("focused"));
    focusedIndex = Math.max(0, Math.min(cards.length - 1, focusedIndex + dir));
    cards[focusedIndex].classList.add("focused");
    cards[focusedIndex].scrollIntoView({ block: "nearest" });
  }

  // ────────────────────────────────────────────────────────────────────────
  // OPEN / CLOSE
  // ────────────────────────────────────────────────────────────────────────
  function openSearch() {
    const overlay = document.getElementById("dfa-search-overlay");
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    setTimeout(() => document.getElementById("dfa-search-input")?.focus(), 50);
  }

  function closeSearch() {
    const overlay = document.getElementById("dfa-search-overlay");
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.getElementById("dfa-search-input").value = "";
    document.getElementById("dfa-results").innerHTML = "";
    document.getElementById("dfa-search-status").style.display = "block";
    updateStatus();
  }

  // ────────────────────────────────────────────────────────────────────────
  // INIT
  // ────────────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    injectOverlay();
    injectNavButton();
    addAnchorsToCurrentPage();
    scanPages();

    document.getElementById("dfa-search-backdrop").addEventListener("click", closeSearch);
    document.getElementById("dfa-search-input").addEventListener("input", e => renderResults(e.target.value));

    document.querySelectorAll(".dfa-filter").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".dfa-filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = btn.dataset.filter;
        renderResults(document.getElementById("dfa-search-input").value);
      });
    });

    document.addEventListener("keydown", e => {
      const overlay = document.getElementById("dfa-search-overlay");
      const isOpen  = overlay.classList.contains("open");
      if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && !isOpen) { e.preventDefault(); openSearch(); }
      if (e.key === "Escape"    && isOpen) closeSearch();
      if (e.key === "ArrowDown" && isOpen) { e.preventDefault(); moveFocus(1); }
      if (e.key === "ArrowUp"   && isOpen) { e.preventDefault(); moveFocus(-1); }
      if (e.key === "Enter"     && isOpen) {
        const focused = document.querySelector(".dfa-result.focused");
        if (focused) { closeSearch(); focused.click(); }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();