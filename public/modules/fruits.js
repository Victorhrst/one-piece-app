window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.fruits = function (context) {
  var { DATA, state, progressArc, escapeHtml, stripMarks, safeCharacterName, filtered, heading, progressHint } = context;
  function fruitIllustration(fruit, index) {
    if (fruit.image) {
      var source = fruit.imageSource || "https://www.onepieceapi.com/documentation";
      return '<img class="fruit-source-image" src="' + escapeHtml(fruit.image) + '" alt="Image du ' + escapeHtml(fruit.name) + ' issue de la source" loading="lazy" decoding="async"><a class="fruit-image-credit" href="' + escapeHtml(source) + '" target="_blank" rel="noreferrer">Image de la base One Piece ↗</a>';
    }
    var hash = String(fruit.name || index).split("").reduce(function (value, char) { return (value * 31 + char.charCodeAt(0)) >>> 0; }, 7);
    var hue = hash % 360;
    var colors = ["hsl(" + hue + " 68% 79%)", "hsl(" + hue + " 62% 48%)", "hsl(" + ((hue + 78) % 360) + " 52% 69%)", "hsl(" + ((hue + 155) % 360) + " 46% 54%)"];
    var id = "fruit-skin-" + hash + "-" + index;
    var shape = hash % 3;
    var silhouette = shape === 0
      ? "M110 47 C96 31 84 31 72 42 C54 36 40 51 39 72 C35 99 50 128 73 132 C83 134 91 127 98 127 C107 134 119 133 129 125 C152 106 154 74 141 54 C133 42 121 40 110 47Z"
      : shape === 1
        ? "M103 39 C92 29 79 35 73 48 C55 42 43 56 45 79 C46 99 56 126 76 134 C88 139 96 131 103 127 C111 133 124 133 134 123 C151 106 148 73 137 56 C129 43 116 38 103 39Z"
        : "M106 42 C91 31 81 37 72 49 C57 41 43 53 40 73 C36 97 50 124 68 132 C82 139 94 127 101 127 C111 138 125 132 136 120 C153 101 149 72 138 55 C130 42 118 38 106 42Z";
    var curlOffset = hash % 2 ? 1 : -1;
    return '<svg class="fruit-art" viewBox="0 0 200 170" role="img" aria-label="Illustration générée d’un fruit fantastique pour ' + escapeHtml(fruit.name) + '"><defs><radialGradient id="' + id + '" cx="31%" cy="24%"><stop stop-color="#fff" stop-opacity=".84"/><stop offset=".22" stop-color="' + colors[0] + '"/><stop offset="1" stop-color="' + colors[1] + '"/></radialGradient><pattern id="' + id + '-swirl" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(' + (hash % 28) + ')"><path d="M3 15c0-8 10-11 16-7 6 4 4 13-2 14-5 1-8-4-5-7 2-2 5-1 5 1" fill="none" stroke="' + colors[2] + '" stroke-width="2.4" stroke-linecap="round" opacity=".75"/></pattern></defs><ellipse cx="101" cy="149" rx="47" ry="8" fill="#05090c" opacity=".48"/><path d="' + silhouette + '" fill="url(#' + id + ')" stroke="' + colors[1] + '" stroke-width="2.5"/><path d="' + silhouette + '" fill="url(#' + id + '-swirl)" opacity=".86"/><path d="M102 45 C100 34 102 25 108 19 C114 13 123 16 122 22 C121 28 114 28 112 24" fill="none" stroke="#775039" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M108 25 C123 8 145 10 150 23 C140 36 122 38 108 30Z" fill="' + colors[3] + '" stroke="#6b8a58" stroke-width="2"/><path d="M74 49 C68 63 68 75 73 88 M128 49 C137 63 138 78 134 89" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".28"/><path d="M' + (curlOffset > 0 ? '57' : '119') + ' 92c-11-9-23 1-16 10 6 8 18 1 13-6-3-5-10-2-8 2m35 16c10-9 22 1 15 10-6 8-18 1-13-6 3-5 10-2 8 2" fill="none" stroke="' + colors[2] + '" stroke-width="3" stroke-linecap="round" opacity=".92"/><circle cx="72" cy="58" r="3" fill="#fff" opacity=".72"/></svg>';
  }

  function currentFruitType(fruit) {
    var entries = (fruit.typeHistory || []).filter(function (entry) { return entry.from <= state.progress; });
    return entries.length ? entries[entries.length - 1].label : "Type non confirmé";
  }

  function renderFruits() {
    var html = heading("POUVOIRS & FRUITS", "Fruits du Démon", "Catalogue filtré selon ton arc. Les fiches sans repère d’apparition vérifié restent masquées pour préserver l’anti-spoiler.", "◉");
    if (!progressArc()) return html + progressHint();
    var fruits = DATA.fruits.slice();
    (state.fruits || []).forEach(function (fruit) {
      var index = fruits.findIndex(function (item) { return stripMarks(item.name).replace(/[^a-z0-9]/g, "") === stripMarks(fruit.name).replace(/[^a-z0-9]/g, ""); });
      if (index >= 0) fruits[index] = Object.assign({}, fruits[index], fruit);
      else fruits.push(fruit);
    });
    fruits = fruits.filter(function (fruit) { return Number(fruit.firstSeen) <= state.progress; });
    fruits = filtered(state.query, fruits, function (fruit) {
      return [fruit.name, fruit.knownAs, currentFruitType(fruit), fruit.user];
    });
    html += '<div class="collection-summary"><strong>' + fruits.length + ' fruits et pouvoirs répertoriés</strong><br>Affichage des informations connues jusqu’à ' + escapeHtml(progressArc().name) + '. ' + (state.unclassifiedFruits ? state.unclassifiedFruits + ' entrées de la base attendent une date d’apparition fiable; leurs noms restent cachés.' : 'Les entrées affichées ont un repère narratif classé.') + '</div><div class="fruit-grid">';
    fruits.forEach(function (fruit) {
      var detail = fruit.knownAs || fruit.description || "Description non renseignée dans la source.";
      var user = fruit.user && fruit.user !== "Utilisateur à confirmer" ? safeCharacterName(fruit.user) : "non confirmé dans cette fiche";
      var artwork = fruitIllustration(fruit, DATA.fruits.indexOf(fruit) + (state.fruits || []).indexOf(fruit));
      html += '<article class="fruit-card"><div class="fruit-visual">' + artwork + '</div><div class="fruit-card-copy"><span class="fruit-type">' + escapeHtml(currentFruitType(fruit)) + '</span><h3>' + escapeHtml(fruit.name) + '</h3><p>' + escapeHtml(detail) + '<br>Utilisateur connu : ' + escapeHtml(user) + (fruit.canonStatus ? '<br><span class="fruit-source-status">' + escapeHtml(fruit.canonStatus) + '</span>' : '') + '</p></div></article>';
    });
    if (!fruits.length) html += '<div class="empty-state"><strong>Aucun résultat</strong>Essaie un autre fruit ou utilisateur.</div>';
    return html + '</div>';
  }
  return { currentFruitType, renderFruits };
};
