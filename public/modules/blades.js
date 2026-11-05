window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.blades = function (context) {
  var { DATA, state, progressArc, escapeHtml, stripMarks, safeCharacterName, identityKey, heading, progressHint, favoriteButton, isFavorite } = context;
  var grades = [
    { id:"supreme", label:"Saijō Ō Wazamono", title:"Rang suprême", count:"12", text:"Les lames au sommet du classement." },
    { id:"great", label:"Ō Wazamono", title:"Grand rang", count:"21", text:"Des chefs-d’œuvre de forge, juste sous le rang suprême." },
    { id:"skillful", label:"Ryō Wazamono", title:"Rang supérieur", count:"50", text:"Des lames reconnues pour leur grande qualité." },
    { id:"grade", label:"Wazamono", title:"Rang reconnu", count:"—", text:"Le premier rang des lames classées. Leur nombre total reste inconnu." },
    { id:"unknown", label:"Non classée", title:"Rang non confirmé", count:"?", text:"Un rang inconnu ne signifie pas une lame ordinaire." }
  ];

  function bladeKey(blade) {
    // Preserve existing favorites by keeping the original name-based keys.
    return stripMarks(blade.name).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  }
  function visibleBladeEntries(entries) {
    return (Array.isArray(entries) ? entries : []).filter(function (entry) { return Number.isInteger(entry.from) && entry.from <= state.progress; }).slice().sort(function (a,b) { return a.from - b.from; });
  }
  function collectBlades() {
    return progressArc() ? DATA.blades.filter(function (blade) { return blade.firstSeen <= state.progress; }) : [];
  }
  function lastLabel(entries, field, fallback) {
    var visible = visibleBladeEntries(entries);
    return visible.length ? visible[visible.length - 1][field] || fallback : fallback;
  }
  function currentBladeOwner(blade) {
    return safeCharacterName(lastLabel(blade.ownerHistory,"name","Porteur non documenté")) || "Porteur non révélé";
  }
  function bladeGradeLabel(blade) {
    return blade.gradeKnown !== null && blade.gradeKnown > state.progress ? "Rang non révélé" : blade.grade;
  }
  function bladeGradeId(blade) {
    return (grades.find(function (grade) { return grade.label === bladeGradeLabel(blade); }) || {id:"unknown"}).id;
  }
  function bladeMatchesQuery(blade, query) {
    var fields = [blade.name,blade.kind,blade.note,bladeGradeLabel(blade)].concat(blade.aliases || []);
    visibleBladeEntries(blade.ownerHistory).concat(visibleBladeEntries(blade.smithHistory)).forEach(function (entry) { fields.push(safeCharacterName(entry.name) || ""); });
    visibleBladeEntries(blade.traits).forEach(function (entry) { fields.push(entry.label,entry.text); });
    var haystack = stripMarks(fields.join(" ")).toLowerCase();
    return stripMarks(String(query || "")).toLowerCase().trim().split(/\s+/).every(function (word) { return haystack.indexOf(word) !== -1; });
  }

  function bladeDrawing(blade, large) {
    var key = bladeKey(blade);
    var id = "blade-metal-" + key + (large ? "-large" : "-small");
    var colors = {"wado-ichimonji":"#f4edda","sandai-kitetsu":"#b55c54","shusui":"#a482c7","enma":"#a980cd","ame-no-habakiri":"#e6d7d0","kikoku":"#d7c7a3","yoru":"#ddbf73","soul-solid":"#75c6d5"};
    var accent = colors[key] || "#b7ad8f";
    var black = /yoru|shusui/.test(key);
    var metal = black ? "#506175" : "#dce7eb";
    var motif;
    if (key === "yoru") {
      motif = '<path d="M88 30h13v147l-7 22-6-22Z" fill="url(#' + id + ')" stroke="#d6cba4"/><path d="M47 139q47-19 94 0l-3 10q-44-15-88 0Z" fill="' + accent + '" stroke="#8f743b" stroke-width="2"/><path d="M89 149h11v51H89z" fill="#5a4534" stroke="#ddbf73" stroke-width="2"/><circle cx="94" cy="208" r="8" fill="' + accent + '"/>';
    } else if (/naginata/i.test(blade.kind)) {
      motif = '<path d="m91 92 5 123" stroke="#825c42" stroke-width="8"/><path d="M91 99c-6-35 2-62 27-82 5 28-2 61-20 83Z" fill="url(#' + id + ')" stroke="#dce7eb"/><path d="m82 99 22-2" stroke="' + accent + '" stroke-width="6"/>';
    } else {
      motif = '<path d="M91 157c-2-43 4-92 27-135 2 56-6 104-16 137Z" fill="url(#' + id + ')" stroke="' + (black ? "#9eacba" : "#e9eff1") + '" stroke-width="1.5"/><path d="M99 153c2-39 9-79 16-112" fill="none" stroke="' + (black ? "#283244" : "#8ea3af") + '" stroke-width="2"/><ellipse cx="94" cy="159" rx="19" ry="5" fill="' + accent + '" stroke="#806b46" stroke-width="2"/><path d="m87 164-5 47 13 2 7-48" fill="' + accent + '" stroke="#655949" stroke-width="2"/><path d="m87 170 12 7-14 7 12 7-13 7 11 7" fill="none" stroke="#293442" stroke-width="3"/><path d="m81 211 14 2" stroke="#d6bc7c" stroke-width="5"/>';
    }
    return '<svg class="blade-art" viewBox="0 0 190 235" role="img" aria-label="Évocation illustrée de ' + escapeHtml(blade.name) + '"><defs><linearGradient id="' + id + '" x1="0" x2="1"><stop stop-color="' + metal + '"/><stop offset=".48" stop-color="' + (black ? "#1c2637" : "#ffffff") + '"/><stop offset="1" stop-color="' + metal + '"/></linearGradient></defs><g transform="rotate(28 95 118)">' + motif + '</g></svg>';
  }
  function bladeIllustration(blade, large) {
    var fallback = bladeDrawing(blade,large);
    if (!blade.image) return '<span class="blade-art-fallback">' + fallback + '</span>';
    return '<img class="blade-image" src="' + escapeHtml(blade.image) + '" alt="' + escapeHtml(blade.name) + ' — visuel de référence" ' + (large ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="blade-art-fallback" hidden>' + fallback + '</span>';
  }
  function bladeCard(blade) {
    var key = bladeKey(blade);
    var arc = DATA.arcs[blade.firstSeen];
    var rank = grades.find(function (grade) { return grade.id === bladeGradeId(blade); });
    return '<article class="blade-card" data-grade="' + rank.id + '"><a class="blade-card-open" href="#lame/' + encodeURIComponent(key) + '" data-open-blade="' + key + '" aria-label="Découvrir ' + escapeHtml(blade.name) + '"><div class="blade-visual"><span class="blade-visual-grid" aria-hidden="true"></span><span class="blade-rank-label">' + escapeHtml(rank.title) + '</span>' + bladeIllustration(blade,false) + '<span class="blade-visual-number" aria-hidden="true">' + String(DATA.blades.indexOf(blade) + 1).padStart(2,"0") + '</span></div><div class="blade-card-copy"><div class="blade-card-topline"><span class="blade-type">' + escapeHtml(blade.kind) + '</span><span class="blade-grade">' + escapeHtml(bladeGradeLabel(blade)) + '</span></div><h2>' + escapeHtml(blade.name) + '</h2><p class="blade-note">' + escapeHtml(blade.note) + '</p><div class="blade-card-facts"><span><small>Porteur / détenteur connu</small><strong>' + escapeHtml(currentBladeOwner(blade)) + '</strong></span><span><small>Découverte</small><strong>' + escapeHtml(arc ? arc.name : "Non documentée") + '</strong></span></div><span class="blade-card-link">Découvrir la lame <span aria-hidden="true">↗</span></span></div></a>' + favoriteButton("blade",key,blade.name,"card-favorite") + '</article>';
  }
  function gradeFilters(catalog) {
    var html = '<div class="arsenal-filter-chips" role="group" aria-label="Filtrer par rang"><button type="button" data-rarity="Toutes" class="' + (state.rarity === "Toutes" ? 'is-active' : '') + '" aria-pressed="' + (state.rarity === "Toutes") + '">Toutes les lames <span>' + catalog.length + '</span></button>';
    grades.forEach(function (grade) {
      var count = catalog.filter(function (blade) { return bladeGradeId(blade) === grade.id; }).length;
      html += '<button type="button" data-rarity="' + escapeHtml(grade.label) + '" data-grade="' + grade.id + '" class="' + (state.rarity === grade.label ? 'is-active' : '') + '" aria-pressed="' + (state.rarity === grade.label) + '">' + escapeHtml(grade.id === "unknown" ? "Rang inconnu" : grade.label) + ' <span>' + count + '</span></button>';
    });
    return html + '</div>';
  }
  function gradeGuide() {
    return '<details class="arsenal-guide"' + (state.bladeGuideOpen ? ' open' : '') + '><summary>Comprendre les rangs des Meitō</summary><p>Les Meitō sont des lames renommées. Leur classement décrit la qualité de la lame, sans mesurer à lui seul la puissance de son porteur.</p><div class="arsenal-grade-guide">' + grades.map(function (grade) {
      return '<button type="button" class="arsenal-grade-tile' + (state.rarity === grade.label ? ' is-active' : '') + '" data-grade="' + grade.id + '" data-rarity="' + escapeHtml(grade.label) + '" aria-pressed="' + (state.rarity === grade.label) + '"><b>' + grade.count + '</b><strong>' + escapeHtml(grade.label) + '</strong><span>' + escapeHtml(grade.title) + '</span><p>' + escapeHtml(grade.text) + '</p></button>';
    }).join("") + '</div><p>« Sabre noir » et « lame maudite » décrivent des particularités : ce ne sont pas des rangs supplémentaires.</p></details>';
  }
  function renderBlades() {
    if (!progressArc()) return heading("L’ARSENAL DE GRAND LINE", "Les lames", "Découvre les armes nommées, leur histoire et les bretteurs qui les ont portées.", "⌁") + progressHint();
    var catalog = collectBlades();
    var visible = catalog.filter(function (blade) {
      return (state.rarity === "Toutes" || bladeGradeId(blade) === (grades.find(function (grade) { return grade.label === state.rarity; }) || {}).id)
        && (!state.bladeKind || state.bladeKind === "all" || blade.kind === state.bladeKind)
        && (!state.bladeFavoritesOnly || isFavorite("blade",bladeKey(blade))) && bladeMatchesQuery(blade,state.query);
    });
    var order = ["supreme","great","skillful","grade","unknown"];
    visible.sort(function (a,b) {
      var rank = state.bladeSort === "grade" ? order.indexOf(bladeGradeId(a)) - order.indexOf(bladeGradeId(b)) : state.bladeSort === "discovery" ? a.firstSeen - b.firstSeen || (a.firstChapter || 0) - (b.firstChapter || 0) : 0;
      return rank || a.name.localeCompare(b.name,"fr");
    });
    var kinds = Array.from(new Set(catalog.map(function (blade) { return blade.kind; }))).sort(function (a,b) { return a.localeCompare(b,"fr"); });
    var owners = new Set(catalog.map(currentBladeOwner).filter(function (name) { return !/non (documenté|révélé)/.test(name); })).size;
    var known = catalog.filter(function (blade) { return bladeGradeId(blade) !== "unknown"; }).length;
    var html = '<div class="blade-catalog"><section class="arsenal-hero"><div class="arsenal-hero-copy"><span class="eyebrow">L’ARSENAL DE GRAND LINE</span><h1>Chaque lame<br>porte une <em>histoire.</em></h1><p>Des katanas de l’East Blue aux lames de légende : explore leurs rangs, leurs secrets de forge et les bretteurs qui les ont maniées.</p><span class="arsenal-progress">◈ Informations connues jusqu’à <strong>' + escapeHtml(progressArc().name) + '</strong></span></div><div class="arsenal-hero-art" aria-hidden="true">' + bladeDrawing({name:"Lames de Grand Line",kind:"Katana"},true) + '<span class="arsenal-art-caption">LAMES NOMMÉES · MEITŌ · HÉRITAGES</span></div></section><div class="arsenal-stats"><article><strong>' + catalog.length + '</strong><span>Lames découvertes</span></article><article><strong>' + known + '</strong><span>Rangs identifiés</span></article><article><strong>' + owners + '</strong><span>Porteurs & détenteurs</span></article></div>' + gradeGuide();
    html += '<section aria-label="Catalogue des lames"><div class="arsenal-controls"><label class="filter-search"><span aria-hidden="true">⌕</span><input id="bladeSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="Une lame, un porteur, un forgeron…" aria-label="Rechercher une lame, un porteur ou un forgeron"></label><label>Type d’arme<select id="bladeKind"><option value="all">Tous les types</option>' + kinds.map(function (kind) { return '<option value="' + escapeHtml(kind) + '"' + (state.bladeKind === kind ? ' selected' : '') + '>' + escapeHtml(kind) + '</option>'; }).join("") + '</select></label><label>Trier par<select id="bladeSort"><option value="alpha"' + (state.bladeSort === "alpha" ? ' selected' : '') + '>Nom : A → Z</option><option value="grade"' + (state.bladeSort === "grade" ? ' selected' : '') + '>Rang de la lame</option><option value="discovery"' + (state.bladeSort === "discovery" ? ' selected' : '') + '>Ordre de découverte</option></select></label></div>' + gradeFilters(catalog);
    html += '<div class="arsenal-results"><p role="status" aria-live="polite"><strong>' + visible.length + ' lame' + (visible.length > 1 ? 's' : '') + '</strong> sur ' + catalog.length + ' découverte' + (catalog.length > 1 ? 's' : '') + '</p><div><button type="button" class="arsenal-favorites' + (state.bladeFavoritesOnly ? ' is-active' : '') + '" data-blade-favorites aria-pressed="' + Boolean(state.bladeFavoritesOnly) + '">☆ Mes favoris</button>';
    if (state.query || state.rarity !== "Toutes" || (state.bladeKind && state.bladeKind !== "all") || state.bladeFavoritesOnly) html += '<button type="button" class="arsenal-reset" data-blade-reset>Effacer les filtres ↺</button>';
    html += '</div></div><div class="blade-grid">' + visible.map(bladeCard).join("");
    if (!visible.length) html += '<div class="arsenal-empty"><span aria-hidden="true">⌁</span><h2>Aucune lame trouvée</h2><p>' + (state.bladeFavoritesOnly ? 'Ajoute des lames à tes favoris avec l’étoile sur leur carte, ou élargis tes filtres.' : 'Essaie un autre nom, un autre rang ou un autre type d’arme.') + '</p><button type="button" class="button-primary" data-blade-reset>Afficher toutes mes lames découvertes</button></div>';
    return html + '</div></section><p class="blade-source-note">Un rang inconnu reste inconnu : aucune puissance ni classification n’est déduite. Les porteurs, les forgerons et les événements suivent ton arc de lecture.</p></div>';
  }
  function ownerMarkup(entry, blade) {
    var name = safeCharacterName(entry.name);
    if (!name) return '';
    var pages = window.GRANDLINE_PAGES;
    var character = pages && pages.collectCharacters ? pages.collectCharacters().find(function (item) { return identityKey(item.name) === identityKey(name); }) : null;
    var label = character ? '<button type="button" class="blade-owner-link" data-open-character="' + escapeHtml(identityKey(character.name)) + '" data-return-blade="' + bladeKey(blade) + '">' + escapeHtml(name) + ' <span aria-hidden="true">↗</span></button>' : '<strong>' + escapeHtml(name) + '</strong>';
    var arc = DATA.arcs[entry.from];
    return '<li><span class="blade-owner-avatar" aria-hidden="true">' + escapeHtml(name.slice(0,1)) + '</span><div>' + label + '<small>' + escapeHtml(entry.role || "Porteur / détenteur documenté") + ' · ' + escapeHtml(arc ? arc.name : "Repère connu") + '</small></div></li>';
  }
  function renderCharacterBlades(character) {
    var knownName = identityKey(character.name);
    var blades = collectBlades().filter(function (blade) {
      return visibleBladeEntries(blade.ownerHistory).some(function (entry) {
        var name = safeCharacterName(entry.name);
        return name && identityKey(name) === knownName;
      });
    });
    if (!blades.length) return '';
    return '<section class="blade-section blade-related"><span class="eyebrow">L’ARSENAL DU PERSONNAGE</span><h2>Lames associées</h2><p class="blade-section-intro">Armes portées ou détenues au fil du récit, selon les informations connues à ton arc.</p><div class="blade-grid blade-related-grid">' + blades.map(bladeCard).join("") + '</div></section>';
  }
  function renderBladeDetail(routeKey) {
    if (!progressArc()) return heading("FICHE DE LAME", "Lame", "Choisis ton arc pour découvrir les lames sans spoiler.", "⌁") + progressHint();
    var catalog = collectBlades();
    var blade = catalog.find(function (item) { return bladeKey(item) === String(routeKey || ""); });
    var back = '<button type="button" class="detail-back" data-return-blade-list>← Retour aux lames</button>';
    if (!blade) return heading("FICHE DE LAME", "Fiche indisponible", "Cette lame ne figure pas dans les informations accessibles jusqu’à ton arc.", "⌁") + back;
    var firstArc = DATA.arcs.find(function (arc) { return blade.firstChapter >= arc.chapterStart && blade.firstChapter <= arc.chapterEnd; }) || DATA.arcs[blade.firstSeen] || progressArc();
    var key = bladeKey(blade), grade = bladeGradeId(blade);
    var lore = visibleBladeEntries(blade.lore), traits = visibleBladeEntries(blade.traits), owners = visibleBladeEntries(blade.ownerHistory);
    var smith = safeCharacterName(lastLabel(blade.smithHistory,"name","Forgeron non révélé")) || "Forgeron non révélé";
    var html = '<div class="blade-detail"><nav class="blade-breadcrumb" aria-label="Fil d’Ariane">' + back + '<span aria-hidden="true">/</span><span>' + escapeHtml(blade.name) + '</span></nav><section class="blade-detail-hero" data-grade="' + grade + '"><div class="blade-detail-visual">' + bladeIllustration(blade,true) + '<span class="arsenal-art-caption">' + escapeHtml(blade.kind) + ' · ' + escapeHtml(bladeGradeLabel(blade)) + '</span></div><div class="blade-detail-copy"><span class="eyebrow">LES ARCHIVES DE L’ARSENAL</span><h1>' + escapeHtml(blade.name) + '</h1><p>' + escapeHtml(blade.note) + '</p><div class="detail-badges"><span>' + escapeHtml(blade.kind) + '</span><span>' + escapeHtml(bladeGradeLabel(blade)) + '</span><span>◈ Jusqu’à ' + escapeHtml(progressArc().name) + '</span></div><div class="favorite-detail-row">' + favoriteButton("blade",key,blade.name,"favorite-inline") + '<span>Garder cette lame dans mes favoris</span></div></div></section>';
    html += '<div class="blade-detail-facts"><article><span class="label">Rang de la lame</span><strong>' + escapeHtml(bladeGradeLabel(blade)) + '</strong></article><article><span class="label">Porteur / détenteur connu</span><strong>' + escapeHtml(currentBladeOwner(blade)) + '</strong></article><article><span class="label">Forgeron connu</span><strong>' + escapeHtml(smith) + '</strong></article><article><span class="label">Première apparition</span><strong>' + escapeHtml(firstArc.name) + (blade.firstChapter ? ' · ch. ' + escapeHtml(blade.firstChapter) : '') + '</strong></article></div>';
    html += '<div class="blade-detail-layout"><div class="blade-main"><section class="blade-section"><span class="eyebrow">IDENTITÉ & SAVOIR-FAIRE</span><h2>Ce qui la rend unique</h2><ul class="blade-traits">' + (traits.length ? traits.map(function (trait) { return '<li><strong>' + escapeHtml(trait.label) + '</strong><p>' + escapeHtml(trait.text) + '</p></li>'; }).join("") : '<li><strong>' + escapeHtml(blade.kind) + '</strong><p>' + escapeHtml(blade.note) + '</p></li>') + '</ul></section><section class="blade-section"><span class="eyebrow">UNE LAME, UN PARCOURS</span><h2>Histoire & moments marquants</h2><p class="blade-section-intro">Les repères révélés jusqu’à ' + escapeHtml(progressArc().name) + '.</p><ol class="blade-history">';
    html += lore.length ? lore.map(function (event) {
      var arc = DATA.arcs[event.from];
      return '<li><span class="blade-history-arc">' + escapeHtml(arc ? arc.name : "Repère connu") + (event.chapter ? ' · ch. ' + escapeHtml(event.chapter) : '') + '</span><strong>' + escapeHtml(event.title) + '</strong><p>' + escapeHtml(event.text) + '</p></li>';
    }).join("") : '<li><span class="blade-history-arc">' + escapeHtml(firstArc.name) + '</span><strong>Une lame entre dans l’histoire</strong><p>' + escapeHtml(blade.note) + '</p></li>';
    html += '</ol></section></div><aside class="blade-aside"><section class="blade-section"><span class="eyebrow">DE MAIN EN MAIN</span><h2>Porteurs & détenteurs</h2><p class="blade-section-intro">Personnes associées à cette lame, selon les révélations du récit.</p><ol class="blade-owners">' + owners.map(function (entry) { return ownerMarkup(entry,blade); }).join("") + '</ol></section><section class="blade-section"><h2>État de la lame</h2><p>' + escapeHtml(lastLabel(blade.statusHistory,"label","Statut non documenté")) + '</p><p class="blade-section-intro">Situation connue à ton stade de l’aventure.</p></section><section class="blade-section"><h2>À propos de cette fiche</h2><p class="blade-section-intro">Le rang et l’identité du forgeron restent masqués tant que le récit ne les a pas révélés.</p><p class="blade-source-note">Notice rédigée à partir du manga et des références du One Piece Wiki. Les liens externes peuvent contenir des révélations ultérieures.</p>';
    if (blade.source || blade.imageSource) html += '<a class="blade-reference-link" href="' + escapeHtml(blade.source || blade.imageSource) + '" target="_blank" rel="noopener noreferrer">Consulter la source ↗</a>';
    html += '<p class="blade-source-note">' + (blade.image ? 'Visuel de référence : One Piece Wiki. En cas d’indisponibilité, une évocation illustrée est affichée.' : 'Évocation illustrée de la lame.') + '</p></section></aside></div>';
    var related = catalog.filter(function (item) { return item !== blade; }).map(function (item) {
      return {blade:item,score:(currentBladeOwner(item) === currentBladeOwner(blade) ? 4 : 0) + (bladeGradeId(item) === grade && grade !== "unknown" ? 2 : 0) + (item.kind === blade.kind ? 1 : 0)};
    }).sort(function (a,b) { return b.score - a.score || a.blade.name.localeCompare(b.blade.name,"fr"); }).slice(0,3);
    if (related.length) html += '<section class="blade-section blade-related"><span class="eyebrow">POURSUIVRE L’EXPLORATION</span><h2>D’autres lames à découvrir</h2><div class="blade-grid blade-related-grid">' + related.map(function (entry) { return bladeCard(entry.blade); }).join("") + '</div></section>';
    return html + '<div class="blade-detail-nav">' + back + '</div></div>';
  }
  return { collectBlades, bladeKey, visibleBladeEntries, currentBladeOwner, bladeGradeLabel, bladeGradeId, bladeIllustration, bladeMatchesQuery, bladeCard, renderBlades, renderBladeDetail, renderCharacterBlades };
};
