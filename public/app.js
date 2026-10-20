(function () {
  "use strict";

  var DATA = window.GRANDLINE_DATA;
  var STORAGE_KEY = "grand-line-progress-v1";
  var CACHE_KEY = "grand-line-safe-cache-v1";
  var state = {
    page: "home",
    progress: null,
    episodes: [],
    chapters: [],
    arcs: [],
    swords: [],
    crews: [],
    characters: [],
    fruits: [],
    characterTotal: 0,
    unclassifiedFruits: 0,
    cacheEpisodeMax: 0,
    cacheChapterMax: 0,
    syncedAt: null,
    guideLoadedArc: null,
    guideLoading: false,
    guideMode: "episodes",
    guideLimit: 30,
    characterLimit: 90,
    query: "",
    rarity: "Toutes",
    toastTimer: null,
    loading: false
  };

  function readProgress() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      if (value === null) return null;
      var number = Number(value);
      return Number.isInteger(number) && number >= -1 && number < 100 ? number : null;
    } catch (_) { return null; }
  }

  function readCache() {
    try {
      var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!cache || cache.version !== 1) return;
      state.episodes = Array.isArray(cache.episodes) ? cache.episodes : [];
      state.chapters = Array.isArray(cache.chapters) ? cache.chapters : [];
      state.characters = Array.isArray(cache.characters) ? cache.characters : [];
      state.characterTotal = state.characters.length;
      state.cacheEpisodeMax = Number(cache.episodeMax) || 0;
      state.cacheChapterMax = Number(cache.chapterMax) || 0;
      state.syncedAt = cache.syncedAt || null;
    } catch (_) {}
  }

  function availableArcs() {
    var base = DATA.arcs.slice();
    var lastEpisode = base[base.length - 1].episodeEnd;
    var lastChapter = base[base.length - 1].chapterEnd;
    var groups = {};
    state.episodes.forEach(function (item) {
      var number = episodeNumber(item);
      var title = item && item.arc && plain(item.arc.title).replace(/^Arc\s+/i, "");
      if (!number || number <= lastEpisode || !title) return;
      var normalized = normalizedArcName(title);
      if (base.some(function (arc) { return normalizedArcName(arc.name) === normalized; })) return;
      var key = normalized || title;
      if (!groups[key]) groups[key] = {name:title,saga:plain(item.saga && item.saga.title),episodes:[]};
      groups[key].episodes.push(item);
    });
    var additions = Object.keys(groups).map(function (key) {
      var group = groups[key];
      var numbers = group.episodes.map(episodeNumber).sort(function (a,b) { return a-b; });
      var chapters = [];
      group.episodes.forEach(function (item) {
        var found = String(item.chapter || "").match(/\d+/g) || [];
        found.forEach(function (value) {
          var number = Number(value);
          if (number > 0 && number <= maxKnownChapter()) chapters.push(number);
        });
      });
      var forward = chapters.filter(function (number) { return number > lastChapter; });
      var chapterStart = forward.length ? Math.min.apply(null, forward) : lastChapter + 1;
      var chapterEnd = forward.length ? Math.max.apply(null, forward) : chapterStart;
      var episodeStart = numbers[0];
      var episodeEnd = numbers[numbers.length - 1];
      var volumeStart = chapterVolume(chapterStart);
      var volumeEnd = chapterVolume(chapterEnd);
      return {
        id:"live-" + key.replace(/[^a-z0-9]+/g,"-"),
        name:group.name,
        saga:group.saga || "Nouvel arc",
        chapterStart:chapterStart,
        chapterEnd:chapterEnd,
        episodeStart:episodeStart,
        episodeEnd:episodeEnd,
        volumeStart:volumeStart || base[base.length-1].volumeEnd + 1,
        volumeEnd:volumeEnd || volumeStart || base[base.length-1].volumeEnd + 1,
        live:true
      };
    }).sort(function (a,b) { return a.episodeStart-b.episodeStart; });
    return base.concat(additions);
  }

  function maxKnownChapter() {
    var values = state.chapters.map(chapterNumber).filter(function (number) { return number > 0; });
    return values.length ? Math.max.apply(null, values) : DATA.arcs[DATA.arcs.length-1].chapterEnd;
  }

  function progressArc() {
    if (state.progress === null || state.progress < 0) return null;
    return availableArcs()[state.progress] || DATA.arcs[DATA.arcs.length - 1];
  }

  function maxEpisode() {
    var arc = progressArc();
    return arc ? arc.episodeEnd : 0;
  }

  function maxChapter() {
    var arc = progressArc();
    return arc ? arc.chapterEnd : 0;
  }

  function visibleEpisodes() {
    return state.episodes.filter(function (item) {
      return episodeNumber(item) > 0 && episodeNumber(item) <= maxEpisode();
    }).sort(function (a, b) { return episodeNumber(a) - episodeNumber(b); });
  }

  function visibleChapters() {
    return state.chapters.filter(function (item) {
      return chapterNumber(item) > 0 && chapterNumber(item) <= maxChapter();
    }).sort(function (a, b) { return chapterNumber(a) - chapterNumber(b); });
  }

  function safeCache() {
    var epLimit = maxEpisode();
    var chLimit = maxChapter();
    var safeEpisodes = state.episodes.filter(function (item) {
      return episodeNumber(item) > 0 && episodeNumber(item) <= epLimit;
    });
    var safeChapters = state.chapters.filter(function (item) {
      return chapterNumber(item) > 0 && chapterNumber(item) <= chLimit;
    });
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        version: 1,
        episodeMax: epLimit,
        chapterMax: chLimit,
        episodes: safeEpisodes,
        chapters: safeChapters,
        characters: state.characters.slice(0, 300),
        syncedAt: state.syncedAt
      }));
    } catch (_) {}
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char];
    });
  }

  function plain(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function stripMarks(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // La source API emploie parfois des noms complets avant que le manga ne les révèle.
  // Ces alias conservent l'entrée dans l'index sans exposer une identité prématurément.
  var identityReveals = [
    {key:"luffy",aliases:["Monkey D. Luffy","Luffy"],revealAt:16,earlyName:"Luffy",lateName:"Monkey D. Luffy"},
    {key:"vivi",aliases:["Nefertari Vivi","Vivi","Miss Wednesday"],revealAt:10,earlyName:"Miss Wednesday",lateName:"Nefertari Vivi"},
    {key:"robin",aliases:["Nico Robin","Miss All Sunday"],revealAt:10,earlyName:"Miss All Sunday",lateName:"Nico Robin"},
    {key:"dragon",aliases:["Monkey D. Dragon","Dragon"],revealAt:16,earlyName:"Homme mystérieux",lateName:"Monkey D. Dragon"},
    {key:"garp",aliases:["Monkey D. Garp","Garp"],revealAt:16,earlyName:null,lateName:"Monkey D. Garp"},
    {key:"teach",aliases:["Marshall D. Teach","Teach","Blackbeard","Barbe Noire"],revealAt:16,earlyName:"Barbe Noire",lateName:"Marshall D. Teach"},
    {key:"ace",aliases:["Portgas D. Ace","Ace"],revealAt:21,earlyName:"Ace",lateName:"Portgas D. Ace"},
    {key:"law",aliases:["Trafalgar D. Water Law","Trafalgar Law"],revealAt:26,earlyName:"Trafalgar Law",lateName:"Trafalgar Law"},
    {key:"sanji",aliases:["Vinsmoke Sanji","Sanji"],revealAt:28,earlyName:"Sanji",lateName:"Vinsmoke Sanji"},
    {key:"momonosuke",aliases:["Kozuki Momonosuke","Momonosuke"],revealAt:30,earlyName:"Momonosuke",lateName:"Kozuki Momonosuke"},
    {key:"kuzan",aliases:["Kuzan","Aokiji"],revealAt:31,earlyName:"Aokiji",lateName:"Kuzan"}
  ];

  function identityForName(name) {
    var normalized = stripMarks(name);
    return identityReveals.find(function (identity) {
      return identity.aliases.some(function (alias) { return stripMarks(alias) === normalized; });
    }) || null;
  }

  function identityKey(name) {
    var identity = identityForName(name);
    return identity ? "identity:" + identity.key : stripMarks(name);
  }

  function safeCharacterName(name) {
    var identity = identityForName(name);
    if (!identity) return name;
    if (state.progress < identity.revealAt) return identity.earlyName;
    return identity.lateName || name;
  }

  function episodeNumber(item) {
    var value = item && (item.number || item.episode || item.id);
    var match = String(value == null ? "" : value).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function chapterNumber(item) {
    var value = item && (item.chapter_number || item.chapterNumber || item.number || item.id);
    var match = String(value == null ? "" : value).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function chapterValues(value) {
    if (!value || value === "-") return [];
    var all = String(value).match(/\d+/g) || [];
    return all.map(Number).filter(function (number) {
      return number > 0 && number <= maxChapter();
    }).filter(function (number, index, list) { return list.indexOf(number) === index; });
  }

  function formatChapterValues(values) {
    if (!values.length) return "Épisode hors manga / correspondance à confirmer";
    values.sort(function (a, b) { return a - b; });
    var segments = [];
    var start = values[0];
    var end = values[0];
    for (var i = 1; i < values.length; i += 1) {
      if (values[i] === end + 1) end = values[i];
      else {
        segments.push(start === end ? String(start) : start + "–" + end);
        start = end = values[i];
      }
    }
    segments.push(start === end ? String(start) : start + "–" + end);
    return "Ch. " + segments.join(", ");
  }

  function chapterVolume(number) {
    var found = state.chapters.find(function (item) { return chapterNumber(item) === number; });
    var raw = found && found.tome && (found.tome.tome_number || found.tome.number);
    var parsed = raw == null ? "" : String(raw).match(/\d+/);
    return parsed ? Number(parsed[0]) : null;
  }

  function volumeText(numbers) {
    var volumes = numbers.map(chapterVolume).filter(function (value, index, list) {
      return value !== null && list.indexOf(value) === index;
    }).sort(function (a, b) { return a - b; });
    if (!volumes.length) return "Tome à confirmer";
    if (volumes.length === 1) return "Tome " + volumes[0];
    return "Tomes " + volumes[0] + "–" + volumes[volumes.length - 1];
  }

  function normalizedArcName(value) {
    var text = stripMarks(value).replace(/^(arc|saga)\s+/i, "").replace(/[^a-z0-9]+/g, " ").trim();
    var aliases = {
      "romance dawn":"romance dawn",
      "orange town":"village d orange", "orange":"village d orange", "syrup village":"village de sirop",
      "syrup":"village de sirop", "drum island":"ile de drum", "alabasta arc":"alabasta",
      "arabasta":"alabasta", "sky island":"skypiea", "water 7":"water 7",
      "whiskey peak":"whisky peak", "post war":"apres la guerre", "return to sabaody":"retour a sabaody",
      "thriller bark":"thriller bark", "sabaody archipelago":"archipel sabaody",
      "amazon lily":"amazon lily", "fishman island":"ile des hommes poissons",
      "fish man island":"ile des hommes poissons",
      "fishman island arc":"ile des hommes poissons", "punk hazard":"punk hazard",
      "dressrosa":"dressrosa", "whole cake island":"whole cake island", "whole cake":"whole cake island",
      "reverie":"reverie", "levely":"reverie", "wano":"pays de wano",
      "wano country":"pays de wano", "egghead":"egghead", "egg head":"egghead",
      "elbaph":"elbaph", "elban":"elbaph", "elbaf":"elbaph"
    };
    return aliases[text] || text;
  }

  function episodeArc(item) {
    var number = episodeNumber(item);
    var remoteName = item && item.arc && item.arc.title;
    var normalized = normalizedArcName(remoteName);
    var match = DATA.arcs.find(function (arc) {
      return normalizedArcName(arc.name) === normalized;
    });
    if (match && number <= maxEpisode()) {
      if (match.id === "egghead" && number >= 1156) return DATA.arcs.find(function (arc) { return arc.id === "elbaph"; });
      if (match.id === "elbaph" && number < 1156) return DATA.arcs.find(function (arc) { return arc.id === "egghead"; });
      return match;
    }
    var byRange = DATA.arcs.find(function (arc) { return number >= arc.episodeStart && number <= arc.episodeEnd; });
    if (byRange) return byRange;
    var previous = DATA.arcs.filter(function (arc) { return arc.episodeEnd < number; }).pop();
    return previous || DATA.arcs[0];
  }

  function arcLabelForEpisode(item) {
    var number = episodeNumber(item);
    var remoteName = item && item.arc && item.arc.title;
    var remote = plain(remoteName).replace(/^Arc\s+/i, "");
    var mapped = episodeArc(item);
    if (remote && mapped && mapped.id === "elbaph" && number >= 1156) return "Elbaph";
    if (remote && mapped && mapped.id === "egghead" && number <= 1155) return "Egghead";
    if (remote && !/egg\s*head/i.test(remote) && !/elbaph|elbaf|elban/i.test(remote)) return remote;
    return mapped ? mapped.name : "Arc non renseigné";
  }

  function filtered(query, items, values) {
    var term = stripMarks(query.trim());
    if (!term) return items;
    return items.filter(function (item) {
      return stripMarks(values(item).join(" ")).indexOf(term) !== -1;
    });
  }

  function heading(eyebrow, title, description, symbol) {
    return '<div class="page-title-row"><div><div class="eyebrow">' + escapeHtml(eyebrow) + '</div><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(description) + '</p></div><div class="page-ornament" aria-hidden="true">' + escapeHtml(symbol || "✦") + '</div></div>';
  }

  function progressHint() {
    if (state.progress === null || state.progress < 0) {
      return '<div class="empty-state"><strong>Choisis ton point de départ</strong>Indique le dernier arc que tu as terminé pour débloquer uniquement les fiches que tu peux consulter sans spoiler.<br><br><button class="button-primary" data-action="open-progress">Choisir mon arc <span>→</span></button></div>';
    }
    return "";
  }










































  function pageTitle(page) {
    var titles = {home:"ACCUEIL",guide:"ÉPISODES & CHAPITRES",crews:"ÉQUIPAGES",government:"MARINE & GOUVERNEMENT",blades:"LES LAMES",characters:"PERSONNAGES",fruits:"FRUITS DU DÉMON",sources:"SOURCES"};
    return titles[page] || "ACCUEIL";
  }

  function render() {
    var content = document.getElementById("pageContent");
    var page = state.page;
    var html = page === "home" ? window.GRANDLINE_PAGES.renderHome()
      : page === "guide" ? window.GRANDLINE_PAGES.renderGuide()
      : page === "crews" ? window.GRANDLINE_PAGES.renderCrews()
      : page === "government" ? window.GRANDLINE_PAGES.renderGovernment()
      : page === "blades" ? window.GRANDLINE_PAGES.renderBlades()
      : page === "characters" ? window.GRANDLINE_PAGES.renderCharacters()
      : page === "fruits" ? window.GRANDLINE_PAGES.renderFruits()
      : window.GRANDLINE_PAGES.renderSources();
    content.innerHTML = html;
    document.getElementById("crumbCurrent").textContent = pageTitle(page);
    document.querySelectorAll(".nav-item[data-page]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-page") === page);
    });
    syncLine();
  }

  function syncLine() {
    var line = document.getElementById("syncLine");
    if (state.loading) {
      line.textContent = "Actualisation des données publiques…";
      return;
    }
    var pieces = [];
    if (state.syncedAt) {
      pieces.push("Données actualisées le " + new Date(state.syncedAt).toLocaleString("fr-FR", {dateStyle:"medium",timeStyle:"short"}));
    } else if (state.episodes.length || state.chapters.length) {
      pieces.push("Données enregistrées sur cet appareil");
    } else {
      pieces.push("Guide communautaire · données actualisables à la demande");
    }
    var arc = progressArc();
    if (state.characterTotal || state.characters.length) pieces.push((state.characterTotal || state.characters.length) + " personnages indexés dans la base");
    if (arc && (state.episodes.length || state.chapters.length)) pieces.push(visibleEpisodes().length + " épisodes et " + visibleChapters().length + " chapitres visibles jusqu’à " + arc.name);
    line.textContent = pieces.join(" · ");
  }

  function setPage(page) {
    state.page = page;
    state.query = "";
    state.guideLimit = 30;
    state.characterLimit = 90;
    var search = document.getElementById("globalSearch");
    if (search) search.value = "";
    document.body.classList.remove("menu-open");
    render();
    window.scrollTo({top:0,behavior:"smooth"});
    if (page === "guide") loadGuideCatalog(false);
  }

  function openProgress() {
    var modal = document.getElementById("progressModal");
    var closeButtons = modal.querySelectorAll('[data-action="close-progress"]');
    var mandatory = state.progress === null;
    closeButtons.forEach(function (button) { button.hidden = mandatory; });
    document.getElementById("progressDescription").textContent = mandatory
      ? "Choisis le dernier arc que tu as terminé, ou indique que tu débutes. Le wiki affichera seulement les informations jusqu’à ce point."
      : "Choisis un arc dans la liste. Avancer le repère affichera les informations des arcs suivants; tu peux aussi revenir à un arc antérieur.";
    var select = document.getElementById("progressSelect");
    var selectedValue = state.progress >= 0 ? String(state.progress) : "";
    var arcs = availableArcs();
    select.innerHTML = '<option value="">Choisir un arc…</option>' + arcs.map(function (arc, index) {
      return '<option value="' + index + '">' + escapeHtml(arc.name) + ' · ' + escapeHtml(arc.saga) + '</option>';
    }).join("");
    select.value = selectedValue;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    select.focus();
  }

  function closeProgress() {
    if (state.progress === null) {
      toast("Choisis un arc ou indique que tu débutes pour ouvrir le wiki.");
      return;
    }
    document.getElementById("progressModal").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function saveProgress(beginner) {
    var select = document.getElementById("progressSelect");
    var value = -1;
    if (!beginner) {
      value = Number(select.value);
      if (!Number.isInteger(value) || value < 0 || value >= availableArcs().length) {
        toast("Choisis un arc dans la liste ou indique que tu débutes.");
        select.focus();
        return;
      }
    }
    var previous = state.progress;
    state.progress = value;
    state.guideLoadedArc = null;
    try { localStorage.setItem(STORAGE_KEY, String(value)); } catch (_) {}
    document.getElementById("progressModal").hidden = true;
    document.body.classList.remove("modal-open");
    state.guideLimit = 30;
    safeCache();
    updateProgressPill();
    render();
    if (previous !== null && value > previous) {
      toast("Repère avancé : les informations sont maintenant visibles jusqu’à " + progressArc().name + ".");
    } else {
      toast(value < 0 ? "Mode débutant activé. Les fiches d’histoire restent masquées." : "Repère enregistré jusqu’à " + progressArc().name + ".");
    }
    if (value >= 0) loadLocalCatalog(false);
  }

  function updateProgressPill() {
    var text = document.getElementById("progressPillText");
    var arc = progressArc();
    text.textContent = state.progress === null ? "Choisir mon arc" : (arc ? "Jusqu’à " + arc.name : "Je débute");
  }

  function toast(message) {
    var element = document.getElementById("toast");
    element.textContent = message;
    element.classList.add("show");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () { element.classList.remove("show"); }, 3600);
  }

  async function loadLocalCatalog(showErrors) {
    if (state.progress === null || state.progress < 0) return null;
    try {
      var payload = await window.GRANDLINE_REPOSITORY.load(state, DATA);
      if (payload && payload.syncedAt) {
        state.cacheEpisodeMax = maxEpisode();
        state.cacheChapterMax = maxChapter();
        safeCache();
      }
      render();
      if (state.page === "guide") loadGuideCatalog(false);
      return payload;
    } catch (error) {
      if (showErrors) toast('Les fiches enregistrées ne sont pas joignables pour le moment.');
      return null;
    }
  }

  async function loadGuideCatalog(showErrors) {
    if (state.progress === null || state.progress < 0 || state.guideLoading) return null;
    var arc = DATA.arcs[state.progress];
    if (!arc || state.guideLoadedArc === arc.id) return null;
    state.guideLoading = true;
    if (state.page === "guide") render();
    try {
      var payload = await window.GRANDLINE_REPOSITORY.loadGuide(state, DATA);
      if (payload && payload.ok && !payload.empty) {
        state.guideLoadedArc = arc.id;
        state.cacheEpisodeMax = maxEpisode();
        state.cacheChapterMax = maxChapter();
        safeCache();
      }
      return payload;
    } catch (error) {
      if (showErrors) toast("Le guide détaillé n’est pas joignable pour le moment.");
      return null;
    } finally {
      state.guideLoading = false;
      if (state.page === "guide") render();
    }
  }

  async function updateLive(showToast) {
    if (state.loading) return;
    state.loading = true;
    var button = document.getElementById('updateButton');
    button.disabled = true;
    button.classList.add('is-loading');
    syncLine();
    try {
      var result = await window.GRANDLINE_REPOSITORY.sync();
      state.guideLoadedArc = null;
      await loadLocalCatalog(false);
      state.syncedAt = result.syncedAt || new Date().toISOString();
      safeCache();
      render();
      if (showToast !== false) {
        var counts = result.counts || {};
        var total = Object.keys(counts).reduce(function (sum, key) { return sum + (Number(counts[key]) || 0); }, 0);
        toast(result.skipped ? 'Les données viennent d’être actualisées.' : 'Mise à jour terminée : ' + total + ' fiches de référence importées.');
      }
      if (result.errors && result.errors.length) {
        document.getElementById('syncLine').textContent += ' · Sources indisponibles : ' + result.errors.join(', ') + '.';
      }
    } catch (error) {
      if (showToast !== false) toast(error && error.message ? error.message : 'La mise à jour n’a pas abouti.');
    } finally {
      state.loading = false;
      button.disabled = false;
      button.classList.remove('is-loading');
      syncLine();
    }
  }
  function showSources() {
    setPage("sources");
  }

  var pageContext = { DATA:DATA, state:state, progressArc:progressArc, visibleEpisodes:visibleEpisodes, visibleChapters:visibleChapters, escapeHtml:escapeHtml, stripMarks:stripMarks, safeCharacterName:safeCharacterName, identityKey:identityKey, episodeNumber:episodeNumber, chapterNumber:chapterNumber, chapterValues:chapterValues, formatChapterValues:formatChapterValues, volumeText:volumeText, arcLabelForEpisode:arcLabelForEpisode, filtered:filtered, heading:heading, progressHint:progressHint, plain:plain };
  window.GRANDLINE_PAGES = Object.assign({}, window.GRANDLINE_PAGE_FACTORIES.home(pageContext), window.GRANDLINE_PAGE_FACTORIES.guide(pageContext), window.GRANDLINE_PAGE_FACTORIES.crews(pageContext), window.GRANDLINE_PAGE_FACTORIES.government(pageContext), window.GRANDLINE_PAGE_FACTORIES.blades(pageContext), window.GRANDLINE_PAGE_FACTORIES.characters(pageContext), window.GRANDLINE_PAGE_FACTORIES.fruits(pageContext), window.GRANDLINE_PAGE_FACTORIES.sources(pageContext));

  document.addEventListener("click", function (event) {
    var target = event.target.closest("button,[data-page]");
    if (!target) return;
    if (target.id === "updateButton") {
      updateLive(true);
      return;
    }
    if (target.id === "saveProgress") {
      saveProgress();
      return;
    }
    if (target.id === "beginnerMode") {
      saveProgress(true);
      return;
    }
    if (target.hasAttribute("data-page")) {
      setPage(target.getAttribute("data-page"));
      return;
    }
    if (target.hasAttribute("data-action")) {
      var action = target.getAttribute("data-action");
      if (action === "open-progress") openProgress();
      if (action === "close-progress") closeProgress();
      if (action === "show-sources") showSources();
      return;
    }
    if (target.hasAttribute("data-guide-mode")) {
      state.guideMode = target.getAttribute("data-guide-mode");
      state.guideLimit = 30;
      render();
      return;
    }
    if (target.hasAttribute("data-show-more")) {
      if (state.page === "characters") {
        state.characterLimit += 60;
        if (state.characterLimit > state.characters.length && state.characters.length < state.characterTotal) {
          window.GRANDLINE_REPOSITORY.loadMoreCharacters(state, DATA).then(render).catch(function () { render(); });
        } else render();
      } else {
        state.guideLimit += 30;
        render();
      }
      return;
    }
    if (target.hasAttribute("data-detail")) {
      var detail = target.closest(".catalogue-row").querySelector(".catalogue-detail");
      detail.hidden = !detail.hidden;
      target.textContent = detail.hidden ? "⌄" : "⌃";
      return;
    }
    if (target.hasAttribute("data-rarity")) {
      state.rarity = target.getAttribute("data-rarity");
      render();
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target.id === "globalSearch") {
      state.query = event.target.value;
      if (state.page === "guide") state.guideLimit = 30;
      if (state.page === "characters") state.characterLimit = 90;
      render();
      var global = document.getElementById("globalSearch");
      global.focus();
      global.setSelectionRange(state.query.length, state.query.length);
      return;
    }
    if (["guideSearch","bladeSearch","characterSearch"].indexOf(event.target.id) !== -1) {
      state.query = event.target.value;
      if (state.page === "guide") state.guideLimit = 30;
      if (state.page === "characters") state.characterLimit = 90;
      render();
      var id = event.target.id;
      var input = document.getElementById(id);
      if (input) {
        input.focus();
        input.setSelectionRange(state.query.length, state.query.length);
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      document.getElementById("globalSearch").focus();
    }
    if (event.key === "Escape" && !document.getElementById("progressModal").hidden) closeProgress();
  });

  document.getElementById("mobileMenu").addEventListener("click", function () {
    document.body.classList.toggle("menu-open");
  });
  document.getElementById("progressModal").addEventListener("click", function (event) {
    if (event.target.id === "progressModal") closeProgress();
  });

  state.progress = readProgress();
  readCache();
  updateProgressPill();
  render();
  if (state.progress === null) openProgress();
  else loadLocalCatalog(false);
})();
