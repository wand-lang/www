// wand-lang.org: search, the filter pills, the signature tabs and the copy
// buttons. Every page reads in full without this file; it only adds.

(function () {
  "use strict";

  var root = document.body.getAttribute("data-root") || "";

  // ── Sidebar ─────────────────────────────────────────────────────────
  // The sidebar is open in the markup, so it reads without this file. On a
  // narrow screen it stands above the page, and starts closed.
  if (window.matchMedia("(max-width: 860px)").matches) {
    document.querySelectorAll("details[data-collapsible]").forEach(function (d) { d.open = false; });
  }

  // ── Copy ────────────────────────────────────────────────────────────
  function copyText(button) {
    var holder = button.closest(".cmd, .codebox");
    if (!holder) return "";
    var marked = holder.querySelector("[data-copy-text]");
    if (marked) return marked.textContent;
    var code = holder.querySelector("pre");
    return code ? code.textContent : "";
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy]");
    if (!button || !navigator.clipboard) return;
    navigator.clipboard.writeText(copyText(button)).then(function () {
      var label = button.getAttribute("aria-label");
      if (button.classList.contains("copy")) {
        var was = button.textContent;
        button.textContent = "Copied";
        setTimeout(function () { button.textContent = was; }, 1500);
      } else if (label) {
        button.setAttribute("aria-label", "Copied");
        setTimeout(function () { button.setAttribute("aria-label", label); }, 1500);
      }
    });
  });

  // ── Filters ─────────────────────────────────────────────────────────
  // A pill group says what it filters by: "effects" keeps the module cards
  // whose manifest has the label, "category" the ports filed under it.
  function keeps(kind, value, card) {
    if (value === "All") return true;
    if (kind === "category") return card.getAttribute("data-category") === value;
    var effects = (card.getAttribute("data-effects") || "").split(" ").filter(Boolean);
    if (value === "Pure") return effects.length === 0;
    return effects.some(function (e) { return e === value || e.indexOf(value + ".") === 0; });
  }

  document.querySelectorAll("[data-filters]").forEach(function (group) {
    var kind = group.getAttribute("data-filters");
    var selector = kind === "category" ? "[data-category]" : "[data-effects]";
    group.addEventListener("click", function (event) {
      var pill = event.target.closest("[data-filter]");
      if (!pill) return;
      var value = pill.getAttribute("data-filter");
      group.querySelectorAll("[data-filter]").forEach(function (p) {
        p.setAttribute("aria-pressed", p === pill ? "true" : "false");
      });
      var shown = 0;
      document.querySelectorAll(selector).forEach(function (card) {
        var on = keeps(kind, value, card);
        card.hidden = !on;
        if (on) shown++;
      });
      document.querySelectorAll("[data-group]").forEach(function (section) {
        section.hidden = !section.querySelector(selector + ":not([hidden])");
      });
      var empty = document.querySelector("[data-empty]");
      if (empty) empty.hidden = shown > 0;
    });
  });

  // ── Tabs ────────────────────────────────────────────────────────────
  document.querySelectorAll("[data-tabs]").forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role=tab]"));
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    }
    list.addEventListener("click", function (event) {
      var tab = event.target.closest("[role=tab]");
      if (tab) select(tab);
    });
    list.addEventListener("keydown", function (event) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = event.key === "ArrowRight" ? i + 1 : event.key === "ArrowLeft" ? i - 1 : null;
      if (next === null) return;
      event.preventDefault();
      var tab = tabs[(next + tabs.length) % tabs.length];
      select(tab);
      tab.focus();
    });
  });

  // ── Search ──────────────────────────────────────────────────────────
  // One index for the whole site, fetched the first time a search box is
  // used: every reference heading and every library name.
  var index = null;
  function load() {
    if (index) return index;
    index = fetch(root + "assets/search.json").then(function (r) { return r.json(); });
    return index;
  }

  function rank(entries, query) {
    var q = query.toLowerCase();
    var scored = [];
    entries.forEach(function (e) {
      var t = e.t.toLowerCase();
      var short = t.indexOf(".") >= 0 ? t.slice(t.indexOf(".") + 1) : t;
      var score = t === q || short === q ? 0
        : t.indexOf(q) === 0 || short.indexOf(q) === 0 ? 1
        : t.indexOf(q) >= 0 ? 2 : -1;
      if (score >= 0) scored.push({ e: e, s: score });
    });
    scored.sort(function (a, b) { return a.s - b.s || a.e.t.length - b.e.t.length; });
    return scored.slice(0, 12).map(function (x) { return x.e; });
  }

  document.querySelectorAll("[data-search]").forEach(function (input) {
    var list = document.getElementById(input.getAttribute("aria-controls"));
    var active = -1;

    function close() {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      active = -1;
    }

    function mark() {
      var links = list.querySelectorAll("a");
      links.forEach(function (a, i) { a.setAttribute("aria-selected", i === active ? "true" : "false"); });
      if (links[active]) {
        links[active].scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", links[active].id);
      }
    }

    function show(results) {
      list.textContent = "";
      if (!results.length) {
        var none = document.createElement("li");
        none.className = "none";
        none.textContent = "Nothing by that name.";
        list.appendChild(none);
      }
      results.forEach(function (e, i) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = root + e.u;
        a.id = input.id + "-r" + i;
        a.setAttribute("role", "option");
        var name = document.createElement("span");
        name.textContent = e.t;
        if (e.k === "function" || e.k === "module") name.className = "mono";
        var kind = document.createElement("span");
        kind.className = "where";
        kind.textContent = e.k;
        a.appendChild(name);
        a.appendChild(kind);
        li.appendChild(a);
        list.appendChild(li);
      });
      active = -1;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("focus", load);
    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (!q) return close();
      load().then(function (entries) { show(rank(entries, q)); });
    });
    input.addEventListener("keydown", function (event) {
      var links = list.querySelectorAll("a");
      if (event.key === "ArrowDown" && links.length) {
        event.preventDefault();
        active = Math.min(active + 1, links.length - 1);
        mark();
      } else if (event.key === "ArrowUp" && links.length) {
        event.preventDefault();
        active = Math.max(active - 1, 0);
        mark();
      } else if (event.key === "Enter") {
        var target = links[active] || links[0];
        if (target) { event.preventDefault(); window.location.href = target.href; }
      } else if (event.key === "Escape") {
        close();
      }
    });
    document.addEventListener("click", function (event) {
      if (!input.closest(".search").contains(event.target)) close();
    });
  });

  // "/" goes to the page's search box, as the hint beside it says.
  document.addEventListener("keydown", function (event) {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    var box = document.querySelector("[data-search]");
    if (box) { event.preventDefault(); box.focus(); }
  });
})();
