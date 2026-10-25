window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.government = function (context) {
  var { DATA, state, progressArc, escapeHtml, safeCharacterName, identityKey, filtered, heading, progressHint } = context;
  var characterIndexSource = null;
  var characterIndex = new Map();
  var marineRanks = [
    {label:"Direction", rank:"Amiral en chef", members:[["Sengoku",21,22],["Sakazuki",24]]},
    {label:"Amiraux", rank:"Amiral", members:[["Borsalino",21],["Kuzan",21,24],["Fujitora",26],["Ryokugyu",29]]},
    {label:"Vice-amiraux", rank:"Vice-amiral", members:[["Monkey D. Garp",16],["Tsuru",21],["John Giant",21],["Momonga",21],["Onigumo",21],["Doberman",21],["Yamakaji",21],["Dalmatian",21],["Strawberry",21],["Bastille",26],["Maynard",26],["Smoker",25],["Vergo",25]]},
    {label:"Officiers et unités", rank:"Officier", members:[["Hina",10],["Tashigi",5],["Koby",0,null,"Recrue"],["Helmeppo",0,null,"Recrue"],["Sentomaru",18],["X Drake",30],["Prince Grus",30],["Fullbody",3],["Morgan",0],["Nezumi",4],["T-Bone",15]]}
  ];
  var systemMarks = {"world-gov":"✦","warlords":"♜","cipher-pol":"◈","buster-call":"⚓","cp0":"◉","world-nobles":"✧","five-elders":"♛","sword":"⚔","impel-down":"▤","god-knights":"✦"};

  function memberData(member) {
    if (!Array.isArray(member)) return {name:member.name,role:member.role || "Membre",knownAt:Number(member.knownAt) || 0,endAt:member.endAt == null ? null : Number(member.endAt)};
    if (member.length >= 4) return {name:member[0],role:member[1] || "Membre",knownAt:Number(member[2]) || 0,endAt:member[3] == null ? null : Number(member[3])};
    if (member.length >= 3) return {name:member[0],role:member[1] || "Membre",knownAt:Number(member[2]) || 0,endAt:null};
    return {name:member[0],role:"Membre",knownAt:Number(member[1]) || 0,endAt:null};
  }

  function currentSystemStatus(system) {
    var entries = (system.statusHistory || []).filter(function (entry) { return entry.from <= state.progress; });
    return entries.length ? entries[entries.length - 1].label : (system.status === "active" ? "En activité" : "Statut non précisé");
  }

  function currentSystemDescription(system) {
    var versions = (system.descriptionByArc || []).filter(function (entry) { return entry.from <= state.progress; });
    return versions.length ? versions[versions.length - 1].text : system.description;
  }

  function findCharacter(name) {
    if (characterIndexSource !== state.characters) {
      characterIndex = new Map();
      (state.characters || []).forEach(function (character) {
        var key = identityKey(character.name);
        if (!characterIndex.has(key)) characterIndex.set(key, character);
      });
      characterIndexSource = state.characters;
    }
    return characterIndex.get(identityKey(name)) || null;
  }

  function portraitMarkup(name, character, className) {
    var image = character && character.image;
    var initial = escapeHtml(String(safeCharacterName(name) || name).slice(0,1).toUpperCase());
    if (image) return '<img class="' + className + '" src="' + escapeHtml(image) + '" alt="Portrait de ' + escapeHtml(safeCharacterName(name)) + '" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="' + className + ' gov-member-initial" hidden>' + initial + '</span>';
    return '<span class="' + className + ' gov-member-initial">' + initial + '</span>';
  }

  function memberCard(name, role) {
    var character = findCharacter(name);
    var displayName = safeCharacterName(name);
    if (!displayName) return "";
    var key = identityKey(character ? character.name : name);
    return '<button class="gov-member" data-open-character="' + escapeHtml(key) + '" data-return-page="government" aria-label="Ouvrir la fiche de ' + escapeHtml(displayName) + '">' + portraitMarkup(name,character,"gov-member-photo") + '<span class="gov-member-copy"><strong>' + escapeHtml(displayName) + '</strong><span>' + escapeHtml(role || character && character.role || "Marine") + '</span></span><span class="gov-member-arrow" aria-hidden="true">↗</span></button>';
  }

  function renderRankTree() {
    var groups = marineRanks.map(function (group) {
      var members = group.members.filter(function (member) { return member[1] <= state.progress && (member[2] == null || state.progress < member[2]); });
      return {label:group.label,rank:group.rank,members:members};
    }).filter(function (group) { return group.members.length; });
    return '<section class="hierarchy-card marine-tree-card"><div class="hierarchy-title"><div><span class="tag">CHAÎNE DE COMMANDEMENT</span><h3>La Marine, ses grades et ses visages</h3></div><span class="hierarchy-mark" aria-hidden="true">⚓</span></div><p class="hierarchy-caption">Une vue du commandement actualisée jusqu’à ' + escapeHtml(progressArc().name) + '. Chaque portrait ouvre une fiche.</p><div class="marine-tree" aria-label="Chaîne de commandement de la Marine">' + groups.map(function (group,index) {
      return '<section class="marine-rank-group"><div class="marine-rank-heading"><span class="marine-rank-index">0' + (index + 1) + '</span><div><span class="marine-rank-label">' + escapeHtml(group.label) + '</span><h4>' + escapeHtml(group.rank) + '</h4></div></div><div class="marine-rank-members">' + group.members.map(function (member) { return memberCard(member[0],member[3] && state.progress < 21 ? member[3] : group.rank); }).join("") + '</div></section>';
    }).join("") + '</div></section>';
  }

  function renderSystemMember(member, system) {
    var name = safeCharacterName(member.name);
    if (!name) return "";
    var role = member.role;
    if (system.id === "marines" && member.name === "Sakazuki" && state.progress >= 24) role = "Amiral en chef";
    if (system.id === "marines" && (member.name === "Koby" || member.name === "Helmeppo") && state.progress >= 21) role = "Officier";
    var character = findCharacter(member.name);
    return '<button class="gov-system-member" data-open-character="' + escapeHtml(identityKey(character ? character.name : member.name)) + '" data-return-page="government">' + portraitMarkup(member.name,character,"gov-system-photo") + '<span class="gov-system-member-copy"><strong>' + escapeHtml(name) + '</strong><span>' + escapeHtml(role) + '</span></span><span class="gov-member-arrow" aria-hidden="true">↗</span></button>';
  }

  function renderElderSeats() {
    return '<div class="gov-elder-seats" aria-label="Les cinq sièges du conseil, noms non révélés"><div class="gov-elder-seats-heading"><span>LE CONSEIL</span><small>Les noms ne sont pas encore révélés à cet arc.</small></div><div class="gov-elder-seats-row">' + [1,2,3,4,5].map(function (number) {
      return '<div class="gov-elder-seat"><span class="gov-elder-shadow" aria-hidden="true">♟</span><span>Siège 0' + number + '</span></div>';
    }).join("") + '</div></div>';
  }

  function renderSystemCard(system,pageIndex,pageTotal) {
    var members = (system.members || []).map(memberData).filter(function (member) {
      return member.knownAt <= state.progress && (member.endAt == null || state.progress < member.endAt);
    });
    var status = currentSystemStatus(system);
    var active = !/aboli|dissous/i.test(status);
    var isWarlordSystem = system.id === "warlords";
    var emptyMessage = isWarlordSystem && !active ? "Le système a été aboli : aucun Corsaire n’occupe plus de siège." : system.id === "buster-call" ? "Ce dossier décrit un protocole militaire, pas un équipage." : "Ce dossier présente une institution ou une procédure, sans membres individuels à afficher ici.";
    var facts = (system.facts || []).filter(function (fact) { return !fact[2] || fact[2] <= state.progress; });
    var eldersUnidentified = system.id === "five-elders" && state.progress < 31;
    var displayedCount = eldersUnidentified ? 5 : members.length;
    var memberContent = members.length
      ? '<div class="gov-system-members">' + members.map(function (member) { return renderSystemMember(member,system); }).join("") + '</div>'
      : eldersUnidentified ? renderElderSeats() : '<p class="system-empty-note">' + escapeHtml(emptyMessage) + '</p>';
    return '<article class="gov-book-spread system-card system-card-' + escapeHtml(system.id) + '" role="group" aria-label="Dossier ' + (pageIndex + 1) + ' sur ' + pageTotal + '"><div class="gov-book-page gov-book-left"><div class="gov-book-page-top"><span>DOSSIER · ' + escapeHtml(system.kind.toUpperCase()) + '</span><span>' + String(pageIndex + 1).padStart(2,"0") + ' / ' + String(pageTotal).padStart(2,"0") + '</span></div><div class="system-illustration system-illustration-' + escapeHtml(system.id) + '" aria-hidden="true"><span>' + escapeHtml(systemMarks[system.id] || "✦") + '</span></div><span class="gov-book-kicker">' + escapeHtml(system.kind) + '</span><h3>' + escapeHtml(system.name) + '</h3><p class="gov-book-description">' + escapeHtml(currentSystemDescription(system)) + '</p><span class="system-status-badge ' + (active ? "" : "off") + '"><i></i>' + escapeHtml(status) + '</span>' + (facts.length ? '<div class="gov-book-facts">' + facts.map(function (fact) { return '<div><span>' + escapeHtml(fact[0]) + '</span><strong>' + escapeHtml(fact[1]) + '</strong></div>'; }).join("") + '</div>' : '') + '<div class="gov-book-stamp"><span>GRAND LINE · ARCHIVES</span><span>' + escapeHtml(progressArc().name.toUpperCase()) + '</span></div></div><div class="gov-book-page gov-book-right"><div class="gov-book-page-top"><span>CONTENU DU DOSSIER</span><span>FOLIO ' + String(pageIndex + 1).padStart(2,"0") + '</span></div><h4>' + (members.length ? 'Visages associés' : eldersUnidentified ? 'Un conseil de cinq membres' : system.id === "buster-call" ? 'Un protocole militaire' : 'Informations complémentaires') + '</h4><p class="gov-book-subtitle">' + (members.length ? 'Les fiches et rôles connus à ' + escapeHtml(progressArc().name) + '.' : eldersUnidentified ? 'Le conseil apparaît, mais ses membres ne sont pas encore nommés.' : system.id === "buster-call" ? 'Les caractéristiques de cette procédure sont résumées dans le dossier.' : 'Informations visibles jusqu’à ' + escapeHtml(progressArc().name) + '.') + '</p>' + memberContent + '<div class="gov-book-page-foot"><span>' + displayedCount + ' ' + (eldersUnidentified ? 'sièges présentés' : displayedCount === 1 ? 'membre affiché' : 'membres affichés') + '</span><span>MISE À JOUR · ' + escapeHtml(progressArc().name.toUpperCase()) + '</span></div></div></article>';
  }

  function renderGovernment() {
    var html = heading("DOSSIERS DU MONDE", "Marine & Gouvernement", "Explore les forces et les institutions du monde, au rythme de ta progression dans l’histoire.", "⚓");
    if (!progressArc()) return html + progressHint();
    var systems = DATA.systems.filter(function (system) { return system.knownAt <= state.progress && system.id !== "revolutionaries" && system.id !== "ranks" && system.id !== "marines"; });
    systems = filtered(state.query,systems,function (system) { return [system.name,system.kind,currentSystemDescription(system),currentSystemStatus(system)].concat((system.members || []).map(function (member) { return member[0]; })); });
    html += renderRankTree();
    html += '<div class="section-heading gov-book-section-heading"><div><span class="tag">ARCHIVES INTERACTIVES</span><h2>Le carnet des institutions</h2><p>Tourne les pages pour parcourir les dossiers débloqués à ton arc.</p></div><span class="gov-book-total">' + systems.length + ' dossiers</span></div>';
    if (!systems.length) return html + '<div class="empty-state"><strong>Aucun dossier ne correspond</strong>Essaie un autre terme.</div>';
    var pageIndex = Math.max(0,Math.min(systems.length - 1,Number(state.governmentBookPage) || 0));
    state.governmentBookPage = pageIndex;
    var activeSystem = systems[pageIndex];
    html += '<section class="institution-book" aria-label="Carnet interactif des institutions"><div class="gov-book-spine" aria-hidden="true"></div>' + renderSystemCard(activeSystem,pageIndex,systems.length) + '<nav class="gov-book-controls" aria-label="Navigation du carnet"><button type="button" class="gov-book-turn" data-gov-book-page="' + Math.max(0,pageIndex - 1) + '"' + (pageIndex === 0 ? ' disabled' : '') + '><span aria-hidden="true">←</span> Page précédente</button><div class="gov-book-index" aria-label="Choisir une page">' + systems.map(function (system,index) { return '<button type="button" class="gov-book-dot' + (index === pageIndex ? ' active' : '') + '" data-gov-book-page="' + index + '" aria-label="Page ' + (index + 1) + ' : ' + escapeHtml(system.name) + '"' + (index === pageIndex ? ' aria-current="page"' : '') + '>' + (index + 1) + '</button>'; }).join("") + '</div><button type="button" class="gov-book-turn" data-gov-book-page="' + Math.min(systems.length - 1,pageIndex + 1) + '"' + (pageIndex === systems.length - 1 ? ' disabled' : '') + '>Page suivante <span aria-hidden="true">→</span></button></nav></section>';
    return html;
  }
  return { currentSystemStatus, currentSystemDescription, renderGovernment };
};
