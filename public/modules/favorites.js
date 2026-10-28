window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.favorites = function (context) {
  var { DATA, state, progressArc, escapeHtml, stripMarks, identityKey, heading, pageIcon, progressHint, favoriteButton } = context;
  var categories = [
    { id:"all", label:"Tout" },
    { id:"crew", label:"Équipages" },
    { id:"character", label:"Personnages" },
    { id:"ship", label:"Bateaux" },
    { id:"blade", label:"Lames" },
    { id:"fruit", label:"Fruits du Démon" }
  ];

  function slug(value) {
    return stripMarks(String(value || "")).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  }

  function keyFor(type, item) {
    if (type === "crew") return String(item.id || slug(item.name));
    if (type === "character") return identityKey(item.name);
    if (type === "ship") return String(item.id || slug(item.name));
    if (type === "blade") return slug(item.name);
    return window.GRANDLINE_PAGES.fruitRouteKey(item);
  }

  function visibleCatalog() {
    if (!progressArc()) return [];
    var pages = window.GRANDLINE_PAGES;
    return [
      { type:"crew", label:"Équipage", items:pages.collectCrews() },
      { type:"character", label:"Personnage", items:pages.collectCharacters() },
      { type:"ship", label:"Bateau", items:pages.collectShips() },
      { type:"blade", label:"Lame", items:DATA.blades.filter(function (item) { return item.firstSeen <= state.progress; }) },
      { type:"fruit", label:"Fruit du Démon", items:pages.collectFruits() }
    ];
  }

  function descriptionFor(type, item) {
    if (type === "character") return item.description && item.description !== item.role ? item.description : [item.role, item.group].filter(Boolean).join(" · ");
    if (type === "blade") return item.note || item.kind || "Lame du catalogue";
    if (type === "fruit") return item.longDescription || item.knownAs || item.description || "Fruit du Démon";
    return item.description || item.type || "Fiche du catalogue";
  }

  function metaFor(type, item) {
    if (type === "crew") return item.tag || "Équipage";
    if (type === "character") return [item.role, item.group].filter(Boolean).join(" · ");
    if (type === "ship") return item.type || "Bateau";
    if (type === "blade") return [item.kind, item.gradeKnown !== null && item.gradeKnown > state.progress ? "Grade non révélé" : item.grade].filter(Boolean).join(" · ");
    return window.GRANDLINE_PAGES.currentFruitType(item) || "Fruit du Démon";
  }

  function openAttributes(type, key) {
    if (type === "crew") return 'data-open-crew="' + escapeHtml(key) + '"';
    if (type === "character") return 'data-open-character="' + escapeHtml(key) + '"';
    if (type === "ship") return 'data-open-ship="' + escapeHtml(key) + '"';
    if (type === "fruit") return 'data-open-fruit="' + escapeHtml(key) + '"';
    return 'data-page="blades"';
  }

  function bladeArtwork(blade) {
    var name = String(blade.name || "Lame");
    var id = "favorite-blade-" + slug(name);
    var fallback = '<svg class="favorite-blade-art" viewBox="0 0 160 180" role="img" aria-label="Illustration de ' + escapeHtml(name) + '"><defs><linearGradient id="' + id + '" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#9a8050"/><stop offset=".48" stop-color="#f0e3bc"/><stop offset="1" stop-color="#78958b"/></linearGradient></defs><path d="m77 22 12-12 10 10-12 12 25 82-11 12-32-77-12-1-9-9 8-8 1-12 9-9 9 9z" fill="url(#' + id + ')" stroke="#e3d2a5" stroke-width="3" stroke-linejoin="round"/><path d="m62 110 34 34-8 8-34-34z" fill="#8b5a36" stroke="#e3d2a5" stroke-width="3"/><path d="m54 127 25 25m-14-31 25 25m-9-34 25 25" stroke="#d9bc7b" stroke-width="3" stroke-linecap="round"/><path d="m116 101 14 14-12 12-14-14z" fill="#263c3b" stroke="#e3d2a5" stroke-width="3"/></svg>';
    if (!blade.image) return fallback;
    return '<img class="favorite-blade-image" src="' + escapeHtml(blade.image) + '" alt="" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="favorite-blade-fallback" hidden>' + fallback + '</span>';
  }

  function artworkFor(type, item) {
    var pages = window.GRANDLINE_PAGES;
    if (type === "crew") return pages.crewImage(item,false);
    if (type === "character") return pages.characterImage(item,false);
    if (type === "ship") return pages.shipIllustration(item,false);
    if (type === "blade") return bladeArtwork(item);
    return pages.fruitIllustration(item,DATA.fruits.indexOf(item));
  }

  function favoriteCard(type, label, item, key) {
    var name = type === "fruit" ? window.GRANDLINE_PAGES.fruitDisplayName(item) : item.name;
    var description = descriptionFor(type, item);
    var art = artworkFor(type,item);
    return '<article class="favorite-card"><button type="button" class="favorite-card-open" ' + openAttributes(type,key) + '><span class="favorite-card-art">' + art + '</span><span class="favorite-card-copy"><span class="favorite-card-type">' + escapeHtml(label) + '</span><strong>' + escapeHtml(name) + '</strong><span class="favorite-card-meta">' + escapeHtml(metaFor(type,item)) + '</span><span class="favorite-card-description">' + escapeHtml(description) + '</span><span class="favorite-card-link">' + (type === "blade" ? 'Voir les lames ↗' : 'Ouvrir la fiche ↗') + '</span></span></button>' + favoriteButton(type,key,name,"favorite-card-remove") + '</article>';
  }

  function renderFavorites() {
    var html = heading("TA COLLECTION PERSONNELLE", "Mes favoris", "Retrouve ici les équipages, personnages et trésors que tu veux garder à portée de main.", "☆");
    if (!progressArc()) return html + progressHint();

    var catalogs = visibleCatalog();
    var entries = [];
    state.favorites.forEach(function (favorite) {
      var catalog = catalogs.find(function (group) { return group.type === favorite.type; });
      if (!catalog) return;
      var item = catalog.items.find(function (candidate) { return keyFor(catalog.type,candidate) === favorite.key; });
      if (item) entries.push({type:catalog.type,label:catalog.label,item:item,key:favorite.key});
    });
    var counts = {all:entries.length};
    catalogs.forEach(function (catalog) {
      counts[catalog.type] = entries.filter(function (entry) { return entry.type === catalog.type; }).length;
    });
    if (state.favoriteFilter !== "all" && !counts[state.favoriteFilter]) state.favoriteFilter = "all";
    var query = stripMarks(state.favoriteQuery || "");
    var visible = entries.filter(function (entry) {
      if (state.favoriteFilter !== "all" && entry.type !== state.favoriteFilter) return false;
      if (!query) return true;
      return stripMarks([entry.label,entry.item.name,descriptionFor(entry.type,entry.item),metaFor(entry.type,entry.item)].join(" ")).indexOf(query) >= 0;
    });

    html += '<div class="favorites-intro"><span class="favorites-intro-icon" aria-hidden="true">' + pageIcon("favorites") + '</span><div><strong>' + entries.length + ' favori' + (entries.length > 1 ? 's' : '') + ' dans ta collection</strong><p>Ta sélection reste enregistrée sur cet appareil et suit ton arc de lecture.</p></div></div>';
    html += '<div class="favorites-toolbar"><label class="filter-search favorites-search"><span aria-hidden="true">⌕</span><input type="search" data-favorite-search value="' + escapeHtml(state.favoriteQuery) + '" placeholder="Rechercher dans mes favoris…" aria-label="Rechercher dans mes favoris"></label><div class="favorites-filters" role="group" aria-label="Filtrer les favoris">' + categories.map(function (category) {
      var count = category.id === "all" ? counts.all : counts[category.id];
      if (category.id !== "all" && !count) return "";
      return '<button type="button" class="favorite-filter' + (state.favoriteFilter === category.id ? ' active' : '') + '" data-favorite-filter="' + category.id + '" aria-pressed="' + (state.favoriteFilter === category.id ? 'true' : 'false') + '">' + escapeHtml(category.label) + '<span>' + count + '</span></button>';
    }).join("") + '</div></div>';

    if (!entries.length && state.catalogLoading) {
      html += '<div class="empty-state favorites-empty"><strong>Chargement de ta collection</strong>Les fiches se mettent à jour jusqu’à ' + escapeHtml(progressArc().name) + '.</div>';
    } else if (!entries.length) {
      html += '<div class="empty-state favorites-empty"><span class="favorites-empty-star" aria-hidden="true">' + pageIcon("favorites") + '</span><strong>Ta collection commence ici</strong>Ajoute une fiche avec l’étoile pour la retrouver facilement dans cette page.<div class="favorites-empty-actions"><button class="button-secondary" data-page="crews">Équipages</button><button class="button-secondary" data-page="characters">Personnages</button><button class="button-secondary" data-page="ships">Bateaux</button><button class="button-secondary" data-page="blades">Lames</button><button class="button-secondary" data-page="fruits">Fruits du Démon</button></div></div>';
    } else if (!visible.length) {
      html += '<div class="empty-state favorites-empty"><strong>Aucun résultat</strong>Essaie un autre nom ou une autre catégorie.</div>';
    } else {
      html += '<div class="favorites-grid">' + visible.map(function (entry) { return favoriteCard(entry.type,entry.label,entry.item,entry.key); }).join("") + '</div>';
    }
    html += '<p class="favorites-spoiler-note">Les favoris qui dépassent ton arc de lecture restent masqués jusqu’à ce que tu les débloques.</p>';
    return html;
  }

  return { renderFavorites };
};
