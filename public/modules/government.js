window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.government = function (context) {
  var { DATA, state, progressArc, escapeHtml, safeCharacterName, filtered, heading, progressHint } = context;
  function currentSystemStatus(system) {
    var entries = (system.statusHistory || []).filter(function (entry) { return entry.from <= state.progress; });
    return entries.length ? entries[entries.length - 1].label : (system.status === "active" ? "En activité" : "Statut non précisé");
  }

  function renderGovernment() {
    var html = heading("DOSSIERS DU MONDE", "Marine & Gouvernement", "Comprends les grades, les forces et les statuts politiques connus à ton stade. Les informations postérieures restent masquées.", "⚓");
    if (!progressArc()) return html + progressHint();
    var systems = DATA.systems.filter(function (system) { return system.knownAt <= state.progress; });
    systems = filtered(state.query, systems, function (system) {
      return [system.name, system.kind, system.description, currentSystemStatus(system)];
    });
    var rankSystem = DATA.systems.find(function (system) { return system.id === "ranks"; });
    var ranks = rankSystem.ranks || [];
    var rankLevels = [
      {label:"Direction",names:["Amiral en chef"]},
      {label:"Commandement suprême",names:["Amiral"]},
      {label:"Officiers généraux",names:["Vice-amiral","Contre-amiral"]},
      {label:"Officiers supérieurs",names:["Commodore","Capitaine"]},
      {label:"Officiers et équipage",names:["Lieutenant","Sergent","Matelot"]}
    ].map(function (level) {
      return {label:level.label,ranks:level.names.map(function (name) {
        return ranks.find(function (rank) { return rank[0] === name && rank[2] <= state.progress; });
      }).filter(Boolean)};
    }).filter(function (level) { return level.ranks.length; });
    html += '<div class="gov-intro"><section class="hierarchy-card"><div class="hierarchy-title"><div><span class="tag">CHAÎNE DE COMMANDEMENT</span><h3>Grades de la Marine</h3></div><span class="hierarchy-mark" aria-hidden="true">⚓</span></div><p class="hierarchy-caption">Du plus haut commandement aux forces de terrain · informations visibles jusqu’à ' + escapeHtml(progressArc().name) + '.</p><div class="rank-tree" role="list" aria-label="Arbre des grades de la Marine">';
    rankLevels.forEach(function (level, levelIndex) {
      html += '<div class="rank-tree-level" role="group" aria-label="' + escapeHtml(level.label) + '"><span class="rank-tree-label">' + escapeHtml(level.label) + '</span><div class="rank-tree-nodes">';
      level.ranks.forEach(function (rank) {
        html += '<div class="rank-tree-node' + (levelIndex === 0 ? " rank-tree-top" : "") + '"><span class="rank-tree-node-mark" aria-hidden="true"></span><strong>' + escapeHtml(rank[0]) + '</strong><span>' + escapeHtml(rank[1]) + '</span></div>';
      });
      html += '</div></div>';
      if (levelIndex < rankLevels.length - 1) html += '<div class="rank-tree-link" aria-hidden="true"></div>';
    });
    html += '</div></section><section class="hierarchy-card hierarchy-explainer"><h3>Comment lire ces dossiers</h3><p class="system-card-p">La Marine est la force navale du Gouvernement mondial. Les autres cartes recensent les unités et statuts politiques qui ont été introduits jusqu’à <strong>' + escapeHtml(progressArc().name) + '</strong>.</p><p class="system-card-p">Les membres sont filtrés un par un : le nom d’un groupe ne débloque pas ses futurs membres.</p></section></div>';
    html += '<div class="section-heading"><div><h2>' + systems.filter(function (system) { return system.id !== "ranks"; }).length + ' institutions et systèmes visibles</h2><p>Seuls les statuts connus à ton arc sont affichés.</p></div></div><div class="system-grid">';
    systems.filter(function (system) { return system.id !== "ranks"; }).forEach(function (system) {
      var members = (system.members || []).filter(function (member) { return (member.length > 2 ? member[2] : member[1]) <= state.progress; });
      var status = currentSystemStatus(system);
      var active = !/aboli|dissous/i.test(status);
      html += '<article class="system-card"><div class="system-card-head"><div><span class="tag">' + escapeHtml(system.kind) + '</span><h3>' + escapeHtml(system.name) + '</h3></div><span class="tag">' + (active ? "STATUT" : "HISTORIQUE") + '</span></div><p>' + escapeHtml(system.description) + '</p>';
      if (members.length) {
        html += '<div class="member-list">';
        members.forEach(function (member) {
          html += '<span class="member-chip"><strong>' + escapeHtml(safeCharacterName(member[0])) + '</strong><span>' + escapeHtml(member.length > 2 ? member[1] : "Membre") + '</span></span>';
        });
        html += '</div>';
      }
      html += '<div class="system-status"><span class="status-dot ' + (active ? "" : "off") + '"></span>' + escapeHtml(status) + '</div></article>';
    });
    if (!systems.length) return html + '<div class="empty-state"><strong>Aucun dossier ne correspond</strong>Essaie un autre terme.</div>';
    return html + '</div>';
  }
  return { currentSystemStatus, renderGovernment };
};
