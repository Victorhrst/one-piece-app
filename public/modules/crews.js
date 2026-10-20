window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.crews = function (context) {
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
      if (seen[key]) return;
      seen[key] = true;
      result.push(Object.assign({},character,{name:displayName}));
    });
    return result.sort(function (a, b) { return a.name.localeCompare(b.name,"fr"); });
  }

  function renderCrews() {
    var html = heading("ATLAS DES PIRATES", "Équipages", "Les membres apparaissent uniquement à partir de l’arc où ils sont connus. Les rôles et compositions se dévoilent au fil de ta progression.", "⚑");
    if (!progressArc()) return html + progressHint();
    var groups = DATA.crews.filter(function (crew) { return crew.knownAt <= state.progress; });
    (state.crews || []).forEach(function (crew) {
      if (crew.knownAt > state.progress) return;
      var key = stripMarks(crew.name).replace(/[^a-z0-9]/g, "");
      var existing = groups.find(function (entry) { return stripMarks(entry.name).replace(/[^a-z0-9]/g, "") === key; });
      if (!existing) {
        groups.push(crew);
        return;
      }
      if (!existing.image && crew.image) existing.image = crew.image;
      if ((!existing.description || existing.description.indexOf("à compléter") >= 0) && crew.description) existing.description = crew.description;
      var members = existing.members || (existing.members = []);
      (crew.members || []).forEach(function (member) {
        var memberKey = identityKey(member[0]);
        var found = members.some(function (current) { return identityKey(current[0]) === memberKey; });
        if (!found) members.push(member);
      });
    });
    groups = filtered(state.query, groups, function (crew) {
      return [crew.name, crew.tag, crew.description].concat(crew.members.filter(function (member) { return member[2] <= state.progress; }).map(function (member) { return safeCharacterName(member[0]); }));
    });
    if (!groups.length) return html + '<div class="empty-state"><strong>Aucun équipage trouvé</strong>Essaie un autre nom.</div>';
    html += '<div class="section-heading"><div><h2>' + groups.length + ' équipages et organisations</h2><p>Progression : jusqu’à ' + escapeHtml(progressArc().name) + '.</p></div><span class="tag">FICHES FILTRÉES</span></div><div class="crew-grid">';
    groups.forEach(function (crew) {
      var members = crew.members.filter(function (member) { return member[2] <= state.progress; });
      var crewImage = crew.image ? '<img class="crew-photo" src="' + escapeHtml(crew.image) + '" alt="Portrait d’un membre de ' + escapeHtml(crew.name) + '" loading="lazy" decoding="async">' : '<span class="crew-avatar" aria-hidden="true">⚑</span>';
      html += '<article class="crew-card"><div class="crew-head">' + crewImage + '<div><h3>' + escapeHtml(crew.name) + '</h3><p>' + escapeHtml(crew.description) + '</p></div><span class="tag">' + escapeHtml(crew.tag) + '</span></div><div class="member-list">';
      members.forEach(function (member) {
        html += '<span class="member-chip"><strong>' + escapeHtml(safeCharacterName(member[0])) + '</strong><span>' + escapeHtml(member[1]) + '</span></span>';
      });
      html += '</div></article>';
    });
    return html + '</div>';
  }
  return { renderCrews };
};
