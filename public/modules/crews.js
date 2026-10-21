window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.crews = function (context) {
  var { DATA, state, progressArc, emperorsRevealed, escapeHtml, stripMarks, identityKey, safeCharacterName, filtered, heading, progressHint } = context;
  var bountyIndex = null;
  var bountySource = null;
  var crewSource = null;
  var crewProgress = null;
  var crewCatalogCache = null;
  var visibleMemberCache = new WeakMap();
  var crewArtCache = new Map();
  var emperorCrewReveal = {"red-hair":432,"whitebeard":432,"blackbeard":650,"big-mom":651,"beasts":698,"straw-hats":1053,"cross-guild":1058};
  var emperorCrewRanges = {
    "red-hair":{min:5000000000,max:25000000000},
    "blackbeard":{min:4000000000,max:30000000000},
    "whitebeard":{min:10000000000,max:50000000000},
    "big-mom":{min:8000000000,max:40000000000},
    "beasts":{min:8000000000,max:40000000000},
    "straw-hats":{min:1000000000,max:20000000000},
    "cross-guild":{min:3000000000,max:25000000000}
  };

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  }

  function isPirateCrew(crew) {
    var id = normalize(crew && crew.id).replace(/[^a-z0-9]+/g,"-");
    if (id === "marines" || id === "marine") return false;
    var name = normalize(crew && crew.name).trim();
    var tag = normalize(crew && crew.tag);
    return /pirat|flotte pirate/.test(tag) || /^(les )?pirates?\b/.test(name) || ["grand-fleet","cross-guild","nox-pirates"].indexOf(id) >= 0;
  }

  function isEmperorCrew(crew) {
    var end = Number(progressArc() && progressArc().chapterEnd) || 0;
    var reveal = emperorCrewReveal[String(crew && crew.id || "")];
    return Boolean(crew && crew.greatEmperor) || Boolean(reveal && reveal <= end);
  }

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
    if (crewSource === state.crews && crewProgress === state.progress && crewCatalogCache) return crewCatalogCache;
    // API results are already filtered by chapter, including staged descriptions.
    // Static snapshots can contain current crew names and must not be merged back in.
    var end = Number(progressArc() && progressArc().chapterEnd) || 0;
    crewCatalogCache = (state.crews || []).filter(function (crew) { return Number(crew.knownAt) <= state.progress; }).map(function (crew) {
      var copy = Object.assign({},crew,{members:(crew.members || []).map(memberData)});
      if (copy.nameRevealChapter && end < Number(copy.nameRevealChapter)) copy.name = copy.preRevealName || copy.name;
      if (copy.descriptionChapter && end >= Number(copy.descriptionChapter)) copy.description = copy.description;
      else if (copy.middleRevealDescription && end >= Number(copy.middleRevealChapter)) copy.description = copy.middleRevealDescription;
      else if (copy.preRevealDescription) copy.description = copy.preRevealDescription;
      return copy;
    });
    crewSource = state.crews;
    crewProgress = state.progress;
    visibleMemberCache = new WeakMap();
    return crewCatalogCache;
  }

  function visibleMembers(crew) {
    var cached = visibleMemberCache.get(crew);
    if (cached) return cached;
    var members = (crew.members || []).map(memberData).filter(function (member) {
      return Number.isFinite(member.knownAt) && member.knownAt <= state.progress && safeCharacterName(member.name);
    }).map(function (member) {
      member.displayName = safeCharacterName(member.name);
      return member;
    });
    visibleMemberCache.set(crew, members);
    return members;
  }

  function prepareBountyIndex() {
    if (bountySource === state.characters && bountyIndex) return;
    bountyIndex = new Map();
    (state.characters || []).forEach(function (item) { bountyIndex.set(identityKey(item.name), item); });
    bountySource = state.characters;
  }

  function crewIllustration(crew, large) {
    var cacheKey = JSON.stringify([crew.name, Boolean(large)]);
    if (crewArtCache.has(cacheKey)) return crewArtCache.get(cacheKey);
    var hash = String(crew.name || "").split("").reduce(function (value,char) { return (value * 31 + char.charCodeAt(0)) >>> 0; }, 13);
    var hue = hash % 360;
    var className = large ? "detail-image crew-art-large" : "crew-photo crew-art";
    var markup = '<svg class="' + className + ' crew-flag-art" viewBox="0 0 120 100" role="img" aria-label="Pavillon illustré de ' + escapeHtml(crew.name) + '"><defs><linearGradient id="crew-' + hash + '" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(' + hue + ' 52% 38%)"/><stop offset="1" stop-color="hsl(' + ((hue + 66) % 360) + ' 56% 17%)"/></linearGradient></defs><rect width="120" height="100" rx="10" fill="#11191c"/><path d="M14 10v80" stroke="#c5ae75" stroke-width="3"/><path d="M17 17h87v62H17l9-31Z" fill="url(#crew-' + hash + ')" stroke="#e7d6a8" stroke-width="2"/><circle cx="62" cy="48" r="21" fill="#f2ead5"/><path d="M49 43c2-11 9-15 14-13 6 2 11 7 12 14-8-3-17-3-26-1Z" fill="#182125"/><circle cx="55" cy="48" r="2.3" fill="#11191c"/><circle cx="69" cy="48" r="2.3" fill="#11191c"/><path d="M57 59c3 2 8 2 11 0" fill="none" stroke="#11191c" stroke-width="2" stroke-linecap="round"/><path d="m40 69 13-4 6 4 6-4 13 4M42 72l14-3m8 0 14 3" fill="none" stroke="#f2ead5" stroke-width="2" stroke-linecap="round"/><text x="98" y="72" text-anchor="end" fill="#f5e7bf" font-size="9" font-weight="700" font-family="sans-serif">' + escapeHtml(String(crew.name || "Équipage").slice(0,1).toUpperCase()) + '</text></svg>';
    crewArtCache.set(cacheKey, markup);
    return markup;
  }

  function crewImage(crew, large) {
    var art = crewIllustration(crew, large);
    if (crew.image) return '<img class="' + (large ? 'detail-image' : 'crew-photo') + ' crew-flag-image" src="' + escapeHtml(crew.image) + '" alt="Drapeau de ' + escapeHtml(crew.name) + '" ' + (large ? 'decoding="async"' : 'loading="lazy" decoding="async"') + ' onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>' + art + '</span>';
    return art;
  }

  function bountyForCharacter(name) {
    var key = identityKey(name);
    var character = bountyIndex ? bountyIndex.get(key) : (state.characters || []).find(function (item) { return identityKey(item.name) === key; });
    var bounties = character && Array.isArray(character.bounties) ? character.bounties : [];
    return bounties.length ? Number(bounties[bounties.length - 1].amount) || 0 : 0;
  }

  function estimateBounty(character, member, crew) {
    if (character && Array.isArray(character.bounties) && character.bounties.some(function (item) { return Number(item.chapter) <= Number(progressArc() && progressArc().chapterEnd); })) return null;
    if (!isPirateCrew(crew)) return null;
    var role = normalize((member && member.role) || (character && character.role) || "");
    var emperorCrew = isEmperorCrew(crew);
    if (emperorCrew && /(capitaine|empereur|yonko|chef d'equipage|leader)/.test(role)) return {min:1500000000,max:5000000000};
    if (emperorCrew && /(commandant|officier|second|bras droit|calamite|tete d'affiche|agent|assassin)/.test(role)) return {min:250000000,max:2000000000};
    if (emperorCrew) return {min:10000000,max:1000000000};
    if (/(capitaine|chef d'equipage|chef d'equipe|leader|roi des pirates)/.test(role)) return {min:50000000,max:500000000};
    if (/(commandant|officier|second|bras droit|agent|assassin)/.test(role)) return {min:10000000,max:200000000};
    return {min:1000000,max:100000000};
  }

  function crewBounty(crew) {
    var amount = 0;
    var known = 0;
    var estimatedMin = 0;
    var estimatedMax = 0;
    var estimatedCount = 0;
    var unestimatedCount = 0;
    visibleMembers(crew).forEach(function (member) {
      var bounty = bountyForCharacter(member.name);
      if (bounty > 0) {
        amount += bounty;
        known += 1;
        estimatedMin += bounty;
        estimatedMax += bounty;
      } else {
        var character = bountyIndex ? bountyIndex.get(identityKey(member.name)) : null;
        var estimate = estimateBounty(character, member, crew);
        if (estimate) {
          estimatedMin += estimate.min;
          estimatedMax += estimate.max;
          estimatedCount += 1;
        } else {
          unestimatedCount += 1;
        }
      }
    });
    if (isEmperorCrew(crew)) {
      var groupRange = emperorCrewRanges[String(crew.id || "")] || {min:5000000000,max:40000000000};
      var totalMin = Math.max(groupRange.min,amount + estimatedMin);
      var totalMax = Math.max(groupRange.max,amount + estimatedMax);
      return { amount:amount, known:known, estimatedMin:totalMin, estimatedMax:totalMax, estimatedCount:1, unestimatedCount:unestimatedCount, sortAmount:(totalMin + totalMax) / 2, groupEstimate:true };
    }
    return { amount:amount, known:known, estimatedMin:estimatedMin, estimatedMax:estimatedMax, estimatedCount:estimatedCount, unestimatedCount:unestimatedCount, sortAmount:estimatedCount ? (estimatedMin + estimatedMax) / 2 : amount };
  }

  function bountyText(amount) {
    return new Intl.NumberFormat("fr-FR").format(Number(amount) || 0) + " ฿";
  }

  function bountyRangeText(min, max) {
    var billions = min >= 1000000000 && max >= 1000000000;
    var scale = billions ? 1000000000 : 1000000;
    var unit = billions ? " Md ฿" : " M ฿";
    var format = function (amount) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:1}).format(amount / scale); };
    return format(min) + "–" + format(max) + unit;
  }

  function crewBountyLabel(bounty) {
    if (bounty.groupEstimate) return 'Estimation globale non officielle · ' + bountyRangeText(bounty.estimatedMin,bounty.estimatedMax);
    if (bounty.estimatedCount && bounty.unestimatedCount) return 'Estimation partielle · ' + bountyRangeText(bounty.estimatedMin,bounty.estimatedMax) + ' (' + bounty.estimatedCount + ' estimation' + (bounty.estimatedCount > 1 ? 's' : '') + ')';
    if (bounty.estimatedCount && bounty.known) return 'Total indicatif · ' + bountyRangeText(bounty.estimatedMin,bounty.estimatedMax);
    if (bounty.estimatedCount) return 'Estimation non officielle · ' + bountyRangeText(bounty.estimatedMin,bounty.estimatedMax);
    if (bounty.known) return 'Primes connues · ' + bountyText(bounty.amount) + ' (' + bounty.known + ' membre' + (bounty.known > 1 ? 's' : '') + ')';
    return 'Pas assez d’indices pour estimer';
  }

  function memberImageMarkup(member, large) {
    var hash = String(member.name || "").split("").reduce(function (value,char) { return (value * 31 + char.charCodeAt(0)) >>> 0; }, 17);
    var hue = hash % 360;
    var className = large ? "detail-member-photo member-art-large" : "detail-member-photo member-art";
    var fallback = '<svg class="' + className + '" viewBox="0 0 80 96" role="img" aria-label="Illustration de ' + escapeHtml(member.displayName || member.name) + '"><defs><linearGradient id="member-' + hash + '" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(' + hue + ' 48% 42%)"/><stop offset="1" stop-color="hsl(' + ((hue + 52) % 360) + ' 45% 17%)"/></linearGradient></defs><rect width="80" height="96" rx="7" fill="url(#member-' + hash + ')"/><circle cx="40" cy="33" r="16" fill="#ead9bd"/><path d="M12 92c1-23 11-35 28-35s27 12 28 35" fill="#172329"/><circle cx="61" cy="75" r="11" fill="#101b20" stroke="#dfc77c"/><text x="61" y="79" text-anchor="middle" fill="#f2e6bf" font-size="11" font-family="serif">' + escapeHtml(String(member.displayName || member.name || "?").slice(0,1).toUpperCase()) + '</text></svg>';
    if (member.image) return '<img class="' + (large ? 'detail-member-photo' : 'detail-member-photo') + '" src="' + escapeHtml(member.image) + '" alt="Portrait de ' + escapeHtml(member.displayName || member.name) + '" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>' + fallback + '</span>';
    return fallback;
  }

  function safeAchievements(crew) {
    var end = Number(progressArc() && progressArc().chapterEnd) || 0;
    return (Array.isArray(crew.achievements) ? crew.achievements : []).filter(function (item) { return Number(item.chapter) <= end; }).sort(function (a,b) { return Number(a.chapter)-Number(b.chapter); });
  }

  function arcForChapter(chapter) {
    return DATA.arcs.find(function (arc) { return Number(chapter) >= arc.chapterStart && Number(chapter) <= arc.chapterEnd; }) || null;
  }

  function renderCrewAchievements(crew) {
    var events = safeAchievements(crew);
    if (!events.length) return "";
    return '<section class="profile-story"><div class="section-heading detail-section-heading"><div><h2>Repères et accomplissements</h2><p>Repères dévoilés jusqu’à ' + escapeHtml(progressArc().name) + '.</p></div></div><ol class="profile-timeline">' + events.map(function (event) {
      var arc = arcForChapter(event.chapter);
      return '<li><span class="profile-timeline-marker"></span><div><span class="profile-timeline-meta">' + escapeHtml(arc ? arc.name : "Manga") + ' · chapitre ' + escapeHtml(event.chapter) + '</span><p>' + escapeHtml(event.text) + '</p></div></li>';
    }).join("") + '</ol></section>';
  }

  function renderCrews() {
    prepareBountyIndex();
    var html = heading("ATLAS DES PIRATES", "Équipages", "Ouvre une fiche pour découvrir l’histoire, la composition et les membres déjà révélés à ton point de progression.", "⚑");
    if (!progressArc()) return html + progressHint();
    var groups = filtered(state.query, collectCrews().filter(isPirateCrew), function (crew) {
      return [crew.name, crew.tag, crew.description].concat(visibleMembers(crew).map(function (member) { return member.displayName; }));
    });
    var showEmperorFilter = emperorsRevealed();
    if (showEmperorFilter && state.crewEmperorsOnly) groups = groups.filter(function (crew) { return crew.greatEmperor === true; });
    groups.sort(function (a,b) {
      if (state.crewSort === "bounty") {
        var difference = crewBounty(b).sortAmount - crewBounty(a).sortAmount;
        if (difference) return difference;
      }
      return a.name.localeCompare(b.name,"fr");
    });
    html += '<div class="filter-row catalog-filters crew-catalog-filters"><div class="crew-search-control"><span class="crew-control-label">Rechercher</span><label class="filter-search"><span aria-hidden="true">⌕</span><input id="crewSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="Nom ou membre d’équipage…" aria-label="Rechercher un équipage ou un membre"></label></div><label class="filter-control"><span>Trier</span><select class="filter-select" data-crew-sort aria-label="Trier les équipages"><option value="alpha"' + (state.crewSort === "alpha" ? ' selected' : '') + '>Ordre alphabétique</option><option value="bounty"' + (state.crewSort === "bounty" ? ' selected' : '') + '>Prime totale décroissante</option></select></label>' + (showEmperorFilter ? '<label class="filter-control"><span>Empereurs</span><select class="filter-select" data-crew-emperors aria-label="Filtrer les équipages empereurs"><option value="no"' + (!state.crewEmperorsOnly ? ' selected' : '') + '>Tous les équipages</option><option value="yes"' + (state.crewEmperorsOnly ? ' selected' : '') + '>Équipages d’un Empereur connu</option></select></label>' : '') + '</div>' + (state.crewSort === "bounty" ? '<p class="bounty-sort-note">Les primes officielles sont limitées à ton arc. Les estimations d’équipages d’Empereur couvrent volontairement un groupe entier, y compris les membres non recensés; elles ne sont jamais des montants canoniques. Le tri utilise le milieu de la fourchette.</p>' : '');
    if (!groups.length) return html + (state.catalogLoading
      ? '<div class="empty-state"><strong>Chargement des fiches</strong>Les équipages et organisations se mettent à jour jusqu’à ton arc.</div>'
      : '<div class="empty-state"><strong>Aucun équipage pirate trouvé</strong>Essaie un autre nom.</div>');
    html += '<div class="section-heading"><div><h2>' + groups.length + ' équipages pirates</h2><p>Progression : jusqu’à ' + escapeHtml(progressArc().name) + '.</p></div><span class="tag">FICHES FILTRÉES</span></div><div class="crew-grid">';
    groups.forEach(function (crew) {
      var members = visibleMembers(crew);
      var key = crewKey(crew);
      var crewImageMarkup = crewImage(crew,false);
      var bounty = crewBounty(crew);
      var emperorBadge = crew.greatEmperor ? '<span class="crew-emperor-badge">' + escapeHtml(crew.emperorTitle || "Empereur connu") + '</span>' : '';
      html += '<article class="crew-card"><button class="crew-head crew-open" data-open-crew="' + escapeHtml(key) + '" aria-label="Ouvrir la fiche de ' + escapeHtml(crew.name) + '">' + crewImageMarkup + '<span class="crew-head-copy"><strong>' + escapeHtml(crew.name) + '</strong><span>' + escapeHtml(crew.description || "La composition se dévoile au fil des apparitions.") + '</span><span class="crew-card-stats">' + escapeHtml(crewBountyLabel(bounty)) + emperorBadge + '<span class="tag">' + escapeHtml(crew.tag || "Équipage") + '</span></span></span><span class="crew-open-mark" aria-hidden="true">↗</span></button><div class="member-list">';
      members.slice(0,6).forEach(function (member) {
        html += '<button class="member-chip" data-open-character="' + escapeHtml(identityKey(member.name)) + '"><strong>' + escapeHtml(member.displayName) + '</strong><span>' + escapeHtml(member.role) + '</span></button>';
      });
      if (members.length > 6) html += '<span class="member-chip member-more">+' + (members.length - 6) + ' autres membres</span>';
      html += '</div></article>';
    });
    return html + '</div>';
  }

  function renderCrewDetail(routeKey) {
    prepareBountyIndex();
    var crews = collectCrews();
    var key = String(routeKey || "");
    var crew = crews.find(function (item) { return crewKey(item) === key || stripMarks(item.name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") === key; });
    if (!progressArc()) return heading("FICHE D’ÉQUIPAGE", "Équipage", "Choisis d’abord un arc pour ouvrir les fiches sans spoiler.", "⚑") + progressHint();
    if (!crew) return heading("FICHE D’ÉQUIPAGE", "Fiche indisponible", "Cet équipage n’est pas répertorié dans les informations accessibles jusqu’à ton arc.", "⚑") + '<button class="button-secondary detail-back" data-page="crews">← Retour aux équipages</button>';
    var members = visibleMembers(crew);
    var portrait = crewImage(crew,true);
    var crewPrice = crewBounty(crew);
    var emperorLabel = crew.greatEmperor ? '<span>' + escapeHtml(crew.emperorTitle || "Empereur connu à cet arc") + '</span>' : '';
    var html = '<button class="detail-back" data-page="crews">← Retour aux équipages</button><section class="detail-hero crew-detail-hero">' + portrait + '<div class="detail-hero-copy"><span class="eyebrow">' + escapeHtml(crew.tag || "Équipage") + '</span><h1>' + escapeHtml(crew.name) + '</h1><p>' + escapeHtml(crew.description || "La composition et les repères de cet équipage se dévoilent au fil de l’histoire.") + '</p><div class="detail-badges"><span>' + members.length + ' membre' + (members.length > 1 ? 's' : '') + ' connu' + (members.length > 1 ? 's' : '') + '</span><span>Repère : ' + escapeHtml(progressArc().name) + '</span><span>' + escapeHtml(crewBountyLabel(crewPrice)) + '</span>' + emperorLabel + '</div></div></section>';
    html += renderCrewAchievements(crew);
    html += window.GRANDLINE_PAGES.renderCrewShips(crewKey(crew));
    html += '<div class="section-heading detail-section-heading"><div><h2>Membres connus</h2><p>Les membres dont la première apparition se situe après ton arc restent masqués.</p></div></div><div class="detail-member-grid">';
    members.forEach(function (member) {
      var image = memberImageMarkup(member,true);
      var description = member.description && member.description !== member.role ? '<p>' + escapeHtml(member.description) + '</p>' : '';
      html += '<button class="detail-member-card" data-open-character="' + escapeHtml(identityKey(member.name)) + '" data-return-crew="' + escapeHtml(crewKey(crew)) + '">' + image + '<span class="detail-member-copy"><strong>' + escapeHtml(member.displayName) + '</strong><span>' + escapeHtml(member.role) + '</span>' + description + '</span><span class="detail-member-arrow" aria-hidden="true">↗</span></button>';
    });
    if (!members.length) html += '<div class="empty-state"><strong>Aucun membre confirmé à cet arc</strong>La fiche de l’équipage est accessible, mais sa composition n’est pas encore documentée.</div>';
    return html + '</div>';
  }

  return { renderCrews, renderCrewDetail, collectCrews };
};
