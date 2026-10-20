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
    var colors = ["hsl(" + hue + " 56% 75%)", "hsl(" + hue + " 48% 43%)", "hsl(" + ((hue + 72) % 360) + " 38% 68%)"];
    var id = "fruit-skin-" + hash;
    return '<svg class="fruit-art" viewBox="0 0 180 150" role="img" aria-label="Illustration stylisée du ' + escapeHtml(fruit.name) + '"><defs><radialGradient id="' + id + '" cx="33%" cy="28%"><stop stop-color="#fff" stop-opacity=".72"/><stop offset=".3" stop-color="' + colors[0] + '"/><stop offset="1" stop-color="' + colors[1] + '"/></radialGradient></defs><ellipse cx="91" cy="131" rx="49" ry="8" fill="#070d10" opacity=".32"/><path d="M90 36 C76 19 55 28 45 43 C28 66 36 111 63 123 C76 129 86 120 91 119 C98 121 108 129 121 122 C147 108 151 66 134 44 C122 27 103 20 90 36Z" fill="url(#' + id + ')" stroke="' + colors[1] + '" stroke-width="2"/><path d="M54 49 C45 63 46 94 58 106M69 40 C61 60 64 96 76 116M112 40 C122 60 119 96 106 116M130 51 C138 68 134 94 124 105" fill="none" stroke="' + colors[2] + '" stroke-width="4" stroke-linecap="round" opacity=".85"/><path d="M88 35 C88 26 87 19 92 13" fill="none" stroke="#76523a" stroke-width="6" stroke-linecap="round"/><path d="M93 21 C106 7 125 9 130 19 C119 29 105 30 93 25Z" fill="' + colors[2] + '" stroke="#638158" stroke-width="1.5"/><path d="M59 57c8-8 16-7 19 1s-2 14-10 13-11-7-7-14zm38 27c8-8 16-7 19 1s-2 14-10 13-11-7-7-14z" fill="none" stroke="' + colors[2] + '" stroke-width="2.2" opacity=".9"/><circle cx="65" cy="54" r="3" fill="#fff" opacity=".68"/></svg>';
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
    html += '<div class="collection-summary">Affichage des informations connues jusqu’à ' + escapeHtml(progressArc().name) + '. ' + (state.unclassifiedFruits ? state.unclassifiedFruits + ' entrées de la base attendent une date d’apparition fiable; leurs noms restent cachés.' : 'Les entrées affichées ont un repère narratif classé.') + '</div><div class="fruit-grid">';
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
