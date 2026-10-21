window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.fruits = function (context) {
  var { DATA, state, progressArc, escapeHtml, stripMarks, safeCharacterName, filtered, heading, progressHint } = context;
  var illustrationCache = new Map();
  var fruitSource = null;
  var fruitProgress = null;
  var fruitCatalogCache = null;

  function fruitKey(value) {
    return stripMarks(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function fruitIllustration(fruit, index) {
    var cacheKey = JSON.stringify([fruit.name, fruit.image || "", fruit.imageSource || ""]);
    if (illustrationCache.has(cacheKey)) return illustrationCache.get(cacheKey);
    var sourceImage = "";
    if (fruit.image) {
      var source = fruit.imageSource || "https://www.onepieceapi.com/documentation";
      sourceImage = '<img class="fruit-source-image" src="' + escapeHtml(fruit.image) + '" alt="Visuel de l’œuvre pour ' + escapeHtml(fruit.name) + '" loading="lazy" decoding="async" onerror="this.hidden=true;this.parentElement.querySelector(\'.fruit-art-fallback\').hidden=false"><span class="fruit-image-credit" title="Source : ' + escapeHtml(source) + '">Visuel de l’œuvre · source référencée</span>';
    }
    var hash = String(fruit.name || index).split("").reduce(function (value, char) { return (value * 31 + char.charCodeAt(0)) >>> 0; }, 7);
    var hue = hash % 360;
    var colors = ["hsl(" + hue + " 68% 79%)", "hsl(" + hue + " 62% 48%)", "hsl(" + ((hue + 78) % 360) + " 52% 69%)", "hsl(" + ((hue + 155) % 360) + " 46% 54%)"];
    var id = "fruit-skin-" + hash + "-" + fruitKey(fruit.name || index);
    var shape = hash % 3;
    var silhouette = shape === 0
      ? "M110 47 C96 31 84 31 72 42 C54 36 40 51 39 72 C35 99 50 128 73 132 C83 134 91 127 98 127 C107 134 119 133 129 125 C152 106 154 74 141 54 C133 42 121 40 110 47Z"
      : shape === 1
        ? "M103 39 C92 29 79 35 73 48 C55 42 43 56 45 79 C46 99 56 126 76 134 C88 139 96 131 103 127 C111 133 124 133 134 123 C151 106 148 73 137 56 C129 43 116 38 103 39Z"
        : "M106 42 C91 31 81 37 72 49 C57 41 43 53 40 73 C36 97 50 124 68 132 C82 139 94 127 101 127 C111 138 125 132 136 120 C153 101 149 72 138 55 C130 42 118 38 106 42Z";
    var curlOffset = hash % 2 ? 1 : -1;
    var generated = '<svg class="fruit-art" viewBox="0 0 200 170" role="img" aria-label="Illustration générée d’un fruit fantastique pour ' + escapeHtml(fruit.name) + '"><defs><radialGradient id="' + id + '" cx="31%" cy="24%"><stop stop-color="#fff" stop-opacity=".84"/><stop offset=".22" stop-color="' + colors[0] + '"/><stop offset="1" stop-color="' + colors[1] + '"/></radialGradient><pattern id="' + id + '-swirl" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(' + (hash % 28) + ')"><path d="M3 15c0-8 10-11 16-7 6 4 4 13-2 14-5 1-8-4-5-7 2-2 5-1 5 1" fill="none" stroke="' + colors[2] + '" stroke-width="2.4" stroke-linecap="round" opacity=".75"/></pattern></defs><ellipse cx="101" cy="149" rx="47" ry="8" fill="#05090c" opacity=".48"/><path d="' + silhouette + '" fill="url(#' + id + ')" stroke="' + colors[1] + '" stroke-width="2.5"/><path d="' + silhouette + '" fill="url(#' + id + '-swirl)" opacity=".86"/><path d="M102 45 C100 34 102 25 108 19 C114 13 123 16 122 22 C121 28 114 28 112 24" fill="none" stroke="#775039" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M108 25 C123 8 145 10 150 23 C140 36 122 38 108 30Z" fill="' + colors[3] + '" stroke="#6b8a58" stroke-width="2"/><path d="M74 49 C68 63 68 75 73 88 M128 49 C137 63 138 78 134 89" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".28"/><path d="M' + (curlOffset > 0 ? '57' : '119') + ' 92c-11-9-23 1-16 10 6 8 18 1 13-6-3-5-10-2-8 2m35 16c10-9 22 1 15 10-6 8-18 1-13-6 3-5 10-2 8 2" fill="none" stroke="' + colors[2] + '" stroke-width="3" stroke-linecap="round" opacity=".92"/><circle cx="72" cy="58" r="3" fill="#fff" opacity=".72"/></svg>';
    var markup = fruit.image
      ? sourceImage + '<span class="fruit-art-fallback" hidden>' + generated + '</span>'
      : generated;
    illustrationCache.set(cacheKey, markup);
    return markup;
  }

  function currentFruitType(fruit) {
    var entries = (fruit.typeHistory || []).filter(function (entry) { return entry.from <= state.progress; });
    return entries.length ? entries[entries.length - 1].label : "Type non confirmé";
  }

  function arcForChapter(chapter) {
    var number = Number(chapter);
    if (!number) return null;
    return DATA.arcs.find(function (arc) { return number >= Number(arc.chapterStart) && number <= Number(arc.chapterEnd); }) || null;
  }

  function safeOwnerName(name) {
    var original = String(name || "");
    var parentheses = original.match(/\(([^)]+)\)/);
    if (parentheses) {
      var safeAlias = safeCharacterName(parentheses[1]);
      if (safeAlias !== parentheses[1]) return safeAlias;
    }
    return safeCharacterName(original);
  }

  function visibleFruitUsers(fruit) {
    var users = Array.isArray(fruit.users) ? fruit.users.slice() : [];
    if (!users.length && fruit.user && !/à confirmer|inconnu/i.test(fruit.user)) {
      users.push({ name:fruit.user, chapter:Number(fruit.firstChapter), role:"Utilisateur connu" });
    }
    return users.filter(function (user) {
      var chapter = Number(user.chapter) || Number(fruit.firstChapter);
      var revealArc = arcForChapter(chapter);
      var knownAt = revealArc ? DATA.arcs.indexOf(revealArc) : Number(fruit.firstSeen);
      return knownAt <= state.progress;
    }).sort(function (a, b) { return (Number(a.chapter) || 0) - (Number(b.chapter) || 0); }).map(function (user) {
      return Object.assign({},user,{displayName:safeOwnerName(user.name)});
    });
  }

  function describeFruit(fruit) {
    var detailed = fruit.longDescription || fruit.knownAs || fruit.description;
    if (detailed && detailed !== "Description non renseignée dans la source.") return detailed;
    var type = currentFruitType(fruit);
    var model = fruit.model || "";
    if (/zoan/i.test(type) && model && !/inconnu|à confirmer/i.test(model)) {
      return "Ce Zoan permet à son utilisateur de prendre une forme correspondant au modèle " + model + " ainsi qu’une forme hybride. Ces transformations donnent accès aux caractéristiques physiques de l’animal, comme sa taille, sa mobilité ou ses capacités naturelles.";
    }
    if (/logia/i.test(type)) {
      return "Ce Logia est lié à un élément ou à une matière naturelle. Son utilisateur peut en produire, en contrôler et transformer son corps en cette matière, selon les limites montrées dans l’œuvre.";
    }
    if (/zoan/i.test(type)) {
      return "Le modèle précis de ce Zoan n’est pas confirmé dans cette fiche. Le pouvoir relève de la transformation animale; les informations visibles ici s’arrêtent à ce qui est établi à l’arc choisi.";
    }
    return "Ce fruit confère une capacité singulière. La description des effets et des limites s’appuie sur les éléments répertoriés dans l’œuvre et reste volontairement prudente lorsque le pouvoir n’a pas été détaillé.";
  }

  function collectFruits() {
    if (fruitSource === state.fruits && fruitProgress === state.progress && fruitCatalogCache) return fruitCatalogCache;
    var fruits = DATA.fruits.slice();
    (state.fruits || []).forEach(function (fruit) {
      var index = fruits.findIndex(function (item) { return stripMarks(item.name).replace(/[^a-z0-9]/g, "") === stripMarks(fruit.name).replace(/[^a-z0-9]/g, ""); });
      if (index >= 0) fruits[index] = Object.assign({}, fruits[index], fruit);
      else fruits.push(fruit);
    });
    fruitSource = state.fruits;
    fruitProgress = state.progress;
    fruitCatalogCache = fruits.filter(function (fruit) { return Number(fruit.firstSeen) <= state.progress; });
    return fruitCatalogCache;
  }

  function renderFruits() {
    var html = heading("POUVOIRS & FRUITS", "Fruits du Démon", "Catalogue filtré selon ton arc. Les fiches sans repère d’apparition vérifié restent masquées pour préserver l’anti-spoiler.", "◉");
    if (!progressArc()) return html + progressHint();
    var fruits = collectFruits();
    fruits = filtered(state.query, fruits, function (fruit) {
      return [fruit.name, fruit.knownAs, fruit.longDescription, currentFruitType(fruit)].concat(visibleFruitUsers(fruit).map(function (user) { return user.displayName; }));
    });
    html += '<div class="collection-summary"><strong>' + fruits.length + ' fruits et pouvoirs répertoriés</strong><br>Affichage des informations connues jusqu’à ' + escapeHtml(progressArc().name) + '. ' + (state.unclassifiedFruits ? state.unclassifiedFruits + ' entrées de la base attendent une date d’apparition fiable; leurs noms restent cachés.' : 'Les entrées affichées ont un repère narratif classé.') + '</div><div class="fruit-grid">';
    fruits.forEach(function (fruit) {
      var detail = describeFruit(fruit);
      var cardDescription = detail.length > 156 ? detail.slice(0, 153).trimEnd() + "…" : detail;
      var users = visibleFruitUsers(fruit);
      var userLabel = users.length ? users.map(function (user) { return user.displayName; }).join(", ") : "non confirmé dans les sources consultées";
      var artwork = fruitIllustration(fruit, DATA.fruits.indexOf(fruit) + (state.fruits || []).indexOf(fruit));
      html += '<article class="fruit-card"><button class="fruit-card-open" data-open-fruit="' + escapeHtml(fruitKey(fruit.name)) + '" aria-label="Ouvrir la fiche du ' + escapeHtml(fruit.name) + '"><div class="fruit-visual">' + artwork + '</div><div class="fruit-card-copy"><span class="fruit-type">' + escapeHtml(currentFruitType(fruit)) + '</span><h3>' + escapeHtml(fruit.name) + '</h3><p>' + escapeHtml(cardDescription) + '<br>Utilisateur' + (users.length > 1 ? 's connus' : ' connu') + ' : ' + escapeHtml(userLabel) + (fruit.canonStatus ? '<br><span class="fruit-source-status">' + escapeHtml(fruit.canonStatus) + '</span>' : '') + '</p><span class="fruit-card-link">Ouvrir la fiche complète ↗</span></div></button></article>';
    });
    if (!fruits.length) html += '<div class="empty-state"><strong>Aucun résultat</strong>Essaie un autre fruit ou utilisateur.</div>';
    return html + '</div>';
  }

  function renderFruitDetail(routeKey) {
    if (!progressArc()) return heading("FICHE FRUIT DU DÉMON", "Fruit du Démon", "Choisis d’abord un arc pour ouvrir une fiche sans spoiler.", "◉") + progressHint();
    var fruit = collectFruits().find(function (item) { return fruitKey(item.name) === String(routeKey || ""); });
    if (!fruit) return heading("FICHE FRUIT DU DÉMON", "Fiche indisponible", "Ce fruit n’est pas répertorié dans les informations accessibles jusqu’à ton arc.", "◉") + '<button class="detail-back" data-page="fruits">← Retour aux fruits du Démon</button>';
    var users = visibleFruitUsers(fruit);
    var firstArc = arcForChapter(fruit.firstChapter) || DATA.arcs[Number(fruit.firstSeen)] || progressArc();
    var type = currentFruitType(fruit);
    var art = fruitIllustration(fruit, DATA.fruits.indexOf(fruit));
    var description = describeFruit(fruit);
    var userHtml = users.length
      ? '<div class="fruit-detail-user-list">' + users.map(function (user) {
          var userArc = arcForChapter(user.chapter) || firstArc;
          return '<article class="fruit-user-card"><span class="fruit-user-icon" aria-hidden="true">◎</span><span><strong>' + escapeHtml(user.displayName) + '</strong><small>' + escapeHtml(user.role || "Utilisateur connu") + (userArc ? ' · révélé dans ' + escapeHtml(userArc.name) : '') + '</small></span></article>';
        }).join("") + '</div>'
      : '<div class="empty-state"><strong>Aucun utilisateur confirmé</strong>Les sources consultées ne permettent pas encore d’attribuer ce fruit à une personne précise.</div>';
    var html = '<button class="detail-back" data-page="fruits">← Retour au catalogue</button><section class="detail-hero fruit-detail-hero"><div class="fruit-detail-visual">' + art + '</div><div class="detail-hero-copy"><span class="eyebrow">FICHE FRUIT DU DÉMON</span><h1>' + escapeHtml(fruit.name) + '</h1><p>' + escapeHtml(description) + '</p><div class="detail-badges"><span>' + escapeHtml(type) + '</span><span>Première mention connue · ' + escapeHtml(firstArc.name) + (fruit.firstChapter ? ' · chapitre ' + escapeHtml(fruit.firstChapter) : '') + '</span></div></div></section>';
    html += '<section class="fruit-detail-section"><div class="section-heading detail-section-heading"><div><h2>Utilisateurs connus</h2><p>Les détenteurs ne sont affichés qu’à partir de leur révélation dans l’histoire.</p></div><span class="tag">' + users.length + ' fiche' + (users.length > 1 ? 's' : '') + '</span></div>' + userHtml + '</section>';
    html += '<div class="detail-facts-grid"><article class="detail-fact"><span>Type connu à cet arc</span><strong>' + escapeHtml(type) + '</strong></article><article class="detail-fact"><span>Première mention recensée</span><strong>' + escapeHtml(firstArc.name) + (fruit.firstChapter ? ' · ch. ' + escapeHtml(fruit.firstChapter) : '') + '</strong></article><article class="detail-fact"><span>Statut de la fiche</span><strong>' + escapeHtml(fruit.canonStatus || "Canon manga") + '</strong></article></div>';
    if (fruit.sourceUrl || fruit.image) html += '<p class="fruit-detail-source">Données de catalogue : <a href="' + escapeHtml(fruit.sourceUrl || fruit.imageSource || "https://www.onepieceapi.com/documentation") + '" target="_blank" rel="noreferrer">source de référence ↗</a>. Les visuels de l’œuvre sont crédités à leur base de référence.</p>';
    return html;
  }

  return { currentFruitType, renderFruits, renderFruitDetail };
};
