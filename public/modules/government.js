window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.government = function (context) {
  var { DATA, state, progressArc, escapeHtml, safeCharacterName, identityKey, filtered, heading, progressHint } = context;
  var marineRanks = [
    {label:"Direction", rank:"Amiral en chef", members:[["Sengoku",21,22],["Sakazuki",24]]},
    {label:"Amiraux", rank:"Amiral", members:[["Borsalino",21],["Kuzan",21,24],["Fujitora",26],["Ryokugyu",29]]},
    {label:"Vice-amiraux", rank:"Vice-amiral", members:[["Monkey D. Garp",16],["Tsuru",21],["John Giant",21],["Momonga",21],["Onigumo",21],["Doberman",21],["Yamakaji",21],["Dalmatian",21],["Strawberry",21],["Bastille",26],["Maynard",26],["Smoker",25],["Vergo",25]]},
    {label:"Officiers et unités", rank:"Officier", members:[["Hina",10],["Tashigi",5],["Koby",0,null,"Recrue"],["Helmeppo",0,null,"Recrue"],["Sentomaru",18],["X Drake",30],["Prince Grus",30],["Fullbody",3],["Morgan",0],["Nezumi",4],["T-Bone",15]]}
  ];
  var marineLinks = [
    {from:"Smoker",to:"Tashigi",label:"Unité de Loguetown",knownAt:5},
    {from:"Borsalino",fromLabel:"Kizaru",to:"Sentomaru",label:"Opérations communes à Sabaody",knownAt:18}
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

  function findCharacter(name) {
    return (state.characters || []).find(function (character) { return identityKey(character.name) === identityKey(name); }) || null;
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
    return '<button class="gov-member" data-open-character="' + escapeHtml(key) + '" aria-label="Ouvrir la fiche de ' + escapeHtml(displayName) + '">' + portraitMarkup(name,character,"gov-member-photo") + '<span class="gov-member-copy"><strong>' + escapeHtml(displayName) + '</strong><span>' + escapeHtml(role || character && character.role || "Marine") + '</span></span><span class="gov-member-arrow" aria-hidden="true">↗</span></button>';
  }

  function relationLink(name, label) {
    return '<button class="marine-link-node" data-open-character="' + escapeHtml(identityKey(name)) + '">' + escapeHtml(label || safeCharacterName(name)) + '<span aria-hidden="true">↗</span></button>';
  }

  function renderRankTree() {
    var groups = marineRanks.map(function (group) {
      var members = group.members.filter(function (member) { return member[1] <= state.progress && (member[2] == null || state.progress < member[2]); });
      return {label:group.label,rank:group.rank,members:members};
    }).filter(function (group) { return group.members.length; });
    var links = marineLinks.filter(function (link) { return link.knownAt <= state.progress; });
    return '<section class="hierarchy-card marine-tree-card"><div class="hierarchy-title"><div><span class="tag">CHAÎNE DE COMMANDEMENT</span><h3>La Marine, ses grades et ses visages</h3></div><span class="hierarchy-mark" aria-hidden="true">⚓</span></div><p class="hierarchy-caption">Une vue du commandement et de ses unités, actualisée jusqu’à ' + escapeHtml(progressArc().name) + '. Chaque portrait ouvre une fiche.</p><div class="marine-tree" aria-label="Chaîne de commandement de la Marine">' + groups.map(function (group,index) {
      return '<section class="marine-rank-group"><div class="marine-rank-heading"><span class="marine-rank-index">0' + (index + 1) + '</span><div><span class="marine-rank-label">' + escapeHtml(group.label) + '</span><h4>' + escapeHtml(group.rank) + '</h4></div></div><div class="marine-rank-members">' + group.members.map(function (member) { return memberCard(member[0],member[3] && state.progress < 21 ? member[3] : group.rank); }).join("") + '</div></section>';
    }).join("") + (links.length ? '<div class="marine-links"><div class="marine-links-heading"><span>REPÈRES ENTRE UNITÉS</span><span>Relations connues à cet arc</span></div><div class="marine-links-list">' + links.map(function (link) {
      return '<div class="marine-link"><span class="marine-link-kind">' + escapeHtml(link.label) + '</span><div class="marine-link-pair">' + relationLink(link.from,link.fromLabel) + '<span class="marine-link-line" aria-hidden="true"><i>↔</i></span>' + relationLink(link.to,link.toLabel) + '</div></div>';
    }).join("") + '</div></div>' : '') + '</div></section>';
  }

  function renderSystemMember(member, system) {
    var name = safeCharacterName(member.name);
    if (!name) return "";
    var role = member.role;
    if (system.id === "marines" && member.name === "Sakazuki" && state.progress >= 24) role = "Amiral en chef";
    if (system.id === "marines" && (member.name === "Koby" || member.name === "Helmeppo") && state.progress >= 21) role = "Officier";
    var character = findCharacter(member.name);
    return '<button class="gov-system-member" data-open-character="' + escapeHtml(identityKey(character ? character.name : member.name)) + '">' + portraitMarkup(member.name,character,"gov-system-photo") + '<span class="gov-system-member-copy"><strong>' + escapeHtml(name) + '</strong><span>' + escapeHtml(role) + '</span></span><span class="gov-member-arrow" aria-hidden="true">↗</span></button>';
  }

  function renderSystemCard(system) {
    var members = (system.members || []).map(memberData).filter(function (member) {
      return member.knownAt <= state.progress && (member.endAt == null || state.progress < member.endAt);
    });
    if (system.id === "marines") members = members.filter(function (member) { return member.name !== "Sengoku" || state.progress < 22; });
    var status = currentSystemStatus(system);
    var active = !/aboli|dissous/i.test(status);
    var isWarlordSystem = system.id === "warlords";
    var emptyMessage = isWarlordSystem && !active ? "Le système a été aboli : aucun Corsaire n’occupe plus de siège." : "Aucun membre révélé dans ce dossier à cet arc.";
    return '<article class="system-card system-card-' + escapeHtml(system.id) + '"><div class="system-card-topline"><span class="system-illustration system-illustration-' + escapeHtml(system.id) + '" aria-hidden="true"><span>' + escapeHtml(systemMarks[system.id] || "✦") + '</span></span><span class="tag">' + escapeHtml(system.kind) + '</span></div><div class="system-card-head"><div><h3>' + escapeHtml(system.name) + '</h3><p>' + escapeHtml(system.description) + '</p></div><span class="system-status-badge ' + (active ? "" : "off") + '"><i></i>' + escapeHtml(status) + '</span></div>' + (members.length ? '<div class="gov-system-members">' + members.map(function (member) { return renderSystemMember(member,system); }).join("") + '</div>' : '<p class="system-empty-note">' + escapeHtml(emptyMessage) + '</p>') + '<div class="system-card-foot"><span>' + members.length + ' ' + (members.length === 1 ? 'personnage connu' : 'personnages connus') + '</span><span>À ' + escapeHtml(progressArc().name) + '</span></div></article>';
  }

  function renderGovernment() {
    var html = heading("DOSSIERS DU MONDE", "Marine & Gouvernement", "Explore les forces et les institutions du monde, au rythme de ta progression dans l’histoire.", "⚓");
    if (!progressArc()) return html + progressHint();
    var systems = DATA.systems.filter(function (system) { return system.knownAt <= state.progress && system.id !== "revolutionaries" && system.id !== "ranks" && system.id !== "marines"; });
    systems = filtered(state.query,systems,function (system) { return [system.name,system.kind,system.description,currentSystemStatus(system)].concat((system.members || []).map(function (member) { return member[0]; })); });
    html += renderRankTree();
    html += '<div class="section-heading"><div><h2>' + systems.length + ' dossiers des institutions</h2><p>Les membres et leurs portraits apparaissent au fil des révélations.</p></div><span class="tag">JUSQU’À ' + escapeHtml(progressArc().name.toUpperCase()) + '</span></div>';
    if (!systems.length) return html + '<div class="empty-state"><strong>Aucun dossier ne correspond</strong>Essaie un autre terme.</div>';
    return html + '<div class="system-grid">' + systems.map(renderSystemCard).join("") + '</div>';
  }
  return { currentSystemStatus, renderGovernment };
};
