window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.crews = function (context) {
  var { DATA, state, progressArc, escapeHtml, stripMarks, identityKey, safeCharacterName, filtered, heading, progressHint } = context;

  function memberData(member) {
    if (Array.isArray(member)) return { name:member[0], role:member[1] || "Membre", knownAt:Number(member[2]), image:null, description:null };
    return {
      id:member && member.id || null,
      name:member && member.name || "Membre inconnu",
      role:member && member.role || "Membre",
      knownAt:Number(member && member.knownAt),
      image:member && member.image || null,
      description:member && member.description || null,
    };
  }

  function crewKey(crew) {
    return String(crew.id || stripMarks(crew.name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
  }

  function collectCrews() {
    var groups = (DATA.crews || []).filter(function (crew) { return Number(crew.knownAt) <= state.progress; }).map(function (crew) {
      return Object.assign({},crew,{members:(crew.members || []).map(memberData)});
    });
    (state.crews || []).forEach(function (sourceCrew) {
      if (Number(sourceCrew.knownAt) > state.progress) return;
      var crew = Object.assign({},sourceCrew,{members:(sourceCrew.members || []).map(memberData)});
      var key = stripMarks(crew.name).replace(/[^a-z0-9]/g,"");
      var existing = groups.find(function (entry) { return stripMarks(entry.name).replace(/[^a-z0-9]/g,"") === key; });
      if (!existing) {
        groups.push(crew);
        return;
      }
      if (!existing.id && crew.id) existing.id = crew.id;
      if (!existing.image && crew.image) existing.image = crew.image;
      if ((!existing.description || existing.description.indexOf("à compléter") >= 0) && crew.description) existing.description = crew.description;
      var members = existing.members || (existing.members = []);
      crew.members.forEach(function (member) {
        var memberKey = identityKey(member.name);
        var found = members.find(function (current) { return identityKey(current.name) === memberKey; });
        if (!found) members.push(member);
        else {
          if (!found.image && member.image) found.image = member.image;
          if (!found.description && member.description) found.description = member.description;
          if ((!found.role || found.role === "Membre") && member.role) found.role = member.role;
        }
      });
    });
    return groups;
  }

  function visibleMembers(crew) {
    return (crew.members || []).map(memberData).filter(function (member) {
      return Number.isFinite(member.knownAt) && member.knownAt <= state.progress && safeCharacterName(member.name);
    }).map(function (member) {
      member.displayName = safeCharacterName(member.name);
      return member;
    });
  }

  function renderCrews() {
    var html = heading("ATLAS DES PIRATES", "Équipages", "Ouvre une fiche pour découvrir l’histoire, la composition et les membres déjà révélés à ton point de progression.", "⚑");
    if (!progressArc()) return html + progressHint();
    var groups = filtered(state.query, collectCrews(), function (crew) {
      return [crew.name, crew.tag, crew.description].concat(visibleMembers(crew).map(function (member) { return member.displayName; }));
    });
    if (!groups.length) return html + '<div class="empty-state"><strong>Aucun équipage trouvé</strong>Essaie un autre nom.</div>';
    html += '<div class="section-heading"><div><h2>' + groups.length + ' équipages et organisations</h2><p>Progression : jusqu’à ' + escapeHtml(progressArc().name) + '.</p></div><span class="tag">FICHES FILTRÉES</span></div><div class="crew-grid">';
    groups.forEach(function (crew) {
      var members = visibleMembers(crew);
      var key = crewKey(crew);
      var crewImage = crew.image ? '<img class="crew-photo" src="' + escapeHtml(crew.image) + '" alt="Illustration de ' + escapeHtml(crew.name) + '" loading="lazy" decoding="async">' : '<span class="crew-avatar" aria-hidden="true">⚑</span>';
      html += '<article class="crew-card"><button class="crew-head crew-open" data-open-crew="' + escapeHtml(key) + '" aria-label="Ouvrir la fiche de ' + escapeHtml(crew.name) + '">' + crewImage + '<span class="crew-head-copy"><strong>' + escapeHtml(crew.name) + '</strong><span>' + escapeHtml(crew.description || "La composition se dévoile au fil des apparitions.") + '</span></span><span class="tag">' + escapeHtml(crew.tag || "Équipage") + '</span><span class="crew-open-mark" aria-hidden="true">↗</span></button><div class="member-list">';
      members.slice(0,6).forEach(function (member) {
        html += '<button class="member-chip" data-open-character="' + escapeHtml(identityKey(member.name)) + '"><strong>' + escapeHtml(member.displayName) + '</strong><span>' + escapeHtml(member.role) + '</span></button>';
      });
      if (members.length > 6) html += '<span class="member-chip member-more">+' + (members.length - 6) + ' autres membres</span>';
      html += '</div></article>';
    });
    return html + '</div>';
  }

  function renderCrewDetail(routeKey) {
    var crews = collectCrews();
    var key = String(routeKey || "");
    var crew = crews.find(function (item) { return crewKey(item) === key || stripMarks(item.name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") === key; });
    if (!progressArc()) return heading("FICHE D’ÉQUIPAGE", "Équipage", "Choisis d’abord un arc pour ouvrir les fiches sans spoiler.", "⚑") + progressHint();
    if (!crew) return heading("FICHE D’ÉQUIPAGE", "Fiche indisponible", "Cet équipage n’est pas répertorié dans les informations accessibles jusqu’à ton arc.", "⚑") + '<button class="button-secondary detail-back" data-page="crews">← Retour aux équipages</button>';
    var members = visibleMembers(crew);
    var portrait = crew.image ? '<img class="detail-image" src="' + escapeHtml(crew.image) + '" alt="Illustration de ' + escapeHtml(crew.name) + '" decoding="async">' : '<span class="detail-image detail-avatar" aria-hidden="true">⚑</span>';
    var html = '<button class="detail-back" data-page="crews">← Retour aux équipages</button><section class="detail-hero crew-detail-hero">' + portrait + '<div class="detail-hero-copy"><span class="eyebrow">' + escapeHtml(crew.tag || "Équipage") + '</span><h1>' + escapeHtml(crew.name) + '</h1><p>' + escapeHtml(crew.description || "La composition et les repères de cet équipage se dévoilent au fil de l’histoire.") + '</p><div class="detail-badges"><span>' + members.length + ' membre' + (members.length > 1 ? 's' : '') + ' connu' + (members.length > 1 ? 's' : '') + '</span><span>Repère : ' + escapeHtml(progressArc().name) + '</span></div></div></section>';
    html += '<div class="section-heading detail-section-heading"><div><h2>Membres connus</h2><p>Les membres dont la première apparition se situe après ton arc restent masqués.</p></div></div><div class="detail-member-grid">';
    members.forEach(function (member) {
      var image = member.image ? '<img class="detail-member-photo" src="' + escapeHtml(member.image) + '" alt="Portrait de ' + escapeHtml(member.displayName) + '" loading="lazy" decoding="async">' : '<span class="detail-member-photo detail-member-avatar" aria-hidden="true">' + escapeHtml(member.displayName.slice(0,1)) + '</span>';
      var description = member.description && member.description !== member.role ? '<p>' + escapeHtml(member.description) + '</p>' : '';
      html += '<button class="detail-member-card" data-open-character="' + escapeHtml(identityKey(member.name)) + '" data-return-crew="' + escapeHtml(crewKey(crew)) + '">' + image + '<span class="detail-member-copy"><strong>' + escapeHtml(member.displayName) + '</strong><span>' + escapeHtml(member.role) + '</span>' + description + '</span><span class="detail-member-arrow" aria-hidden="true">↗</span></button>';
    });
    if (!members.length) html += '<div class="empty-state"><strong>Aucun membre confirmé à cet arc</strong>La fiche de l’équipage est accessible, mais sa composition n’est pas encore documentée.</div>';
    return html + '</div>';
  }

  return { renderCrews, renderCrewDetail, collectCrews };
};
