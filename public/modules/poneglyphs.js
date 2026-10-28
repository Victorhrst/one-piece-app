window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.poneglyphs = function (context) {
  var { DATA, state, progressArc, escapeHtml, filtered, heading, progressHint } = context;

  function arcIndex(id) {
    return DATA.arcs.findIndex(function (arc) { return arc.id === id; });
  }

  var findings = [
    { id:"alabasta-tomb", arc:"alabasta", place:"Alabasta", subplace:"Tombe royale d’Alubarna", kind:"classique", title:"Sous la tombe royale", note:"Robin y lit une inscription ancienne. La pierre reste à son emplacement.", signal:"Lecture de Robin", mark:"✦" },
    { id:"shandora-bell", arc:"skypiea", place:"Skypiea", subplace:"Clocher d’or de Shandora", kind:"classique", title:"Au sommet de Shandora", note:"Une stèle est découverte près du clocher d’or et Robin en lit l’inscription.", signal:"Inscription déchiffrée", mark:"☼" },
    { id:"fishman-seaforest", arc:"fishman-island", place:"Île des Hommes-Poissons", subplace:"Forêt marine", kind:"classique", title:"Un message au fond de la mer", note:"Robin découvre un message ancien sur cette pierre. Son contenu n’est affiché qu’à partir de cet arc.", signal:"Message lu par Robin", mark:"≈" },
    { id:"zou-road", arc:"zou", place:"Zou", subplace:"Forêt de la Baleine", kind:"road", title:"La pierre de la Forêt de la Baleine", note:"Robin déchiffre un premier repère de route. La stèle demeure dans la forêt, protégée par les Minks.", signal:"Repère relevé", mark:"⌖" },
    { id:"wholecake-road", arc:"whole-cake-island", place:"Totto Land", subplace:"Salle du trésor de Whole Cake", kind:"road", title:"La pierre de la salle du trésor", note:"Brook et Pedro rapportent une copie de cette pierre rouge.", signal:"Copie rapportée", mark:"⌖" },
    { id:"wholecake-stone-a", arc:"whole-cake-island", place:"Totto Land", subplace:"Salle du trésor de Whole Cake", kind:"other", title:"Une autre stèle de la salle", note:"Brook rapporte aussi une copie de chacune des deux autres stèles conservées dans la salle.", signal:"Copie rapportée", mark:"◈" },
    { id:"wholecake-stone-b", arc:"whole-cake-island", place:"Totto Land", subplace:"Salle du trésor de Whole Cake", kind:"other", title:"La troisième stèle du trésor", note:"Cette pierre fait partie des trois copies obtenues par Brook dans la salle du trésor.", signal:"Copie rapportée", mark:"◈" },
    { id:"wano-orochi-stone", arc:"wano", place:"Pays de Wano", subplace:"Sous-sol du château d’Orochi", kind:"other", title:"La pierre du sous-sol", note:"Une stèle classique est repérée dans les profondeurs du château. L’équipage en apprend l’existence pendant son exploration de Wano.", signal:"Découverte signalée", mark:"◈" },
    { id:"wano-onigashima-stone", arc:"wano", place:"Pays de Wano", subplace:"Sous Onigashima", kind:"other", title:"La pierre des galeries souterraines", note:"Law repère une stèle classique pendant l’alliance à Onigashima. Elle est consignée ici parmi les découvertes de leur expédition commune.", signal:"Découverte de l’alliance", mark:"◈" },
    { id:"wano-road", arc:"wano", place:"Pays de Wano", subplace:"Ancien Wano, au pied du mont Fuji", kind:"road", title:"La pierre sous le mont Fuji", note:"L’emplacement du troisième repère de route est découvert à Wano. Robin peut en relever une copie.", signal:"Copie relevée", mark:"⌖" }
  ];

  var roadClues = [
    { id:"zou", holder:"Zou", reveal:"zou", updateArc:"zou", place:"Forêt de la Baleine", status:"Lue par Robin", note:"Le premier repère est déchiffré à Zou.", copyArc:"zou", mark:"⌖" },
    { id:"big-mom", holder:"Big Mom", reveal:"zou", updateArc:"whole-cake-island", place:"Emplacement précis révélé à Whole Cake", status:"Copie obtenue", note:"La copie de la pierre conservée par Big Mom est rapportée pendant l’expédition à Totto Land.", copyArc:"whole-cake-island", mark:"◈" },
    { id:"kaido", holder:"Kaido", reveal:"zou", updateArc:"wano", place:"Emplacement précis révélé à Wano", status:"Copie obtenue", note:"Le repère est retrouvé à Wano et son inscription est copiée.", copyArc:"wano", mark:"◈" },
    { id:"fourth", holder:"Dernière piste", reveal:"zou", updateArc:"zou", place:"Emplacement inconnu", status:"À localiser", note:"Quatre pierres de route sont nécessaires pour suivre la piste. La dernière reste à retrouver.", copyArc:null, mark:"?" }
  ];

  function visibleRoadClues() {
    var current = state.progress;
    return roadClues.filter(function (clue) { return arcIndex(clue.reveal) <= current; }).map(function (clue) {
      var updated = arcIndex(clue.updateArc) <= current;
      return Object.assign({}, clue, { displayPlace:updated ? clue.place : (clue.holder === "Zou" ? clue.place : "Emplacement précis à découvrir"), displayStatus:clue.copyArc && arcIndex(clue.copyArc) <= current ? clue.status : (clue.id === "fourth" ? "À localiser" : "À retrouver") });
    });
  }

  function renderRoadAtlas() {
    var clues = visibleRoadClues();
    if (!clues.length) return "";
    var copies = clues.filter(function (clue) { return clue.copyArc && arcIndex(clue.copyArc) <= state.progress; }).length;
    var outstanding = clues.length - copies;
    return '<section class="poneglyph-route" aria-labelledby="poneglyphRouteTitle"><div class="poneglyph-section-heading"><div><span class="eyebrow">CARNET DES QUATRE PIERRES</span><h2 id="poneglyphRouteTitle">La route vers la dernière île</h2><p>Chaque pierre ajoute un repère. Une copie suffit : les stèles restent à leur place.</p></div><div class="poneglyph-route-count"><strong>' + copies + '<span>/4</span></strong><small>copies consignées</small></div></div><div class="poneglyph-route-track" role="list" aria-label="Avancement des quatre Road Poneglyphes">' + clues.map(function (clue, index) {
      var copied = clue.copyArc && arcIndex(clue.copyArc) <= state.progress;
      var current = clue.id === "fourth";
      var label = clue.id === "zou" ? "Forêt de la Baleine" : clue.id === "big-mom" ? (arcIndex("whole-cake-island") <= state.progress ? "Totto Land" : "Chez Big Mom") : clue.id === "kaido" ? (arcIndex("wano") <= state.progress ? "Wano" : "Chez Kaido") : "À localiser";
      var stateLabel = copied ? clue.status : current ? "À trouver" : clue.displayStatus;
      return '<article class="poneglyph-route-stop ' + (copied ? "is-copied" : current ? "is-open" : "") + '" role="listitem"><span class="poneglyph-route-number">0' + (index + 1) + '</span><span class="poneglyph-route-mark" aria-hidden="true">' + (copied ? "✓" : escapeHtml(clue.mark)) + '</span><strong>' + escapeHtml(label) + '</strong><small>' + escapeHtml(stateLabel) + '</small></article>';
    }).join("") + '</div><p class="poneglyph-route-footnote">' + outstanding + ' repère' + (outstanding === 1 ? "" : "s") + ' sur 4 ' + (outstanding === 1 ? 'reste' : 'restent') + ' à réunir ou à confirmer. Les pistes non révélées à ton arc restent masquées.</p></section>';
  }

  function renderFindingCard(item) {
    var inNotebook = state.poneglyphNotes.indexOf(item.id) !== -1;
    var road = item.kind === "road";
    return '<details class="poneglyph-card ' + (road ? "is-road" : "") + '"><summary><span class="poneglyph-card-seal" aria-hidden="true">' + escapeHtml(item.mark) + '</span><span class="poneglyph-card-main"><span class="poneglyph-card-kicker">' + escapeHtml(item.place) + ' · ' + escapeHtml(item.subplace) + '</span><strong>' + escapeHtml(item.title) + '</strong><span class="poneglyph-card-badge ' + (road ? "road" : "") + '">' + (road ? "ROAD PONÉGLYPHE" : item.kind === "other" ? "STÈLE CLASSIQUE" : "PONÉGLYPHE") + '</span></span><span class="poneglyph-card-chevron" aria-hidden="true">⌄</span></summary><div class="poneglyph-card-detail"><p>' + escapeHtml(item.note) + '</p><div class="poneglyph-card-meta"><span><i aria-hidden="true"></i>' + escapeHtml(item.signal) + '</span><span>Visible jusqu’à ' + escapeHtml(progressArc().name) + '</span></div><button type="button" class="poneglyph-note-button ' + (inNotebook ? "is-saved" : "") + '" data-poneglyph-note="' + escapeHtml(item.id) + '" aria-pressed="' + (inNotebook ? "true" : "false") + '"><span aria-hidden="true">' + (inNotebook ? "✓" : "+") + '</span>' + (inNotebook ? "Dans mon carnet" : "Ajouter à mon carnet") + '</button></div></details>';
  }

  function renderPoneglyphs() {
    var currentArc = progressArc();
    var html = heading("ARCHIVES ANCIENNES", "Les ponéglyphes", "Garde une trace des inscriptions croisées par l’équipage. Chaque fiche se dévoile selon l’arc que tu as terminé.", "◈");
    if (!currentArc) return html + progressHint();

    var visible = findings.filter(function (item) { return arcIndex(item.arc) <= state.progress; });
    var roadVisible = visibleRoadClues().length > 0;
    var activeFilter = roadVisible ? state.poneglyphFilter : (state.poneglyphFilter === "other" ? "other" : "all");
    var entries = filtered(state.query, visible, function (item) { return [item.place,item.subplace,item.title,item.kind,item.signal]; });
    if (activeFilter === "road") entries = entries.filter(function (item) { return item.kind === "road"; });
    if (activeFilter === "other") entries = entries.filter(function (item) { return item.kind !== "road"; });
    var savedCount = visible.filter(function (item) { return state.poneglyphNotes.indexOf(item.id) !== -1; }).length;
    var roadCount = visibleRoadClues().filter(function (clue) { return clue.copyArc && arcIndex(clue.copyArc) <= state.progress; }).length;
    var roadStat = roadVisible ? '<div><strong>' + roadCount + '<small>/4</small></strong><span>copies de route</span></div>' : '';
    html += '<section class="poneglyph-hero"><div class="poneglyph-hero-copy"><span class="poneglyph-hero-kicker"><i></i> REGISTRE DE NAVIGATION · ' + escapeHtml(currentArc.name.toUpperCase()) + '</span><h2>Des pierres pour<br><em>lire le passé.</em></h2><p>Une inscription à la fois, l’équipage rassemble les repères de son voyage. Ton carnet ne montre que les découvertes connues à ton point de progression.</p><div class="poneglyph-hero-stats"><div><strong>' + visible.length + '</strong><span>stèle' + (visible.length === 1 ? "" : "s") + ' recensée' + (visible.length === 1 ? "" : "s") + '</span></div>' + roadStat + '<div><strong>' + savedCount + '</strong><span>dans ton carnet</span></div></div></div><div class="poneglyph-monolith" aria-hidden="true"><div class="poneglyph-monolith-inner"><span>GRAND LINE</span><i></i><i></i><i></i><i></i><i></i><b>◈</b><i></i><i></i><i></i><i></i><i></i></div><span class="poneglyph-monolith-caption">INSCRIPTION · ARCHIVE 01</span></div><span class="poneglyph-hero-orbit" aria-hidden="true">◈</span></section>';
    html += renderRoadAtlas();
    var note = roadVisible ? 'Les lieux et les détails s’affichent après leur arc de révélation. Les stèles restent sur place; une copie de l’inscription peut suffire.' : 'Les lieux et les détails s’affichent seulement après l’arc où ils sont révélés.';
    html += '<section class="poneglyph-collection"><div class="poneglyph-section-heading"><div><span class="eyebrow">INSCRIPTIONS RENCONTRÉES</span><h2>Le carnet de l’équipage</h2><p>Ouvre une fiche pour son repère de lieu, son type et son état.</p></div><span class="poneglyph-collection-count">' + entries.length + ' / ' + visible.length + ' visibles</span></div><div class="poneglyph-toolbar"><label class="filter-search poneglyph-search"><span aria-hidden="true">⌕</span><input id="poneglyphSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="Chercher un lieu ou une inscription…" autocomplete="off"></label><div class="poneglyph-filters" role="group" aria-label="Filtrer les ponéglyphes"><button type="button" data-poneglyph-filter="all" aria-pressed="' + (activeFilter === "all" ? "true" : "false") + '">Tout <span>' + visible.length + '</span></button>' + (roadVisible ? '<button type="button" data-poneglyph-filter="road" aria-pressed="' + (activeFilter === "road" ? "true" : "false") + '">Road <span>' + visible.filter(function (item) { return item.kind === "road"; }).length + '</span></button>' : '') + '<button type="button" data-poneglyph-filter="other" aria-pressed="' + (activeFilter === "other" ? "true" : "false") + '">Autres <span>' + visible.filter(function (item) { return item.kind !== "road"; }).length + '</span></button></div></div><div class="poneglyph-grid">' + entries.map(renderFindingCard).join("") + (entries.length ? "" : '<div class="empty-state poneglyph-empty"><strong>Aucune inscription dans ce filtre</strong>Essaie un autre mot ou une autre catégorie.</div>') + '</div><p class="poneglyph-spoiler-note"><span aria-hidden="true">✦</span> ' + escapeHtml(note) + '</p></section>';
    return html;
  }

  return { renderPoneglyphs };
};
