window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.guide = function (context) {
  var { DATA, state, progressArc, visibleEpisodes, visibleChapters, escapeHtml, plain, episodeNumber, chapterNumber, chapterValues, formatChapterValues, volumeText, arcLabelForEpisode, filtered, heading, progressHint } = context;
  function renderGuide() {
    var arc = progressArc();
    var html = heading("REPÈRES DE VOYAGE", "Épisodes & chapitres", "Chaque épisode est relié aux chapitres qu’il adapte et aux tomes correspondants. Les résultats s’arrêtent à ton dernier arc terminé.", "▤");
    if (!arc) return html + progressHint();
    var eps = visibleEpisodes();
    var chs = visibleChapters();
    html += '<div class="guide-tabs"><button class="guide-tab ' + (state.guideMode === "episodes" ? "active" : "") + '" data-guide-mode="episodes">Épisodes <span>(' + eps.length + ')</span></button><button class="guide-tab ' + (state.guideMode === "chapters" ? "active" : "") + '" data-guide-mode="chapters">Chapitres <span>(' + chs.length + ')</span></button></div>';
    html += '<div class="filter-row"><label class="filter-search"><span>⌕</span><input id="guideSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="' + (state.guideMode === "episodes" ? "Rechercher un épisode ou un chapitre…" : "Rechercher un chapitre ou un tome…") + '"></label><span class="result-count">' + (state.guideMode === "episodes" ? eps.length : chs.length) + ' entrées jusqu’à ' + escapeHtml(arc.name) + '</span></div>';
    if (state.guideMode === "episodes") html += renderEpisodeRows(eps);
    else html += renderChapterRows(chs);
    return html;
  }

  function renderEpisodeRows(episodes) {
    if (!episodes.length) {
      if (state.guideLoading) return '<div class="empty-state"><strong>Chargement du guide…</strong>Les épisodes et leurs correspondances sont lus dans la base locale.</div>';
      var cached = state.cacheEpisodeMax > 0;
      return '<div class="empty-state"><strong>' + (cached ? "Aucun épisode ne correspond à ta recherche" : "Le guide détaillé arrive") + '</strong>' + (cached ? "Essaie un autre numéro ou un autre titre." : "Mets à jour les données pour charger les équivalences complètes. En attendant, les arcs et plages de chapitres restent disponibles ci-dessous.") + '</div>' + renderArcRangeTable();
    }
    var list = filtered(state.query, episodes, function (item) {
      return [episodeNumber(item), item.title, item.chapter, arcLabelForEpisode(item)];
    });
    if (!list.length) return '<div class="empty-state"><strong>Aucun résultat</strong>Essaie un autre numéro, un titre ou une plage de chapitres.</div>';
    var visible = list.slice(0, state.guideLimit);
    var html = '<div class="guide-list">';
    visible.forEach(function (item) {
      var number = episodeNumber(item);
      var chapters = chapterValues(item.chapter);
      var description = plain(item.description);
      html += '<article class="catalogue-row"><div class="catalogue-main"><div class="catalogue-number">ÉP. ' + number + '</div><div class="catalogue-title"><strong>' + escapeHtml(plain(item.title) || "Épisode " + number) + '</strong><span>' + escapeHtml(arcLabelForEpisode(item)) + ' · ' + escapeHtml(item.release_date || "Date non renseignée") + '</span></div><div class="catalogue-meta">' + escapeHtml(formatChapterValues(chapters)) + '</div><div class="catalogue-volume">' + escapeHtml(volumeText(chapters)) + '</div><button class="detail-toggle" data-detail aria-label="Afficher le résumé de l’épisode ' + number + '">⌄</button></div><div class="catalogue-detail" hidden>' + escapeHtml(description || "Aucun résumé disponible.") + '</div></article>';
    });
    html += '</div>';
    if (list.length > visible.length) html += '<button class="show-more" data-show-more>Afficher 30 autres épisodes · ' + (list.length - visible.length) + ' restants</button>';
    html += '<p class="section-note">Plage de repères connue pour l’arc sélectionné : ' + escapeHtml(progressArc().chapterStart) + '–' + escapeHtml(progressArc().chapterEnd) + ' · tomes ' + escapeHtml(progressArc().volumeStart) + '–' + escapeHtml(progressArc().volumeEnd) + '.</p>';
    return html;
  }

  function renderChapterRows(chapters) {
    if (!chapters.length) {
      if (state.guideLoading) return '<div class="empty-state"><strong>Chargement du guide…</strong>Les chapitres et leurs tomes sont lus dans la base locale.</div>';
      return '<div class="empty-state"><strong>Les chapitres sont en cours de chargement</strong>Utilise « Mettre à jour » pour récupérer les titres et tomes, ou choisis un arc antérieur.<br><br><span>Repères jusqu’à ' + escapeHtml(progressArc().name) + ' : chapitres ' + escapeHtml(progressArc().chapterStart) + ' à ' + escapeHtml(progressArc().chapterEnd) + ', tomes ' + escapeHtml(progressArc().volumeStart) + ' à ' + escapeHtml(progressArc().volumeEnd) + '.</span></div>';
    }
    var list = filtered(state.query, chapters, function (item) {
      return [chapterNumber(item), item.title, item.tome && item.tome.tome_number];
    });
    if (!list.length) return '<div class="empty-state"><strong>Aucun résultat</strong>Essaie un autre numéro de chapitre ou de tome.</div>';
    var visible = list.slice(0, state.guideLimit);
    var html = '<div class="guide-list">';
    visible.forEach(function (item) {
      var number = chapterNumber(item);
      var tome = item.tome && (item.tome.tome_number || item.tome.number);
      var description = plain(item.description);
      html += '<article class="catalogue-row"><div class="catalogue-main"><div class="catalogue-number">CH. ' + number + '</div><div class="catalogue-title"><strong>' + escapeHtml(plain(item.title) || "Chapitre " + number) + '</strong><span>' + escapeHtml(arcForChapter(number).name) + '</span></div><div class="catalogue-meta">' + (tome ? 'Tome ' + escapeHtml(tome) : "Tome non publié") + '</div><div class="catalogue-volume">' + (tome ? 'T. ' + escapeHtml(tome) : "À venir") + '</div><button class="detail-toggle" data-detail aria-label="Afficher le résumé du chapitre ' + number + '">⌄</button></div><div class="catalogue-detail" hidden>' + escapeHtml(description || "Aucun résumé disponible.") + '</div></article>';
    });
    html += '</div>';
    if (list.length > visible.length) html += '<button class="show-more" data-show-more>Afficher 30 autres chapitres · ' + (list.length - visible.length) + ' restants</button>';
    return html;
  }

  function arcForChapter(number) {
    return DATA.arcs.find(function (arc) { return number >= arc.chapterStart && number <= arc.chapterEnd; }) || progressArc() || DATA.arcs[0];
  }

  function renderArcRangeTable() {
    var arc = progressArc();
    return '<div class="collection-summary">Pour ' + escapeHtml(arc.name) + ' : épisodes ' + escapeHtml(arc.episodeStart) + '–' + escapeHtml(arc.episodeEnd) + ', chapitres ' + escapeHtml(arc.chapterStart) + '–' + escapeHtml(arc.chapterEnd) + ', tomes ' + escapeHtml(arc.volumeStart) + '–' + escapeHtml(arc.volumeEnd) + '. Ces plages sont indicatives et peuvent inclure des épisodes de transition.</div>';
  }
  return { renderGuide, renderEpisodeRows, renderChapterRows, arcForChapter, renderArcRangeTable };
};
