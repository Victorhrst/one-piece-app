window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.characters = function (context) {
  var { DATA, state, progressArc, escapeHtml, stripMarks, identityKey, safeCharacterName, filtered, heading, progressHint } = context;

  function memberData(member) {
    if (Array.isArray(member)) return { name:member[0], role:member[1] || "Membre", knownAt:Number(member[2]), image:null, description:null };
    return {
      name:member && member.name || "Membre inconnu",
      role:member && member.role || "Membre",
      knownAt:Number(member && member.knownAt),
      image:member && member.image || null,
      description:member && member.description || null,
    };
  }

  function collectCharacters() {
    var result = [];
    var seen = {};
    function add(character) {
      var key = identityKey(character.name);
      var existing = seen[key] ? result.find(function (item) { return identityKey(item.name) === key; }) : null;
      var displayName = safeCharacterName(character.name);
      if (!displayName) return;
      if (existing) {
        if (!existing.image && character.image) existing.image = character.image;
        if ((!existing.description || existing.description === existing.role) && character.description) existing.description = character.description;
        if ((!existing.role || existing.role === "Membre") && character.role) existing.role = character.role;
        if (character.group && !existing.affiliations.some(function (group) { return stripMarks(group) === stripMarks(character.group); })) existing.affiliations.push(character.group);
        return;
      }
      seen[key] = true;
      var groups = character.affiliations || (character.group ? [character.group] : []);
      result.push(Object.assign({},character,{name:displayName,group:groups[0] || "Personnage",affiliations:groups.slice()}));
    }

    (DATA.crews || []).forEach(function (crew) {
      if (crew.knownAt > state.progress) return;
      (crew.members || []).forEach(function (raw) {
        var member = memberData(raw);
        if (member.knownAt > state.progress) return;
        add({ name:member.name, role:member.role, group:crew.name, knownAt:member.knownAt, image:member.image, description:member.description });
      });
    });
    (DATA.systems || []).forEach(function (system) {
      if (system.knownAt > state.progress || !system.members) return;
      system.members.forEach(function (member) {
        var role = member.length > 2 ? member[1] : "Membre";
        var knownAt = member.length > 2 ? member[2] : member[1];
        if (knownAt <= state.progress) add({ name:member[0],role:role,group:system.name,knownAt:knownAt });
      });
    });
    (DATA.characters || []).forEach(function (character) {
      if (character[3] <= state.progress) add({ name:character[0],role:character[1],group:character[2],knownAt:character[3] });
    });
    (state.crews || []).forEach(function (crew) {
      if (Number(crew.knownAt) > state.progress) return;
      (crew.members || []).forEach(function (raw) {
        var member = memberData(raw);
        if (member.knownAt <= state.progress) add({ name:member.name,role:member.role,group:crew.name,knownAt:member.knownAt,image:member.image,description:member.description });
      });
    });
    (state.characters || []).forEach(function (character) {
      if (character.knownAt <= state.progress) add(character);
    });
    return result.sort(function (a, b) { return a.name.localeCompare(b.name,"fr"); });
  }

  function characterImage(character, large) {
    if (character.image) return '<img class="' + (large ? 'detail-image' : 'character-photo') + '" src="' + escapeHtml(character.image) + '" alt="Portrait de ' + escapeHtml(character.name) + '" ' + (large ? 'decoding="async"' : 'loading="lazy" decoding="async"') + '>';
    return '<span class="' + (large ? 'detail-image detail-avatar' : 'character-avatar') + '" aria-hidden="true">' + escapeHtml(character.name.slice(0,1)) + '</span>';
  }

  function renderCharacters() {
    var html = heading("INDEX CHRONOLOGIQUE", "Personnages", "Ouvre une fiche pour consulter son portrait, son rôle, ses affiliations et les premiers repères connus à ton arc.", "◎");
    if (!progressArc()) return html + progressHint();
    var characters = filtered(state.query, collectCharacters(), function (item) {
      return [item.name, item.role, item.group, item.affiliations.join(" ")];
    });
    var visibleCharacters = characters.slice(0,state.characterLimit);
    var remainingIndexed = Math.max(0, Number(state.characterTotal) - state.characters.length);
    html += '<div class="filter-row"><label class="filter-search"><span>⌕</span><input id="characterSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="Nom, rôle ou affiliation…"></label><span class="result-count">' + (characters.length + remainingIndexed) + ' fiches indexées</span></div><div class="character-grid">';
    visibleCharacters.forEach(function (item) {
      html += '<button class="character-card character-open" data-open-character="' + escapeHtml(identityKey(item.name)) + '">' + characterImage(item,false) + '<span class="character-card-copy"><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.role) + ' · ' + escapeHtml(item.group) + '</span>' + (item.description && item.description !== item.role ? '<span class="character-description">' + escapeHtml(item.description) + '</span>' : '') + '</span><span class="character-open-mark" aria-hidden="true">↗</span></button>';
    });
    if (!characters.length) html += '<div class="empty-state"><strong>Aucun personnage trouvé</strong>Essaie un autre nom.</div>';
    if (characters.length > visibleCharacters.length || remainingIndexed > 0) html += '<button class="show-more" data-show-more>Afficher 60 autres personnages · ' + (Math.max(0, characters.length - visibleCharacters.length) + remainingIndexed) + ' restants</button>';
    return html + '</div>';
  }

  function renderCharacterDetail(routeKey, returnCrew) {
    var characters = collectCharacters();
    var key = String(routeKey || "");
    var character = characters.find(function (item) { return identityKey(item.name) === key || stripMarks(item.name).replace(/[^a-z0-9]+/g,"-") === key; });
    if (!progressArc()) return heading("FICHE PERSONNAGE", "Personnage", "Choisis d’abord un arc pour ouvrir les fiches sans spoiler.", "◎") + progressHint();
    if (!character) return heading("FICHE PERSONNAGE", "Fiche indisponible", "Ce personnage n’est pas répertorié dans les informations accessibles jusqu’à ton arc.", "◎") + '<button class="detail-back" data-page="characters">← Retour aux personnages</button>';
    var affiliations = character.affiliations.filter(function (item,index,list) { return list.indexOf(item) === index; });
    var firstArc = DATA.arcs[character.knownAt] || progressArc();
    var description = character.description && character.description !== character.role
      ? character.description
      : character.name + ' est répertorié' + (character.role ? ' comme ' + character.role.toLowerCase() : '') + (affiliations.length ? ' et rattaché' + (character.role && /e$/.test(character.role) ? 'e' : '') + ' à ' + affiliations.join(', ') : '') + '.';
    var back = returnCrew
      ? '<button class="detail-back" data-open-crew="' + escapeHtml(returnCrew) + '">← Retour à la fiche de l’équipage</button>'
      : '<button class="detail-back" data-page="characters">← Retour aux personnages</button>';
    var html = back + '<section class="detail-hero character-detail-hero">' + characterImage(character,true) + '<div class="detail-hero-copy"><span class="eyebrow">FICHE PERSONNAGE</span><h1>' + escapeHtml(character.name) + '</h1><p>' + escapeHtml(description) + '</p><div class="detail-badges"><span>' + escapeHtml(character.role || "Rôle non précisé") + '</span><span>Première apparition connue · ' + escapeHtml(firstArc.name) + (character.firstChapter ? ' · chapitre ' + escapeHtml(character.firstChapter) : '') + '</span></div></div></section>';
    html += '<div class="detail-facts-grid"><article class="detail-fact"><span>Rôle documenté</span><strong>' + escapeHtml(character.role || "Non précisé") + '</strong></article><article class="detail-fact"><span>Affiliation' + (affiliations.length > 1 ? 's' : '') + '</span><strong>' + escapeHtml(affiliations.join(" · ") || "Non précisée") + '</strong></article><article class="detail-fact"><span>Repère de la fiche</span><strong>' + escapeHtml(firstArc.name) + '</strong></article></div>';
    return html;
  }

  return { collectCharacters, renderCharacters, renderCharacterDetail };
};
