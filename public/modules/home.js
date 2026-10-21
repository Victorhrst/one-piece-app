window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.home = function (context) {
  var { DATA, state, progressArc, visibleEpisodes, visibleChapters, escapeHtml, stripMarks, heading } = context;
  function renderHome() {
    var arc = progressArc();
    var eps = visibleEpisodes().length;
    var chapters = visibleChapters().length;
    var heroTitle = arc ? 'Le monde que tu connais.<br><em>Le prochain cap reste caché.</em>' : 'Explore Grand Line,<br><em>à ton rythme.</em>';
    var heroDescription = arc
      ? "Ton repère est réglé sur " + arc.name + ". Les personnages, équipages, bateaux et fiches d’univers s’arrêtent à cet arc."
      : "Le voyage est vaste. Choisis un arc terminé et le wiki adaptera chaque page à ta progression.";
    var html = '<section class="hero"><div class="hero-copy"><p class="eyebrow">TON ATLAS DE ONE PIECE</p><h1>' + heroTitle + '</h1><p class="hero-description">' + escapeHtml(heroDescription) + '</p><div class="hero-actions"><button class="button-primary" data-page="guide">Explorer le guide <span>→</span></button><button class="button-secondary" data-page="crews">Découvrir les équipages</button></div></div><div class="hero-art" aria-label="Carte marine décorative"><div class="map-grid"></div><div class="island island-one"></div><div class="island island-two"></div><div class="island island-three"></div><div class="route-line"></div><span class="map-label map-label-one">EAST BLUE</span><span class="map-label map-label-two">GRAND LINE</span><span class="map-mark map-mark-a">✦</span><span class="map-mark map-mark-b">✧</span><div class="compass">✥</div></div></section>';
    html += '<div class="stats-grid"><div class="stat-card"><div class="stat-icon">◉</div><div class="stat-copy"><span>Arc terminé</span><strong>' + (arc ? escapeHtml(arc.name) : "À définir") + '</strong></div></div><div class="stat-card"><div class="stat-icon">▤</div><div class="stat-copy"><span>Épisodes visibles</span><strong>' + (arc ? eps.toLocaleString("fr-FR") : "—") + '</strong></div></div><div class="stat-card"><div class="stat-icon">⌗</div><div class="stat-copy"><span>Chapitres visibles</span><strong>' + (arc ? chapters.toLocaleString("fr-FR") : "—") + '</strong></div></div></div>';
    if (state.query) html += renderGlobalResults();
    html += '<div class="section-heading"><div><h2>Choisis ta prochaine escale</h2><p>Des guides essentiels, rangés selon ton avancée dans l’histoire.</p></div></div>';
    html += '<div class="explore-grid">';
    html += exploreCard("guide","▤","Épisodes & chapitres","Retrouve l’équivalence entre l’anime, le manga et les tomes.");
    html += exploreCard("crews","⚑","Équipages","Membres et rôles, révélés arc après arc.");
    html += exploreCard("ships","⛵","Bateaux","Illustrations, équipages et moments marquants des navires.");
    html += exploreCard("government","⚓","Marine & Gouvernement","Institutions, grades et organisations du monde.");
    html += exploreCard("blades","⌁","Les lames","Rareté et porteurs, selon les informations déjà vues.");
    html += exploreCard("characters","◎","Personnages","Un index filtré par ton point de progression.");
    html += exploreCard("fruits","◉","Fruits du Démon","Les pouvoirs connus à ton stade de l’aventure.");
    html += '</div>';
    html += '<div class="progress-banner"><div class="progress-banner-copy"><span class="progress-banner-icon">◷</span><div><strong>' + (arc ? "Ta progression est protégée jusqu’à " + escapeHtml(arc.name) : "Commence par régler ton repère anti-spoiler") + '</strong><p>' + (arc ? "Tu peux revenir modifier ce réglage depuis le menu à tout moment." : "Aucune fiche n’est débloquée avant ton choix.") + '</p></div></div><button class="outline-button" data-action="open-progress">' + (arc ? "Modifier mon arc" : "Choisir mon arc") + '</button></div>';
    return html;
  }

  function exploreCard(page, icon, title, description) {
    return '<button class="explore-card" data-page="' + page + '"><span class="card-symbol">' + icon + '</span><strong>' + title + '</strong><span>' + description + '</span></button>';
  }

  function renderGlobalResults() {
    if (state.progress === null || state.progress < 0) return '<div class="empty-state"><strong>Résultats masqués</strong>Choisis d’abord un arc terminé : la recherche respectera ensuite le même filtre anti-spoiler.</div>';
    var term = state.query;
    var characters = window.GRANDLINE_PAGES.collectCharacters().filter(function (item) {
      return stripMarks(item.name + " " + item.role + " " + item.group).indexOf(stripMarks(term)) !== -1;
    }).slice(0, 5);
    var blades = DATA.blades.filter(function (item) {
      var grade = item.gradeKnown !== null && item.gradeKnown > state.progress ? "" : item.grade;
      return item.firstSeen <= state.progress && stripMarks(item.name + " " + grade + " " + item.kind).indexOf(stripMarks(term)) !== -1;
    }).slice(0, 4);
    var crews = window.GRANDLINE_PAGES.collectCrews().filter(function (item) {
      return item.knownAt <= state.progress && stripMarks(item.name).indexOf(stripMarks(term)) !== -1;
    }).slice(0, 4);
    var ships = window.GRANDLINE_PAGES.collectShips().filter(function (item) {
      return stripMarks(item.name + " " + item.type).indexOf(stripMarks(term)) !== -1;
    }).slice(0, 4);
    var results = '<div class="section-heading"><div><h2>Résultats pour « ' + escapeHtml(term) + ' »</h2><p>La recherche n’inclut que les entrées visibles jusqu’à ton arc.</p></div></div><div class="character-grid">';
    characters.forEach(function (item) {
      results += '<button class="character-card" data-page="characters"><span class="character-avatar">' + escapeHtml(item.name.slice(0,1)) + '</span><span><h3>' + escapeHtml(item.name) + '</h3><p>' + escapeHtml(item.role) + ' · ' + escapeHtml(item.group) + '</p></span></button>';
    });
    blades.forEach(function (item) {
      var grade = item.gradeKnown !== null && item.gradeKnown > state.progress ? "Grade non connu à ton arc" : item.grade;
      results += '<button class="character-card" data-page="blades"><span class="character-avatar">⌁</span><span><h3>' + escapeHtml(item.name) + '</h3><p>Lame · ' + escapeHtml(grade) + '</p></span></button>';
    });
    crews.forEach(function (item) {
      results += '<button class="character-card" data-page="crews"><span class="character-avatar">⚑</span><span><h3>' + escapeHtml(item.name) + '</h3><p>' + escapeHtml(item.tag) + '</p></span></button>';
    });
    ships.forEach(function (item) {
      results += '<button class="character-card" data-open-ship="' + escapeHtml(item.id) + '"><span class="character-avatar">⛵</span><span><h3>' + escapeHtml(item.name) + '</h3><p>' + escapeHtml(item.type) + ' · Bateau</p></span></button>';
    });
    if (!characters.length && !blades.length && !crews.length && !ships.length) return '<div class="empty-state"><strong>Aucun résultat visible</strong>Essaie un autre terme ou vérifie ton arc sélectionné.</div>';
    return results + '</div>';
  }
  return { renderHome, exploreCard, renderGlobalResults };
};
