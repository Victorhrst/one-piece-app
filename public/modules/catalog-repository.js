(function () {
  "use strict";

  var API = "/api";
  var SOURCE = "https://www.onepieceapi.com/documentation";
  var fruitLorePromise = null;
  var catalogVersion = 0;
  try {
    var storedCatalogVersion = Number(localStorage.getItem("grand-line-catalog-version-v1"));
    if (Number.isSafeInteger(storedCatalogVersion) && storedCatalogVersion > 0) catalogVersion = storedCatalogVersion;
  } catch (_) {}

  function normalized(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function selectedArc(state, data) {
    if (state.progress === null || state.progress < 0) return "-1";
    var arc = (data.arcs || [])[state.progress];
    return arc ? arc.id : "-1";
  }

  function withCatalogVersion(path) {
    return catalogVersion ? path + "&v=" + catalogVersion : path;
  }

  function enrichFruit(record, data, fruitLore) {
    var recordNames = [record.name, record.model].concat(record.aliases || []).map(normalized).filter(Boolean);
    var known = (data.fruits || []).find(function (fruit) {
      var aliases = [fruit.name].concat(fruit.apiNames || []).map(normalized);
      return aliases.some(function (alias) { return recordNames.indexOf(alias) >= 0; });
    });
    var lore = (fruitLore && Object.keys(fruitLore)).map(function (key) { return fruitLore[key]; }).find(function (entry) {
      return [entry.name].concat(entry.aliases || []).some(function (name) { return recordNames.indexOf(normalized(name)) >= 0; });
    }) || null;
    var typeLabel = record.type || (known && known.typeHistory && known.typeHistory[0] && known.typeHistory[0].label) || "Type à confirmer";
    return Object.assign({}, known || {}, record, {
      name: (known && known.name) || (lore && lore.name) || record.name,
      firstSeen: Number(record.knownAt),
      firstChapter: record.firstChapter,
      knownAs: (known && known.knownAs) || record.description || "Description non renseignée dans la source.",
      typeHistory: (known && known.typeHistory) || [{ from: Number(record.knownAt), label: typeLabel }],
      user: (lore && lore.users && lore.users.length && lore.users[0].name) || (known && known.user) || "Utilisateur à confirmer",
      users: lore && Array.isArray(lore.users) ? lore.users : [],
      longDescription: lore && lore.description || null,
      ability: lore && lore.ability || null,
      image: record.image || null,
      imageSource: record.imageSource || record.sourceUrl || SOURCE,
      canonStatus: record.canonStatus || "À confirmer",
      sourceRecordId: record.id,
    });
  }

  function mergeFruitRows(records, data, fruitLore) {
    var mergedFruits = new Map();
    records.map(function (fruit) { return enrichFruit(fruit, data, fruitLore); }).forEach(function (fruit) {
      var key = normalized(fruit.name);
      var existing = mergedFruits.get(key);
      if (!existing) {
        mergedFruits.set(key, fruit);
        return;
      }
      var merged = Object.assign({}, existing, fruit);
      merged.image = fruit.image || existing.image || null;
      merged.longDescription = fruit.longDescription || existing.longDescription || null;
      merged.users = fruit.users && fruit.users.length ? fruit.users : existing.users || [];
      mergedFruits.set(key, merged);
    });
    return Array.from(mergedFruits.values());
  }

  function getFruitLore() {
    if (!fruitLorePromise) fruitLorePromise = getJson("/fruit-lore.json", 5000).catch(function () { return {}; });
    return fruitLorePromise;
  }

  function toCharacter(record) {
    return {
      id: record.id,
      name: record.name,
      role: record.role || record.description || (record.firstChapter ? "Première apparition · ch. " + record.firstChapter : "Personnage"),
      description: record.description || "Fiche de personnage à compléter.",
      group: record.group || "Personnage du manga",
      catalogued: true,
      knownAt: Number(record.knownAt),
      firstChapter: record.firstChapter,
      firstAppearanceChapter: record.firstAppearanceChapter,
      firstRevealChapter: record.firstRevealChapter,
      image: record.image || null,
      imageSource: record.imageSource || SOURCE,
      achievements: Array.isArray(record.achievements) ? record.achievements : [],
      bounties: Array.isArray(record.bounties) ? record.bounties : [],
      greatEmperor: record.greatEmperor === true,
      emperorTitle: record.emperorTitle || null,
      fights: Array.isArray(record.fights) ? record.fights : [],
    };
  }

  function toCrew(record) {
    return {
      id: record.canonicalId || record.id,
      name: record.canonicalName || record.name,
      tag: record.tag || record.kind || "Équipage",
      description: record.description || "Composition recensée à partir des apparitions documentées.",
      image: record.image || null,
      imageSource: record.imageSource || SOURCE,
      greatEmperor: record.greatEmperor === true,
      emperorTitle: record.emperorTitle || null,
      knownAt: Number(record.knownAt),
      achievements: Array.isArray(record.achievements) ? record.achievements : [],
      members: (record.members || []).map(function (member) {
        return {
          id: member.id || null,
          name: member.name,
          role: member.role || "Membre",
          knownAt: Number(member.knownAt),
          image: member.image || null,
          imageSource: member.imageSource || SOURCE,
          description: member.description || null,
        };
      }),
    };
  }

  function toShip(record) {
    return {
      id: String(record.id || ""),
      name: String(record.name || "Navire sans nom"),
      type: record.type || "Type non précisé",
      image: record.image || null,
      imageSource: record.imageSource || null,
      firstChapter: Number(record.firstChapter) || null,
      knownAt: record.knownAt == null || !Number.isInteger(Number(record.knownAt)) ? null : Number(record.knownAt),
      crewId: record.crewId || null,
      affiliationLabel: record.affiliationLabel || null,
      art: record.art || "sailing",
      color: record.color || "#7ca59b",
      description: record.description || "Fiche de navire à compléter.",
      achievements: Array.isArray(record.achievements) ? record.achievements : [],
    };
  }

  async function getJson(path, timeoutMs) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timeout = window.setTimeout(function () { if (controller) controller.abort(); }, timeoutMs || 5000);
    try {
      var response = await fetch(path, {
        headers: { Accept: "application/json" },
        cache: "default",
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
    var payload = await getJson(withCatalogVersion(url), 5000);
    if (selectedArc(state, data) !== arc) return payload;
    if (!payload || !payload.ok || payload.empty) return payload;

    var fruitLore = state.page === "fruits" || state.page === "fruit-detail" ? await getFruitLore() : {};
    if (selectedArc(state, data) !== arc) return payload;

    if (payload.characters && Array.isArray(payload.characters.rows)) {
      state.characters = payload.characters.rows.map(toCharacter);
      state.characterTotal = Number(payload.characters.total) || state.characters.length;
    }
    if (Array.isArray(payload.crews)) state.crews = payload.crews.map(toCrew);
    if (Array.isArray(payload.ships)) state.ships = payload.ships.map(toShip);
    if (payload.fruits && Array.isArray(payload.fruits.rows)) {
      state.fruits = mergeFruitRows(payload.fruits.rows, data, fruitLore);
      state.unclassifiedFruits = Number(payload.fruits.unclassifiedTotal) || 0;
      state.fruitLoreLoaded = state.page === "fruits" || state.page === "fruit-detail";
    }
    state.syncedAt = payload.syncedAt || state.syncedAt;
    return payload;
  }

  async function loadFruitLore(state, data) {
    if (state.fruitLoreLoaded) return false;
    var fruitLore = await getFruitLore();
    if (Array.isArray(state.fruits) && state.fruits.length) state.fruits = mergeFruitRows(state.fruits, data, fruitLore || {});
    state.fruitLoreLoaded = true;
    return true;
  }

  async function loadGuide(state, data) {
    if (state.progress === null || state.progress < 0) return null;
    var arc = selectedArc(state, data);
    var payload = await getJson(withCatalogVersion(API + "/catalog?type=guide&arc=" + encodeURIComponent(arc)), 7000);
    if (selectedArc(state, data) !== arc) return payload;
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
    var payload = await getJson(withCatalogVersion(API + "/catalog?type=characters&arc=" + encodeURIComponent(arc) + "&offset=" + offset), 5000);
    if (selectedArc(state, data) !== arc) return false;
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
    catalogVersion = Math.max(Date.now(), catalogVersion + 1);
    try { localStorage.setItem("grand-line-catalog-version-v1", String(catalogVersion)); } catch (_) {}
    return result;
  }

  window.GRANDLINE_REPOSITORY = { load: load, loadGuide: loadGuide, loadFruitLore: loadFruitLore, loadMoreCharacters: loadMoreCharacters, sync: sync };
})();
