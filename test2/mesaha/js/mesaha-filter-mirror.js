(function () {
  "use strict";

  if (window.__mesahaFilterMirrorV67) return;
  window.__mesahaFilterMirrorV67 = true;

  const $ = (id) => document.getElementById(id);
  const qs = (selector, root) => (root || document).querySelector(selector);

  const FILTERS = {
    tree: {
      sourceId: "treeFilters",
      statusId: "treeFilterText",
      mirrorChipsId: "recordsTreeFiltersV67",
      mirrorStatusId: "recordsTreeFilterTextV67",
      title: "Ağaç filtresi",
      dataAttr: "data-tree-filter",
      mirrorAttr: "data-mirror-tree-filter-v67",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 7.5 9h2.8L6.5 14h4v6h3v-6h4L13.7 9h2.8Z"/></svg>',
    },
    cutter: {
      sourceId: "cutterFilters",
      statusId: "cutterFilterText",
      mirrorChipsId: "recordsCutterFiltersV67",
      mirrorStatusId: "recordsCutterFilterTextV67",
      title: "Kesimci filtresi",
      dataAttr: "data-cutter-filter",
      mirrorAttr: "data-mirror-cutter-filter-v67",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/></svg>',
    },
  };

  function injectStyle() {
    if ($("mesaha-filter-mirror-v67-style")) return;
    const style = document.createElement("style");
    style.id = "mesaha-filter-mirror-v67-style";
    style.textContent = `
      #recordsView #recordsFiltersMirrorV67{display:grid!important;gap:10px!important;margin:2px 0 4px!important}
      #recordsView #recordsFiltersMirrorV67 .records-filters-head-v67{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:2px 2px 0!important}
      #recordsView #recordsFiltersMirrorV67 .records-filters-head-v67 h3{margin:0!important;font-size:17px!important;color:#173d2d!important}
      #recordsView #recordsFiltersMirrorV67 .records-filters-head-v67 span{padding:7px 10px!important;border-radius:999px!important;background:#eef7f1!important;color:#42705b!important;font-size:11px!important;font-weight:850!important}
      #recordsView #recordsFiltersMirrorV67 .filter-box-v67{border:1px solid #dce9e2!important;border-radius:22px!important;background:#fff!important;padding:0!important;margin:0!important;box-shadow:0 10px 24px rgba(15,23,42,.055)!important;overflow:hidden!important}
      #recordsView #recordsFiltersMirrorV67 .filter-toggle-v67{width:100%!important;min-height:68px!important;border:0!important;background:linear-gradient(180deg,#fff 0%,#f7fbf9 100%)!important;padding:12px 14px!important;display:grid!important;grid-template-columns:42px minmax(0,1fr) 38px!important;align-items:center!important;gap:12px!important;text-align:left!important;color:#173d2d!important;font:inherit!important;font-weight:800!important;box-shadow:none!important;-webkit-tap-highlight-color:transparent!important;touch-action:manipulation!important}
      #recordsView #recordsFiltersMirrorV67 .filter-toggle-icon-v67{width:42px!important;height:42px!important;border-radius:14px!important;display:grid!important;place-items:center!important;background:#eaf7ef!important;color:#0d7145!important}
      #recordsView #recordsFiltersMirrorV67 .filter-toggle-icon-v67 svg{width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}
      #recordsView #recordsFiltersMirrorV67 .filter-toggle-copy-v67{display:flex!important;flex-direction:column!important;gap:3px!important;min-width:0!important}
      #recordsView #recordsFiltersMirrorV67 .filter-toggle-copy-v67 b{font-size:16px!important;color:#173d2d!important}
      #recordsView #recordsFiltersMirrorV67 .filter-toggle-copy-v67 span{font-size:12px!important;color:#72877d!important;font-weight:700!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #recordsView #recordsFiltersMirrorV67 .filter-toggle-chevron-v67{width:36px!important;height:36px!important;border-radius:12px!important;display:grid!important;place-items:center!important;background:#f0f6f3!important;color:#1d6948!important;transition:transform .2s ease,background .2s ease!important}
      #recordsView #recordsFiltersMirrorV67 .filter-toggle-chevron-v67 svg{width:20px!important;height:20px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.25!important;stroke-linecap:round!important;stroke-linejoin:round!important}
      #recordsView #recordsFiltersMirrorV67 .filter-box-v67[data-open="1"] .filter-toggle-chevron-v67{transform:rotate(180deg)!important;background:#dff2e7!important}
      #recordsView #recordsFiltersMirrorV67 .filter-chips-v67{display:flex!important;margin:0!important;padding:0 14px 14px!important;gap:8px!important;overflow-x:auto!important;flex-wrap:nowrap!important;max-height:180px!important;opacity:1!important;transform:translateY(0)!important;transition:max-height .2s ease,opacity .16s ease,transform .16s ease,padding .2s ease!important;scrollbar-width:none!important}
      #recordsView #recordsFiltersMirrorV67 .filter-chips-v67::-webkit-scrollbar{display:none!important}
      #recordsView #recordsFiltersMirrorV67 .filter-box-v67[data-open="0"] .filter-chips-v67{display:none!important;max-height:0!important;opacity:0!important;transform:translateY(-5px)!important;padding-top:0!important;padding-bottom:0!important;pointer-events:none!important}
      #recordsView #recordsFiltersMirrorV67 .filter-chip{flex:0 0 auto!important}
    `;
    document.head.appendChild(style);
  }

  function sourceBox(key) {
    const cfg = FILTERS[key];
    const chips = $(cfg.sourceId);
    return chips && chips.closest ? chips.closest(".filter-box") : null;
  }

  function createBox(key) {
    const cfg = FILTERS[key];
    const box = document.createElement("section");
    box.className = "filter-box-v67";
    box.dataset.filterKey = key;
    box.dataset.open = "0";
    box.innerHTML = `
      <button class="filter-toggle-v67" type="button" aria-expanded="false">
        <span class="filter-toggle-icon-v67">${cfg.icon}</span>
        <span class="filter-toggle-copy-v67">
          <b>${cfg.title}</b>
          <span id="${cfg.mirrorStatusId}">Seçili: Tümü</span>
        </span>
        <span class="filter-toggle-chevron-v67">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 9 5.5 5.5L17.5 9"/></svg>
        </span>
      </button>
      <div class="filter-chips-v67" id="${cfg.mirrorChipsId}" aria-hidden="true"></div>
    `;
    return box;
  }

  function ensureMirror() {
    const recordsCard = qs("#recordsView .records-card");
    if (!recordsCard) return null;

    let section = $("recordsFiltersMirrorV67");
    if (!section) {
      section = document.createElement("section");
      section.id = "recordsFiltersMirrorV67";
      section.setAttribute("aria-label", "Ölçüm kayıt filtreleri");
      section.innerHTML =
        '<div class="records-filters-head-v67"><h3>Kayıt Filtreleri</h3><span>Beyan ile senkron</span></div>';
      section.appendChild(createBox("tree"));
      section.appendChild(createBox("cutter"));
    }

    const restoreInput = $("restoreInput");
    const recordList = $("recordList");
    const anchor =
      restoreInput && restoreInput.parentNode === recordsCard
        ? restoreInput
        : recordList && recordList.parentNode === recordsCard
          ? recordList
          : null;

    if (section.parentNode !== recordsCard) {
      if (anchor) recordsCard.insertBefore(section, anchor);
      else recordsCard.appendChild(section);
    } else if (anchor && section.nextSibling !== anchor) {
      recordsCard.insertBefore(section, anchor);
    }

    bindMirror(section);
    return section;
  }

  function findSourceToggle(key) {
    const box = sourceBox(key);
    return box ? qs(".filter-toggle-v600", box) : null;
  }

  function syncOpen(key) {
    const mirror = qs(`#recordsFiltersMirrorV67 [data-filter-key="${key}"]`);
    const source = sourceBox(key);
    if (!mirror || !source) return;
    const open = source.dataset.open === "1";
    mirror.dataset.open = open ? "1" : "0";
    const button = qs(".filter-toggle-v67", mirror);
    const chips = qs(".filter-chips-v67", mirror);
    if (button) button.setAttribute("aria-expanded", open ? "true" : "false");
    if (chips) chips.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function cloneChips(key) {
    const cfg = FILTERS[key];
    const source = $(cfg.sourceId);
    const target = $(cfg.mirrorChipsId);
    if (!source || !target) return;

    const fragment = document.createDocumentFragment();
    Array.from(source.querySelectorAll(`[${cfg.dataAttr}]`)).forEach((button) => {
      const clone = button.cloneNode(true);
      const value = button.getAttribute(cfg.dataAttr) || "Tümü";
      clone.removeAttribute("id");
      clone.removeAttribute(cfg.dataAttr);
      clone.setAttribute(cfg.mirrorAttr, value);
      clone.type = "button";
      fragment.appendChild(clone);
    });
    target.replaceChildren(fragment);

    const sourceStatus = $(cfg.statusId) || qs(".filter-status-v600", sourceBox(key));
    const mirrorStatus = $(cfg.mirrorStatusId);
    if (sourceStatus && mirrorStatus) mirrorStatus.textContent = sourceStatus.textContent;
    syncOpen(key);
  }

  function syncAll() {
    ensureMirror();
    cloneChips("tree");
    cloneChips("cutter");
  }

  function activateSourceFilter(key, value) {
    const cfg = FILTERS[key];
    const source = $(cfg.sourceId);
    if (!source) return;
    const button = Array.from(source.querySelectorAll(`[${cfg.dataAttr}]`)).find(
      (candidate) => (candidate.getAttribute(cfg.dataAttr) || "") === value,
    );
    if (button) {
      button.click();
      setTimeout(syncAll, 20);
      setTimeout(syncAll, 120);
    }
  }

  function bindMirror(section) {
    if (section.__mesahaV67Bound) return;
    section.__mesahaV67Bound = true;

    section.addEventListener(
      "click",
      (event) => {
        const toggle = event.target.closest(".filter-toggle-v67");
        if (toggle) {
          event.preventDefault();
          const box = toggle.closest("[data-filter-key]");
          const key = box && box.dataset.filterKey;
          const sourceToggle = key ? findSourceToggle(key) : null;
          if (sourceToggle) {
            sourceToggle.click();
            setTimeout(() => syncOpen(key), 10);
          }
          return;
        }

        const tree = event.target.closest("[data-mirror-tree-filter-v67]");
        if (tree) {
          event.preventDefault();
          event.stopPropagation();
          activateSourceFilter("tree", tree.getAttribute("data-mirror-tree-filter-v67") || "Tümü");
          return;
        }

        const cutter = event.target.closest("[data-mirror-cutter-filter-v67]");
        if (cutter) {
          event.preventDefault();
          event.stopPropagation();
          activateSourceFilter("cutter", cutter.getAttribute("data-mirror-cutter-filter-v67") || "Tümü");
        }
      },
      true,
    );
  }

  function observeSources() {
    ["tree", "cutter"].forEach((key) => {
      const cfg = FILTERS[key];
      const source = $(cfg.sourceId);
      const box = sourceBox(key);
      if (source && !source.__mesahaV67Observed) {
        source.__mesahaV67Observed = true;
        new MutationObserver(() => cloneChips(key)).observe(source, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class"],
        });
      }
      if (box && !box.__mesahaV67OpenObserved) {
        box.__mesahaV67OpenObserved = true;
        new MutationObserver(() => syncOpen(key)).observe(box, {
          attributes: true,
          attributeFilter: ["data-open"],
        });
      }
    });
  }

  function boot() {
    injectStyle();
    ensureMirror();
    observeSources();
    syncAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener("mesaha:view-changed", () => setTimeout(boot, 40));
  window.addEventListener("mesaha:settings-saved", () => setTimeout(syncAll, 30));
  [180, 500, 1100, 2200, 4000].forEach((delay) => setTimeout(boot, delay));
})();
