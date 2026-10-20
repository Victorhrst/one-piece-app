window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.blades = function (context) {
  var { DATA, state, progressArc, escapeHtml, safeCharacterName, filtered, heading, progressHint } = context;
  function currentBladeOwner(blade) {
    var entries = blade.ownerHistory.filter(function (entry) { return entry.from <= state.progress; });
    return entries.length ? safeCharacterName(entries[entries.length - 1].name) : "Porteur non connu à cet arc";
  }

  function bladeGradeLabel(blade) {
    return blade.gradeKnown !== null && blade.gradeKnown > state.progress ? "Grade pas encore connu à ton arc" : blade.grade;
  }

  function bladeIllustration(blade) {
    var image = blade.image || "";
    var source = blade.imageSource || "https://onepiece.fandom.com/wiki/Category:Weapon_Images";
    return '<img class="blade-image" src="' + escapeHtml(image) + '" alt="Visuel de ' + escapeHtml(blade.name) + ' dans One Piece" loading="lazy" decoding="async"><a class="blade-image-credit" href="' + escapeHtml(source) + '" target="_blank" rel="noreferrer">Image de la wiki One Piece ↗</a>';
  }



  function renderBlades() {
    var html = heading("CATALOGUE DES MEITO", "Les lames", "Lames nommées, catégories de rareté et porteurs connus. Une classe n’apparaît qu’à partir de l’arc où elle a été révélée.", "⌁");
    if (!progressArc()) return html + progressHint();
    var blades = DATA.blades.filter(function (blade) { return blade.firstSeen <= state.progress; });
    if (state.rarity !== "Toutes") blades = blades.filter(function (blade) {
      if (blade.gradeKnown !== null && blade.gradeKnown > state.progress) return state.rarity === "Non classée";
      return blade.grade === state.rarity;
    });
    blades = filtered(state.query, blades, function (blade) {
      return [blade.name, blade.kind, bladeGradeLabel(blade), currentBladeOwner(blade), blade.note];
    });
    var grades = ["Toutes","Saijō Ō Wazamono","Ō Wazamono","Ryō Wazamono","Wazamono","Non classée"];
    html += '<div class="collection-summary">Les grades Meitō classent la qualité et la renommée des lames; ce classement ne mesure pas à lui seul la force de leur porteur. Si un grade n’a pas été révélé à ton arc, il reste masqué.</div><section class="rarity-guide" aria-label="Explication des grades de lames"><article><strong>Saijō Ō Wazamono</strong><span>Rang suprême · 12 lames</span><p>Le sommet du classement des Meitō.</p></article><article><strong>Ō Wazamono</strong><span>Grand rang · 21 lames</span><p>Juste sous le rang suprême.</p></article><article><strong>Ryō Wazamono</strong><span>Rang habile · 50 lames</span><p>Des lames reconnues de grande qualité.</p></article><article><strong>Wazamono</strong><span>Rang reconnu</span><p>Un grade inférieur aux trois rangs précédents; le nombre total n’est pas précisé ici.</p></article><article class="rarity-unranked"><strong>Non classée</strong><span>Pas un grade de rareté</span><p>Le rang de cette lame n’est pas confirmé; cela ne veut pas dire qu’elle est ordinaire.</p></article></section><div class="blade-toolbar"><label class="filter-search"><span>⌕</span><input id="bladeSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="Rechercher une lame ou un porteur…"></label><div class="rarity-legend">';
    grades.forEach(function (grade) {
      html += '<button class="rarity-filter ' + (state.rarity === grade ? "active" : "") + '" data-rarity="' + escapeHtml(grade) + '">' + escapeHtml(grade) + '</button>';
    });
    html += '</div></div><div class="blade-grid">';
    blades.forEach(function (blade) {
      var gradeVisible = blade.gradeKnown === null || blade.gradeKnown <= state.progress;
      var grade = bladeGradeLabel(blade);
      html += '<article class="blade-card"><div class="blade-visual">' + bladeIllustration(blade, DATA.blades.indexOf(blade)) + '</div><div class="blade-card-copy"><div class="blade-type">' + escapeHtml(blade.kind) + '</div><h3>' + escapeHtml(blade.name) + '</h3><span class="blade-grade ' + (gradeVisible ? "" : "unknown") + '">' + escapeHtml(grade) + '</span><p class="blade-owner">Porteur à ton stade : <strong>' + escapeHtml(currentBladeOwner(blade)) + '</strong></p><p class="blade-note">' + escapeHtml(blade.note) + '</p></div></article>';
    });
    if (!blades.length) html += '<div class="empty-state"><strong>Aucune lame dans cette catégorie</strong>Essaie un autre filtre.</div>';
    html += '</div>';
    return html;
  }
  return { currentBladeOwner, bladeGradeLabel, bladeIllustration, renderBlades };
};
