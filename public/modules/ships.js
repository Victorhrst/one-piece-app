window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.ships = function (context) {
  var { DATA, state, progressArc, escapeHtml, stripMarks, filtered, heading, progressHint } = context;
  var shipSource = null;
  var shipProgress = null;
  var shipCatalogCache = null;
  var crewRows = null;
  var crewIndex = new Map();
  var shipArtCache = new Map();

  function collectShips() {
    if (shipSource === state.ships && shipProgress === state.progress && shipCatalogCache) return shipCatalogCache;
    var end = Number(progressArc() && progressArc().chapterEnd) || 0;
    shipCatalogCache = (state.ships || []).filter(function (ship) {
      return Number.isFinite(Number(ship.firstChapter)) && Number(ship.firstChapter) <= end && ship.knownAt !== null && ship.knownAt <= state.progress;
    }).slice().sort(function (a,b) {
      return Number(a.firstChapter) - Number(b.firstChapter) || a.name.localeCompare(b.name,"fr");
    });
    shipSource = state.ships;
    shipProgress = state.progress;
    return shipCatalogCache;
  }

  function shipKey(ship) {
    return String(ship.id || stripMarks(ship.name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
  }

  function arcForChapter(chapter) {
    var number = Number(chapter);
    return DATA.arcs.find(function (arc) { return number >= Number(arc.chapterStart) && number <= Number(arc.chapterEnd); }) || null;
  }

  function visibleCrew(ship) {
    if (!ship.crewId) return null;
    var crews = window.GRANDLINE_PAGES.collectCrews();
    if (crewRows !== crews) {
      crewRows = crews;
      crewIndex = new Map(crews.map(function (crew) { return [String(crew.id), crew]; }));
    }
    return crewIndex.get(String(ship.crewId)) || null;
  }

  function shipIllustration(ship, large) {
    var cacheKey = JSON.stringify([ship.id, ship.name, ship.color, ship.art, ship.image, Boolean(large)]);
    if (shipArtCache.has(cacheKey)) return shipArtCache.get(cacheKey);
    var seed = String(ship.id || ship.name || "ship").split("").reduce(function (value,char) { return (value * 31 + char.charCodeAt(0)) >>> 0; }, 31);
    var sea = "ship-sea-" + seed;
    var sky = "ship-sky-" + seed;
    var hull = "ship-hull-" + seed;
    var sail = "ship-sail-" + seed;
    var accent = escapeHtml(ship.color || "#7ca59b");
    var art = String(ship.art || "sailing");
    var label = escapeHtml(ship.name || "Navire");
    var className = large ? "ship-art ship-art-large" : "ship-art";
    var motif = art === "submarine"
      ? '<path d="M82 127c26-20 168-24 201 0l-7 20c-38 18-155 17-187-1z" fill="url(#' + hull + ')" stroke="#ddc58e" stroke-width="3"/><path d="M167 126v-20h30l17 20" fill="url(#' + hull + ')" stroke="#ddc58e" stroke-width="3"/><path d="M186 105V91m0 3h18" fill="none" stroke="#ddc58e" stroke-width="4" stroke-linecap="round"/><circle cx="113" cy="138" r="5" fill="#d6d9c8"/><circle cx="144" cy="142" r="5" fill="#d6d9c8"/><circle cx="224" cy="141" r="5" fill="#d6d9c8"/><circle cx="254" cy="137" r="5" fill="#d6d9c8"/><path d="M77 130 58 117v34l22-5" fill="' + accent + '" stroke="#ddc58e" stroke-width="3"/>'
      : art === "fish" || art === "shark" || art === "sunfish"
        ? '<path d="M64 135c40-42 143-48 208-19 14 6 25 14 31 23-15 17-35 28-61 33-69 15-143 5-178-18z" fill="url(#' + hull + ')" stroke="#e1cf9e" stroke-width="3"/><path d="m294 139 39-23-4 29 5 24-42-16" fill="' + accent + '" stroke="#e1cf9e" stroke-width="3"/><path d="M93 147c48 15 124 17 176-2" fill="none" stroke="#f5dfaa" stroke-width="3"/><circle cx="273" cy="131" r="4" fill="#192726"/><path d="M239 147q17 10 33 1" fill="none" stroke="#192726" stroke-width="3" stroke-linecap="round"/><path d="M163 118 182 88l18 31" fill="' + accent + '" opacity=".9"/>'
        : '<path d="M61 139h250l-20 39c-66 21-152 18-211-5z" fill="url(#' + hull + ')" stroke="#e3d2a5" stroke-width="3"/><path d="M84 160c51 14 141 15 205-1" fill="none" stroke="#f1d89a" stroke-width="3"/><path d="M113 137V48m89 89V32m82 105V62" stroke="#d6c39b" stroke-width="5" stroke-linecap="round"/><path d="M119 57 165 73l-44 31zm80-16 56 24-55 35zm82 28 36 17-35 27z" fill="url(#' + sail + ')" stroke="#f4e9cc" stroke-width="2"/><path d="M119 110v24m81-25v25m82-20v20" stroke="#e8d9b8" stroke-width="3"/><path d="M202 31h21l-10 14z" fill="' + accent + '"/>';
    if (art === "castle" || art === "ark" || art === "ghost") {
      motif += '<path d="M132 125V100h24V80h34V66h36v45h25v18" fill="#263536" stroke="#d7c99f" stroke-width="3"/><path d="M145 98h12m10-12h12m20-13h14m-43 41h13m30-13h12" stroke="#e5d9b9" stroke-width="3" stroke-linecap="round"/><path d="M177 64V45m32 21V39" stroke="#d7c99f" stroke-width="3"/><path d="M174 46h10l-5 8zm32-7h11l-5 9z" fill="' + accent + '"/>';
    } else if (art === "circus") {
      motif += '<path d="M118 57 165 73l-44 31zm80-16 56 24-55 35z" fill="none" stroke="' + accent + '" stroke-width="7" stroke-dasharray="8 5"/>';
    } else if (art === "sheep" || art === "lion" || art === "whale" || art === "shark" || art === "cat" || art === "fox" || art === "mammoth" || art === "serpent") {
      motif += '<circle cx="296" cy="132" r="15" fill="' + accent + '" stroke="#f2dfb5" stroke-width="3"/><circle cx="291" cy="130" r="2.5" fill="#172324"/><circle cx="301" cy="130" r="2.5" fill="#172324"/><path d="M291 138q5 5 10 0" fill="none" stroke="#172324" stroke-width="2" stroke-linecap="round"/>';
      if (art === "sheep") motif += '<path d="M285 122q-14-13-11 1m33-1q14-13 11 1" fill="none" stroke="#f2dfb5" stroke-width="4" stroke-linecap="round"/>';
      if (art === "lion" || art === "whale" || art === "mammoth") motif += '<path d="M282 125q-9-13-12-7m38 7q9-13 12-7" fill="none" stroke="#f2dfb5" stroke-width="3" stroke-linecap="round"/>';
      if (art === "serpent") motif += '<path d="M286 121q10-11 21 0m-20-4-4-8m22 8 4-8" fill="none" stroke="#f2dfb5" stroke-width="3" stroke-linecap="round"/>';
    } else {
      motif += '<circle cx="296" cy="132" r="14" fill="' + accent + '" stroke="#f2dfb5" stroke-width="3"/><path d="M289 128h14m-12 8h10" stroke="#172324" stroke-width="2" stroke-linecap="round"/>';
    }
    var svg = '<svg class="' + className + '" viewBox="0 0 360 220" role="img" aria-label="Illustration de ' + label + '"><defs><linearGradient id="' + sea + '" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#315c5c"/><stop offset="1" stop-color="#13282d"/></linearGradient><linearGradient id="' + sky + '" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d2aa68"/><stop offset="1" stop-color="#497171"/></linearGradient><linearGradient id="' + hull + '" x1="0" y1="0" x2="0" y2="1"><stop stop-color="' + accent + '"/><stop offset="1" stop-color="#17262a"/></linearGradient><linearGradient id="' + sail + '" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4da"/><stop offset="1" stop-color="#d8c8a2"/></linearGradient></defs><rect width="360" height="220" rx="12" fill="url(#' + sea + ')"/><path d="M0 146c55-16 100-11 153 2s128 6 207-10v82H0z" fill="#142a30" opacity=".64"/><circle cx="298" cy="45" r="24" fill="url(#' + sky + ')" opacity=".8"/><path d="M0 185q43-13 85 0t85 0 85 0 105 0" fill="none" stroke="#83b7ad" stroke-width="3" opacity=".65"/><path d="M12 199q45-13 90 0t90 0 90 0 78 0" fill="none" stroke="#d5b97d" stroke-width="2" opacity=".6"/>' + motif + '<rect x="18" y="16" width="120" height="24" rx="12" fill="#102225" fill-opacity=".76" stroke="#e0c57f" stroke-opacity=".55"/><text x="78" y="32" text-anchor="middle" fill="#f4e6c5" font-size="11" font-family="sans-serif" font-weight="700">' + label + '</text></svg>';
    var markup = !ship.image
      ? svg
      : '<img class="' + className + ' ship-source-image" src="' + escapeHtml(ship.image) + '" alt="Visuel du bateau ' + label + '" ' + (large ? 'decoding="async"' : 'loading="lazy" decoding="async"') + ' onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="ship-art-fallback" hidden>' + svg + '</span>';
    shipArtCache.set(cacheKey, markup);
    return markup;
  }

  function shipCard(ship, compact) {
    var crew = visibleCrew(ship);
    var crewLabel = crew ? crew.name : (ship.affiliationLabel || "Équipage non précisé");
    var description = ship.description || "Fiche de navire à compléter.";
    var preview = description.length > 180 ? description.slice(0,177).trimEnd() + "…" : description;
    return '<article class="ship-card' + (compact ? ' ship-card-compact' : '') + '"><button class="ship-card-open" data-open-ship="' + escapeHtml(shipKey(ship)) + '" aria-label="Ouvrir la fiche du ' + escapeHtml(ship.name) + '"><div class="ship-card-visual">' + shipIllustration(ship,false) + '</div><div class="ship-card-copy"><span class="tag">' + escapeHtml(ship.type) + '</span><h2>' + escapeHtml(ship.name) + '</h2><p>' + escapeHtml(preview) + '</p><span class="ship-card-meta">' + escapeHtml(crewLabel) + ' · chapitre ' + escapeHtml(ship.firstChapter) + '</span><span class="ship-card-link">Ouvrir la fiche complète ↗</span></div></button></article>';
  }

  function renderShips() {
    var html = heading("FLOTTE & NAVIGATION", "Bateaux", "Les navires nommés de One Piece, illustrés et reliés à leurs équipages. Les descriptions et événements suivent ton arc de lecture.", "⛵");
    if (!progressArc()) return html + progressHint();
    var ships = filtered(state.query, collectShips(), function (ship) {
      var crew = visibleCrew(ship);
      return [ship.name, ship.type, ship.description, crew && crew.name, ship.affiliationLabel];
    });
    html += '<div class="collection-summary"><strong>' + ships.length + ' navire' + (ships.length > 1 ? 's' : '') + ' visible' + (ships.length > 1 ? 's' : '') + '</strong><br>Les fiches sont datées et filtrées selon ta progression. Les bateaux ajoutés au catalogue par la source communautaire apparaissent après une actualisation si leur première apparition est documentée.</div>';
    html += '<div class="filter-row catalog-filters ship-catalog-filters"><label class="filter-search"><span aria-hidden="true">⌕</span><input id="shipSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="Nom, type ou équipage…" aria-label="Rechercher un bateau"></label><span class="result-count">' + ships.length + ' fiche' + (ships.length > 1 ? 's' : '') + '</span></div><div class="ship-grid">';
    ships.forEach(function (ship) { html += shipCard(ship,false); });
    if (!ships.length) html += state.catalogLoading
      ? '<div class="empty-state"><strong>Chargement des navires</strong>Le catalogue se met à jour jusqu’à ton arc.</div>'
      : '<div class="empty-state"><strong>Aucun bateau trouvé</strong>Essaie un autre nom ou un autre type.</div>';
    return html + '</div>';
  }

  function renderCrewShips(crewId) {
    var ships = collectShips().filter(function (ship) { return String(ship.crewId || "") === String(crewId); });
    if (!ships.length) return "";
    return '<section class="profile-story crew-ships-section"><div class="section-heading detail-section-heading"><div><h2>Bateaux de l’équipage</h2><p>Les navires et leurs moments marquants, visibles jusqu’à ' + escapeHtml(progressArc().name) + '.</p></div><span class="tag">' + ships.length + ' navire' + (ships.length > 1 ? 's' : '') + '</span></div><div class="ship-related-grid">' + ships.map(function (ship) { return shipCard(ship,true); }).join("") + '</div></section>';
  }

  function renderShipDetail(routeKey) {
    if (!progressArc()) return heading("FICHE DE BATEAU", "Bateau", "Choisis d’abord un arc pour ouvrir les fiches sans spoiler.", "⛵") + progressHint();
    var key = String(routeKey || "");
    var ship = collectShips().find(function (item) { return shipKey(item) === key; });
    if (!ship) return heading("FICHE DE BATEAU", "Fiche indisponible", "Ce navire n’est pas répertorié dans les informations accessibles jusqu’à ton arc.", "⛵") + '<button class="detail-back" data-page="ships">← Retour aux bateaux</button>';
    var crew = visibleCrew(ship);
    var firstArc = arcForChapter(ship.firstChapter) || DATA.arcs[ship.knownAt] || progressArc();
    var crewBadge = crew ? '<button class="ship-crew-link" data-open-crew="' + escapeHtml(String(crew.id)) + '">' + escapeHtml(crew.name) + ' <span aria-hidden="true">↗</span></button>' : '<span>' + escapeHtml(ship.affiliationLabel || "Équipage non précisé") + '</span>';
    var achievements = (Array.isArray(ship.achievements) ? ship.achievements : []).filter(function (event) { return Number(event.chapter) <= Number(progressArc().chapterEnd); }).sort(function (a,b) { return Number(a.chapter)-Number(b.chapter); });
    var timeline = '<section class="profile-story"><div class="section-heading detail-section-heading"><div><h2>Moments importants</h2><p>Repères connus jusqu’à ' + escapeHtml(progressArc().name) + '.</p></div><span class="tag">' + achievements.length + ' repère' + (achievements.length > 1 ? 's' : '') + '</span></div>';
    if (achievements.length) {
      timeline += '<ol class="profile-timeline">' + achievements.map(function (event) {
        var arc = arcForChapter(event.chapter);
        return '<li><span class="profile-timeline-marker"></span><div><span class="profile-timeline-meta">' + escapeHtml(arc ? arc.name : "Manga") + ' · chapitre ' + escapeHtml(event.chapter) + '</span><p>' + escapeHtml(event.text) + '</p></div></li>';
      }).join("") + '</ol>';
    } else {
      timeline += '<div class="fight-empty">Aucun événement daté supplémentaire n’est documenté pour ce navire à ce point du récit.</div>';
    }
    timeline += '</section>';
    var html = '<button class="detail-back" data-page="ships">← Retour aux bateaux</button><section class="detail-hero ship-detail-hero"><div class="ship-detail-visual">' + shipIllustration(ship,true) + '</div><div class="detail-hero-copy"><span class="eyebrow">FICHE DE BATEAU</span><h1>' + escapeHtml(ship.name) + '</h1><p>' + escapeHtml(ship.description) + '</p><div class="detail-badges"><span>' + escapeHtml(ship.type) + '</span><span>Première apparition connue · ' + escapeHtml(firstArc.name) + ' · chapitre ' + escapeHtml(ship.firstChapter) + '</span>' + crewBadge + '</div></div></section>';
    html += '<div class="detail-facts-grid"><article class="detail-fact"><span>Type de navire</span><strong>' + escapeHtml(ship.type) + '</strong></article><article class="detail-fact"><span>Équipage associé</span><strong>' + (crew ? escapeHtml(crew.name) : escapeHtml(ship.affiliationLabel || "Non précisé")) + '</strong></article><article class="detail-fact"><span>Première apparition connue</span><strong>' + escapeHtml(firstArc.name) + ' · chapitre ' + escapeHtml(ship.firstChapter) + '</strong></article></div>';
    html += timeline;
    if (ship.imageSource) html += '<p class="ship-detail-source">Illustration de référence : <a href="' + escapeHtml(ship.imageSource) + '" target="_blank" rel="noreferrer">source du visuel ↗</a>.</p>';
    return html;
  }

  return { collectShips, renderShips, renderShipDetail, renderCrewShips };
};
