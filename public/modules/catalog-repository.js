(function () {
  "use strict";

  var API = "/api";
  var SOURCE = "https://www.onepieceapi.com/documentation";

  function normalized(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function selectedArc(state, data) {
    if (state.progress === null || state.progress < 0) return "-1";
    var arc = (data.arcs || [])[state.progress];
    return arc ? arc.id : "-1";
  }

  function enrichFruit(record, data) {
    var known = (data.fruits || []).find(function (fruit) {
      var aliases = [fruit.name].concat(fruit.apiNames || []).map(normalized);
      return aliases.indexOf(normalized(record.name)) >= 0 || aliases.indexOf(normalized(record.model)) >= 0;
    });
    var typeLabel = record.type || (known && known.typeHistory && known.typeHistory[0] && known.typeHistory[0].label) || "Type à confirmer";
    return Object.assign({}, known || {}, record, {
      name: (known && known.name) || record.name,
      firstSeen: Number(record.knownAt),
      firstChapter: record.firstChapter,
      knownAs: (known && known.knownAs) || record.description || "Description non renseignée dans la source.",
      typeHistory: (known && known.typeHistory) || [{ from: Number(record.knownAt), label: typeLabel }],
      user: (known && known.user) || "Utilisateur à confirmer",
      image: record.image || null,
      imageSource: SOURCE,
      canonStatus: record.canonStatus || "À confirmer",
      sourceRecordId: record.id,
    });
  }

  function toCharacter(record) {
    return {
      id: record.id,
      name: record.name,
      role: record.description || (record.firstChapter ? "Première apparition · ch. " + record.firstChapter : "Personnage"),
      description: record.description || "Fiche de personnage à compléter.",
      group: "Personnage du manga",
      knownAt: Number(record.knownAt),
      firstChapter: record.firstChapter,
      image: record.image || null,
      imageSource: SOURCE,
    };
  }

  function toCrew(record) {
    return {
      id: record.id,
      name: record.name,
      tag: record.kind || "Équipage",
      description: record.description || "Composition recensée à partir des apparitions documentées.",
      image: record.image || null,
      knownAt: Number(record.knownAt),
      members: (record.members || []).map(function (member) {
        return [member.name, member.role || "Membre", Number(member.knownAt)];
      }),
    };
  }

  async function getJson(path, timeoutMs) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, timeoutMs || 5000);
    try {
      var response = await fetch(path, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller ? controller.signal : undefined,
      });
      if (!response.ok) throw new Error("Réponse " + response.status);
      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function load(state, data) {
    if (state.progress === null || state.progress < 0) return null;
    var arc = selectedArc(state, data);
    var url = API + "/catalog?type=summary&arc=" + encodeURIComponent(arc);
    var payload = await getJson(url, 5000);
    if (!payload || !payload.ok || payload.empty) return payload;

    if (payload.characters && Array.isArray(payload.characters.rows)) {
      state.characters = payload.characters.rows.map(toCharacter);
      state.characterTotal = Number(payload.characters.total) || state.characters.length;
    }
    if (Array.isArray(payload.crews)) state.crews = payload.crews.map(toCrew);
    if (payload.fruits && Array.isArray(payload.fruits.rows)) {
      state.fruits = payload.fruits.rows.map(function (fruit) { return enrichFruit(fruit, data); });
      state.unclassifiedFruits = Number(payload.fruits.unclassifiedTotal) || 0;
    }
    state.syncedAt = payload.syncedAt || state.syncedAt;
    return payload;
  }

  async function loadGuide(state, data) {
    if (state.progress === null || state.progress < 0) return null;
    var arc = selectedArc(state, data);
    var payload = await getJson(API + "/catalog?type=guide&arc=" + encodeURIComponent(arc), 7000);
    if (!payload || !payload.ok || payload.empty) return payload;
    if (Array.isArray(payload.episodes)) state.episodes = payload.episodes;
    if (Array.isArray(payload.chapters)) state.chapters = payload.chapters;
    state.syncedAt = payload.syncedAt || state.syncedAt;
    return payload;
  }

  async function loadMoreCharacters(state, data) {
    if (state.progress === null || state.progress < 0 || state.characters.length >= state.characterTotal) return false;
    var offset = state.characters.length;
    var arc = selectedArc(state, data);
    var payload = await getJson(API + "/catalog?type=characters&arc=" + encodeURIComponent(arc) + "&offset=" + offset, 5000);
    var rows = payload && payload.characters && payload.characters.rows;
    if (!Array.isArray(rows) || !rows.length) return false;
    state.characters = state.characters.concat(rows.map(toCharacter));
    state.characterTotal = Number(payload.characters.total) || state.characterTotal;
    return true;
  }

  async function sync() {
    var response = await fetch(API + "/sync", { method: "POST", headers: { Accept: "application/json" }, cache: "no-store" });
    var result = await response.json().catch(function () { return {}; });
    if (!response.ok || result.error) throw new Error(result.error || "La synchronisation n’a pas abouti.");
    return result;
  }

  window.GRANDLINE_REPOSITORY = { load: load, loadGuide: loadGuide, loadMoreCharacters: loadMoreCharacters, sync: sync };
})();
