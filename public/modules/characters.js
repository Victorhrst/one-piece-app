window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.characters = function (context) {
  var { DATA, state, progressArc, escapeHtml, stripMarks, identityKey, safeCharacterName, filtered, heading, progressHint } = context;
  function collectCharacters() {
    var result = [];
    var seen = {};
    DATA.crews.forEach(function (crew) {
      if (crew.knownAt > state.progress) return;
      crew.members.forEach(function (member) {
        if (member[2] > state.progress) return;
        var name = safeCharacterName(member[0]);
        if (!name) return;
        var key = identityKey(member[0]);
        if (!seen[key]) {
          seen[key] = true;
          result.push({name:name,role:member[1],group:crew.name,knownAt:member[2]});
        }
      });
    });
    DATA.systems.forEach(function (system) {
      if (system.knownAt > state.progress || !system.members) return;
      system.members.forEach(function (member) {
        var name = member[0];
        var role = member.length > 2 ? member[1] : "Membre";
        var knownAt = member.length > 2 ? member[2] : member[1];
        if (knownAt > state.progress) return;
        var displayName = safeCharacterName(name);
        if (!displayName) return;
        var key = identityKey(name);
        if (!seen[key]) {
          seen[key] = true;
          result.push({name:displayName,role:role,group:system.name,knownAt:knownAt});
        }
      });
    });
    (DATA.characters || []).forEach(function (character) {
      var name = character[0];
      var displayName = safeCharacterName(name);
      if (!displayName) return;
      var key = identityKey(name);
      var knownAt = character[3];
      if (knownAt > state.progress || seen[key]) return;
      seen[key] = true;
      result.push({name:displayName,role:character[1],group:character[2],knownAt:knownAt});
    });
    state.characters.forEach(function (character) {
      if (character.knownAt > state.progress) return;
      var displayName = safeCharacterName(character.name);
      if (!displayName) return;
      var key = identityKey(character.name);
      if (seen[key]) {
        var existing = result.find(function (item) { return identityKey(item.name) === key; });
        if (existing && !existing.image && character.image) existing.image = character.image;
        return;
      }
      seen[key] = true;
      result.push(Object.assign({},character,{name:displayName}));
    });
    return result.sort(function (a, b) { return a.name.localeCompare(b.name,"fr"); });
  }

  function renderCharacters() {
    var html = heading("INDEX CHRONOLOGIQUE", "Personnages", "Index des personnages rencontrés. Les rôles et affiliations ne s’affichent qu’après leur introduction dans l’histoire.", "◎");
    if (!progressArc()) return html + progressHint();
    var characters = filtered(state.query, collectCharacters(), function (item) {
      return [item.name, item.role, item.group];
    });
    var visibleCharacters = characters.slice(0,state.characterLimit);
    var remainingIndexed = Math.max(0, Number(state.characterTotal) - state.characters.length);
    html += '<div class="filter-row"><label class="filter-search"><span>⌕</span><input id="characterSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="Nom, rôle ou affiliation…"></label><span class="result-count">' + (characters.length + remainingIndexed) + ' fiches indexées</span></div><div class="character-grid">';
    visibleCharacters.forEach(function (item) {
      var portrait = item.image ? '<img class="character-photo" src="' + escapeHtml(item.image) + '" alt="Portrait de ' + escapeHtml(item.name) + '" loading="lazy" decoding="async">' : '<span class="character-avatar">' + escapeHtml(item.name.slice(0,1)) + '</span>';
      html += '<article class="character-card">' + portrait + '<div class="character-card-copy"><h3>' + escapeHtml(item.name) + '</h3><p>' + escapeHtml(item.role) + ' · ' + escapeHtml(item.group) + '</p>' + (item.description && item.description !== item.role ? '<p class="character-description">' + escapeHtml(item.description) + '</p>' : '') + '</div></article>';
    });
    if (!characters.length) html += '<div class="empty-state"><strong>Aucun personnage trouvé</strong>Essaie un autre nom.</div>';
    if (characters.length > visibleCharacters.length || remainingIndexed > 0) html += '<button class="show-more" data-show-more>Afficher 60 autres personnages · ' + (Math.max(0, characters.length - visibleCharacters.length) + remainingIndexed) + ' restants</button>';
    return html + '</div>';
  }
  return { collectCharacters, renderCharacters };
};
