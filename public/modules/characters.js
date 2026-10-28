window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.characters = function (context) {
  var { DATA, state, progressArc, emperorsRevealed, escapeHtml, stripMarks, identityKey, safeCharacterName, filtered, heading, progressHint, favoriteButton } = context;
  var emperorCrewReveal = {"pirates du roux":432,"pirates de barbe blanche":432,"pirates de barbe noire":650,"pirates de big mom":651,"pirates aux cent betes":698,"pirates au chapeau de paille":1053,"cross guild":1058};
  var characterSource = null;
  var characterProgress = null;
  var characterCatalogCache = null;
  var characterArtCache = new Map();
  var affiliationCategories = [
    "Chapeau de paille & alliés",
    "Grands équipages pirates",
    "Autres pirates & corsaires",
    "Marine & Gouvernement",
    "Armée révolutionnaire",
    "Royaumes, îles & peuples",
    "Autres organisations",
    "Affiliation non précisée"
  ];
  var roleCategories = [
    "Capitaines & chefs",
    "Officiers & commandement",
    "Marine & Gouvernement",
    "Dirigeants & nobles",
    "Combattants",
    "Métiers & spécialistes",
    "Membres, alliés & habitants",
    "Peuples & créatures",
    "Autres rôles"
  ];

  function affiliationCategory(value) {
    var label = stripMarks(value);
    if (!label || /non precise|non specifie|sans affiliation|^personnage$|^unknown$/.test(label)) return "Affiliation non précisée";
    if (/faux equipage|fake crew|imposteur/.test(label)) return "Autres pirates & corsaires";
    if (/chapeau de paille|mugiwara|barto club|allie.*luffy/.test(label)) return "Chapeau de paille & alliés";
    if (/armee revolutionnaire|revolutionnaire|revolutionary/.test(label)) return "Armée révolutionnaire";
    if (/marine|gouvernement|world government|cipher pol|\bcp\s*\d|pacifista|sword\b/.test(label)) return "Marine & Gouvernement";
    if (/barbe noire|barbe blanche|big mom|pirates? du roux|cent betes|cross guild|yonko|empereur/.test(label)) return "Grands équipages pirates";
    if (/pirat|corsaire|flotte|equipage/.test(label)) return "Autres pirates & corsaires";
    if (/royaume|kingdom|ile|island|village|tribu|peuple|clan|amazon lily|shandia|kuja|wano|dressrosa|alabasta|skypiea|water seven|mink|homme.?poisson/.test(label)) return "Royaumes, îles & peuples";
    return "Autres organisations";
  }

  function roleCategory(value) {
    var role = stripMarks(value);
    if (!role || /role non precise|non specifie/.test(role)) return "Autres rôles";
    if (/marine|amiral|vice.?amiral|colonel|lieutenant|commodore|cipher pol|\bcp\s*\d|gouvernement mondial|agent du cipher/.test(role)) return "Marine & Gouvernement";
    if (/capitaine|chef d'equipage|chef d'equipe|chef de l|leader|fondateur|fondatrice/.test(role)) return "Capitaines & chefs";
    if (/officier|commandant|second|bras droit|calamite|tete d'affiche|agent|assassin|general/.test(role)) return "Officiers & commandement";
    if (/empereur|yonko|roi\b|reine|prince|princesse|noble|duc|duchesse|maire|dirigeant|dirigeante/.test(role)) return "Dirigeants & nobles";
    if (/combattant|guerrier|samourai|ninja|epeiste|tireur|sniper|soldat|gardien|garde\b|boxeur|chasseur|mercenaire|gladiateur|artilleur|bretteur/.test(role)) return "Combattants";
    if (/cuisinier|navigateur|charpentier|medecin|scientifique|musicien|artisan|ingenieur|historien|archeologue|journaliste|pecheur|marchand|juge|peintre|forgeron|inventeur/.test(role)) return "Métiers & spécialistes";
    if (/membre|allie|habitant|enfant|compagnon|serviteur|sujet|danseur|danseuse|famille|courtisan/.test(role)) return "Membres, alliés & habitants";
    if (/mink|homme.?poisson|sirene|geant|animal|baleine|lion|elephant|zombie|creature|fantome|oiseau|serpent|centaure|harpie|dragon|humain.?poisson/.test(role)) return "Peuples & créatures";
    return "Autres rôles";
  }

  function availableCategories(catalog, selector, orderedCategories) {
    var available = new Set();
    catalog.forEach(function (character) { available.add(selector(character)); });
    return orderedCategories.filter(function (category) { return available.has(category); });
  }

  function availableAffiliationCategories(catalog) {
    var available = new Set();
    catalog.forEach(function (character) {
      characterAffiliations(character).forEach(function (affiliation) { available.add(affiliationCategory(affiliation)); });
    });
    return affiliationCategories.filter(function (category) { return available.has(category); });
  }

  function characterAffiliations(character) {
    var affiliations = Array.isArray(character.affiliations) ? character.affiliations.filter(Boolean) : [];
    return affiliations.length ? affiliations : [character.group || ""];
  }

  function mergeBountyEvents(existing, incoming) {
    var byChapter = new Map();
    (Array.isArray(existing) ? existing : []).concat(Array.isArray(incoming) ? incoming : []).forEach(function (event) {
      var chapter = Number(event && event.chapter);
      if (!event || !Number.isFinite(chapter) || chapter <= 0) return;
      var previous = byChapter.get(chapter);
      if (!previous || Number(event.amount) >= Number(previous.amount)) byChapter.set(chapter, event);
    });
    return Array.from(byChapter.values()).sort(function (left, right) { return Number(left.chapter) - Number(right.chapter); });
  }

  function collectCharacters() {
    if (characterSource === state.characters && characterProgress === state.progress && characterCatalogCache) return characterCatalogCache;
    var result = [];
    var seen = new Map();
    function add(character) {
      var key = identityKey(character.name);
      var existing = seen.get(key);
      var displayName = safeCharacterName(character.name);
      if (!displayName) return;
      if (existing) {
        if (character.catalogued) {
          existing.role = character.role || "Personnage";
          existing.group = character.group || "Affiliation non précisée";
          existing.affiliations = [existing.group];
          existing.knownAt = character.knownAt;
          existing.firstChapter = character.firstChapter;
          existing.description = character.description || "Fiche de personnage à compléter.";
          existing.achievements = Array.isArray(character.achievements) ? character.achievements : [];
          existing.bounties = mergeBountyEvents(existing.bounties,character.bounties);
          existing.image = existing.image || character.image || null;
          existing.imageSource = character.imageSource || existing.imageSource;
          return;
        }
        if (!existing.image && character.image) existing.image = character.image;
        if (character.description && character.description !== character.role) existing.description = character.description;
        if ((!existing.role || existing.role === "Membre") && character.role) existing.role = character.role;
        if (!existing.firstChapter && character.firstChapter) existing.firstChapter = character.firstChapter;
        if (!existing.imageSource && character.imageSource) existing.imageSource = character.imageSource;
        if (Array.isArray(character.achievements) && character.achievements.length) existing.achievements = character.achievements;
        existing.bounties = mergeBountyEvents(existing.bounties,character.bounties);
        if (character.group && !existing.affiliations.some(function (group) { return stripMarks(group) === stripMarks(character.group); })) existing.affiliations.push(character.group);
        return;
      }
      var groups = character.affiliations || (character.group ? [character.group] : []);
      var entry = Object.assign({},character,{name:displayName,group:groups[0] || "Personnage",affiliations:groups.slice()});
      seen.set(key, entry);
      result.push(entry);
    }

    // The arc-filtered catalog endpoint is the source of truth. The static
    // snapshots contain current affiliations and biographies, so merging them
    // here could reintroduce later names after moving the progress selector back.
    (state.characters || []).forEach(function (character) {
      if (character.knownAt <= state.progress) add(character);
    });
    characterSource = state.characters;
    characterProgress = state.progress;
    characterCatalogCache = result.sort(function (a, b) { return a.name.localeCompare(b.name,"fr"); });
    return characterCatalogCache;
  }

  function characterIllustration(character, large) {
    var cacheKey = JSON.stringify([character.name, Boolean(large)]);
    if (characterArtCache.has(cacheKey)) return characterArtCache.get(cacheKey);
    var hash = String(character.name || "?").split("").reduce(function (value, char) { return (value * 31 + char.charCodeAt(0)) >>> 0; }, 11);
    var hue = hash % 360;
    var initial = escapeHtml(String(character.name || "?").slice(0,1).toUpperCase());
    var className = large ? "detail-image character-art-large" : "character-photo character-art";
    var markup = '<svg class="' + className + '" viewBox="0 0 120 140" role="img" aria-label="Illustration de ' + escapeHtml(character.name) + '"><defs><linearGradient id="portrait-' + hash + '" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(' + hue + ' 46% 43%)"/><stop offset="1" stop-color="hsl(' + ((hue + 58) % 360) + ' 48% 17%)"/></linearGradient></defs><rect width="120" height="140" rx="10" fill="url(#portrait-' + hash + ')"/><circle cx="60" cy="49" r="25" fill="#ead9bd"/><path d="M21 133c2-32 18-48 39-48s37 16 39 48" fill="#182129"/><path d="M36 48c2-22 14-32 28-29 14 2 22 12 21 29-13-7-31-7-49 0Z" fill="#20272d"/><circle cx="93" cy="111" r="16" fill="#101b20" stroke="#dfc77c" stroke-width="2"/><text x="93" y="117" text-anchor="middle" fill="#f2e6bf" font-size="17" font-family="serif">' + initial + '</text></svg>';
    characterArtCache.set(cacheKey, markup);
    return markup;
  }

  function characterImage(character, large) {
    var fallback = characterIllustration(character, large);
    if (character.image) return '<img class="' + (large ? 'detail-image' : 'character-photo') + '" src="' + escapeHtml(character.image) + '" alt="Portrait de ' + escapeHtml(character.name) + '" ' + (large ? 'decoding="async"' : 'loading="lazy" decoding="async"') + ' onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>' + fallback + '</span>';
    return fallback;
  }

  function safeEvents(entries) {
    var end = Number(progressArc() && progressArc().chapterEnd) || 0;
    return (Array.isArray(entries) ? entries : []).filter(function (item) { return Number(item.chapter) <= end; }).sort(function (a,b) { return Number(a.chapter)-Number(b.chapter); });
  }

  function bountyText(amount) {
    return new Intl.NumberFormat("fr-FR").format(Number(amount) || 0) + " ฿";
  }

  function estimateBounty(character) {
    if (!character || safeEvents(character.bounties).length) return null;
    var affiliations = Array.isArray(character.affiliations) ? character.affiliations : [];
    var contextText = [character.group, character.role].concat(affiliations).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!/(pirat|baroque works|revolution|revolutionnaire|corsaire|bandit|criminel)/.test(contextText)) return null;
    var role = String(character.role || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var chapterEnd = Number(progressArc() && progressArc().chapterEnd) || 0;
    var emperorCrew = Object.keys(emperorCrewReveal).some(function (name) { return chapterEnd >= emperorCrewReveal[name] && contextText.indexOf(name) >= 0; });
    if (character.greatEmperor || /empereur|yonko/.test(role) || (emperorCrew && /(capitaine|chef d'equipage|leader)/.test(role))) return {min:1500000000,max:5000000000};
    if (emperorCrew && /(commandant|officier|second|bras droit|calamite|tete d'affiche|agent|assassin)/.test(role)) return {min:250000000,max:2000000000};
    if (emperorCrew) return {min:10000000,max:1000000000};
    if (/(capitaine|chef d'equipage|chef d'equipe|leader|roi des pirates|chef de l.?armee revolutionnaire)/.test(role)) return {min:50000000,max:500000000};
    if (/(commandant|officier|second|bras droit|agent|assassin)/.test(role)) return {min:10000000,max:200000000};
    return {min:1000000,max:100000000};
  }

  function estimateText(range) {
    if (!range) return "";
    var billions = range.min >= 1000000000 && range.max >= 1000000000;
    var scale = billions ? 1000000000 : 1000000;
    var unit = billions ? " Md ฿" : " M ฿";
    var format = function (amount) { return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:1}).format(amount / scale); };
    return format(range.min) + "–" + format(range.max) + unit;
  }

  function bountyPoster(character, amount, estimated) {
    var name = escapeHtml(character.name);
    var value = escapeHtml(amount);
    var portrait = character.image
      ? '<img class="bounty-poster-photo" src="' + escapeHtml(character.image) + '" alt="" loading="lazy" decoding="async">'
      : '<span class="bounty-poster-placeholder" aria-hidden="true">' + escapeHtml(String(character.name || "?").slice(0,1).toUpperCase()) + '</span>';
    var label = estimated
      ? "Fiche de prime factice pour " + character.name + " : estimation non officielle de " + amount
      : "Prime connue de " + character.name + " : " + amount;
    return '<span class="character-bounty-poster' + (estimated ? ' is-estimate' : '') + '" role="img" aria-label="' + escapeHtml(label) + '"><span class="bounty-poster-heading">WANTED</span><span class="bounty-poster-portrait">' + portrait + '</span><span class="bounty-poster-copy"><span class="bounty-poster-name">' + name + '</span><span class="bounty-poster-amount">' + value + '</span><span class="bounty-poster-caption">' + (estimated ? 'ESTIMATION · NON OFFICIELLE' : 'DEAD OR ALIVE') + '</span></span></span>';
  }

  function affiliationHue(label) {
    return String(label || "").split("").reduce(function (hash, character) { return (hash * 31 + character.charCodeAt(0)) >>> 0; }, 7) % 360;
  }

  function highlightText(value, query) {
    var text = String(value || "");
    var term = String(query || "").trim();
    if (!term) return escapeHtml(text);
    var index = stripMarks(text).indexOf(stripMarks(term));
    if (index < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0,index)) + '<mark class="character-search-match">' + escapeHtml(text.slice(index,index + term.length)) + '</mark>' + escapeHtml(text.slice(index + term.length));
  }

  function editDistance(left, right) {
    var previous = Array.from({length:right.length + 1},function (_,index) { return index; });
    for (var row = 1; row <= left.length; row += 1) {
      var current = [row];
      for (var column = 1; column <= right.length; column += 1) {
        current[column] = Math.min(current[column - 1] + 1,previous[column] + 1,previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1));
      }
      previous = current;
    }
    return previous[right.length];
  }

  function popularAffiliations(characters) {
    var counts = new Map();
    characters.forEach(function (character) {
      var seen = new Set((character.affiliations || [character.group]).filter(Boolean).map(stripMarks));
      seen.forEach(function (key) { counts.set(key,(counts.get(key) || 0) + 1); });
    });
    return Array.from(counts.entries()).sort(function (left,right) { return right[1] - left[1] || left[0].localeCompare(right[0],"fr"); }).slice(0,4).map(function (entry) {
      return characters.flatMap(function (character) { return character.affiliations || [character.group]; }).find(function (affiliation) { return stripMarks(affiliation) === entry[0]; });
    }).filter(Boolean);
  }

  function characterSuggestions(characters, query) {
    var term = stripMarks(query.trim());
    if (!term) return [];
    var threshold = Math.max(1,Math.min(3,Math.floor(term.length * .3)));
    return characters.map(function (character) {
      var words = stripMarks(character.name).split(/[^a-z0-9]+/).filter(Boolean);
      var distance = words.reduce(function (best,word) { return Math.min(best,editDistance(term,word)); },Infinity);
      return {character:character,distance:distance};
    }).filter(function (entry) { return entry.distance <= threshold; }).sort(function (left,right) { return left.distance - right.distance || left.character.name.localeCompare(right.character.name,"fr"); }).slice(0,3).map(function (entry) { return entry.character; });
  }

  function affiliationBadge(label, query) {
    var safe = String(label || "Affiliation non précisée");
    return '<span class="character-affiliation" style="--affiliation-hue:' + affiliationHue(safe) + '" title="' + escapeHtml(safe) + '"><span class="character-affiliation-mark" aria-hidden="true">' + escapeHtml(safe.slice(0,1).toUpperCase()) + '</span><span>' + highlightText(safe,query) + '</span></span>';
  }

  function bountyRankValue(character) {
    var bounties = safeEvents(character.bounties);
    if (bounties.length) return Number(bounties[bounties.length - 1].amount) || 0;
    var estimate = estimateBounty(character);
    return estimate ? (estimate.min + estimate.max) / 2 : 0;
  }

  function arcForChapter(chapter) {
    return DATA.arcs.find(function (arc) { return Number(chapter) >= arc.chapterStart && Number(chapter) <= arc.chapterEnd; }) || null;
  }

  function renderJourney(character) {
    var achievements = safeEvents(character.achievements);
    var bounties = safeEvents(character.bounties);
    var html = "";
    if (achievements.length) {
      html += '<section class="profile-story"><div class="section-heading detail-section-heading"><div><h2>Parcours et faits marquants</h2><p>Événements révélés jusqu’à ' + escapeHtml(progressArc().name) + '.</p></div></div><ol class="profile-timeline">';
      achievements.forEach(function (event) {
        var arc = arcForChapter(event.chapter);
        html += '<li><span class="profile-timeline-marker"></span><div><span class="profile-timeline-meta">' + escapeHtml(arc ? arc.name : "Manga") + ' · chapitre ' + escapeHtml(event.chapter) + '</span><p>' + escapeHtml(event.text) + '</p></div></li>';
      });
      html += '</ol></section>';
    }
    if (bounties.length) {
      var current = bounties[bounties.length-1];
      var hasSnapshot = bounties.some(function (event) { return event.snapshot === true; });
      var bountyTitle = hasSnapshot ? 'Prime recensée' : 'Évolution de la prime';
      var bountyIntro = hasSnapshot
        ? 'La date de révélation de ce montant n’est pas indexée : il apparaît seulement au dernier arc disponible.'
        : 'La valeur affichée suit les avis de recherche connus à ton arc.';
      html += '<section class="profile-story"><div class="section-heading detail-section-heading"><div><h2>' + bountyTitle + '</h2><p>' + bountyIntro + '</p></div><span class="tag">' + (hasSnapshot ? 'MONTANT DU CATALOGUE' : 'PRIME ACTUELLE') + '</span></div><div class="bounty-current">' + bountyText(current.amount) + '</div><ol class="profile-timeline bounty-timeline">';
      bounties.forEach(function (event) {
        var arc = arcForChapter(event.chapter);
        var meta = event.snapshot === true
          ? 'Montant du catalogue · visible au dernier arc'
          : (arc ? arc.name : "Manga") + ' · chapitre ' + event.chapter;
        html += '<li><span class="profile-timeline-marker"></span><div><span class="profile-timeline-meta">' + escapeHtml(meta) + '</span><p>' + bountyText(event.amount) + '</p></div></li>';
      });
      html += '</ol></section>';
    } else {
      var estimate = estimateBounty(character);
      if (estimate) {
        html += '<section class="profile-story bounty-estimate-card"><div class="section-heading detail-section-heading"><div><h2>Fourchette indicative</h2><p>Estimation non officielle fondée sur le rôle et l’affiliation connus jusqu’à ' + escapeHtml(progressArc().name) + '. Elle ne correspond pas à une prime canonique.</p></div><span class="tag">ESTIMATION</span></div><div class="bounty-current bounty-estimate">' + estimateText(estimate) + '</div></section>';
      }
    }
    return html;
  }

  function renderFights(character) {
    var fights = safeEvents(character.fights);
    var knownCharacters = collectCharacters();
    var html = '<section class="profile-story fight-section"><div class="section-heading detail-section-heading"><div><h2>Combats répertoriés</h2><p>Combats connus jusqu’à ' + escapeHtml(progressArc().name) + '. Chaque résultat reste masqué avant son chapitre.</p></div><span class="tag">' + fights.length + ' combat' + (fights.length > 1 ? 's' : '') + '</span></div>';
    if (!fights.length) return html + '<div class="fight-empty">Aucun combat individuel n’est encore documenté pour cette fiche à ce point du récit.</div></section>';
    html += '<ol class="fight-list">' + fights.slice().sort(function (a,b) { return Number(a.chapter)-Number(b.chapter); }).map(function (fight) {
      var arc = arcForChapter(fight.chapter);
      var opponent = String(fight.opponent || "Adversaire non identifié");
      var opponentKey = String(fight.opponentKey || opponent);
      var visibleOpponent = safeCharacterName(opponentKey) || safeCharacterName(opponent) || opponent;
      var opponentCharacter = knownCharacters.find(function (item) { return identityKey(item.name) === identityKey(opponentKey); })
        || knownCharacters.find(function (item) { return identityKey(item.name) === identityKey(visibleOpponent); });
      var linked = Boolean(opponentCharacter);
      var opponentLabel = opponentCharacter ? opponentCharacter.name : visibleOpponent;
      var opponentMarkup = linked
        ? '<button class="fight-opponent" data-open-character="' + escapeHtml(identityKey(opponentCharacter.name)) + '">' + escapeHtml(opponentLabel) + ' <span aria-hidden="true">↗</span></button>'
        : '<strong class="fight-opponent-name">' + escapeHtml(opponentLabel) + '</strong>';
      return '<li class="fight-row"><div class="fight-row-main"><div class="fight-row-title"><span>' + opponentMarkup + '</span><span class="fight-result">' + escapeHtml(fight.result || "Issue non précisée") + '</span></div><span class="profile-timeline-meta">' + escapeHtml(arc ? arc.name : "Manga") + ' · chapitre ' + escapeHtml(fight.chapter) + '</span><p>' + escapeHtml(fight.summary || "Affrontement recensé dans le récit.") + '</p></div></li>';
    }).join("") + '</ol></section>';
    return html;
  }

  function renderCharacters() {
    var html = heading("INDEX CHRONOLOGIQUE", "Personnages", "Ouvre une fiche pour consulter son portrait, son rôle, ses affiliations et les premiers repères connus à ton arc.", "◎");
    if (!progressArc()) return html + progressHint();
    var catalog = collectCharacters();
    var characters = filtered(state.query, catalog, function (item) {
      return [item.name, item.role, item.group, item.affiliations.join(" ")];
    }).slice();
    var showEmperorFilter = emperorsRevealed();
    if (showEmperorFilter && state.characterEmperorsOnly) characters = characters.filter(function (item) { return item.greatEmperor === true; });
    if (state.characterAffiliation) characters = characters.filter(function (item) { return characterAffiliations(item).some(function (affiliation) { return affiliationCategory(affiliation) === state.characterAffiliation; }); });
    if (state.characterRole) characters = characters.filter(function (item) { return roleCategory(item.role) === state.characterRole; });
    if (state.characterBountyFilter !== "all") characters = characters.filter(function (item) {
      var known = safeEvents(item.bounties).length > 0;
      var estimated = !known && Boolean(estimateBounty(item));
      return state.characterBountyFilter === "known" ? known : state.characterBountyFilter === "estimate" ? estimated : !known && !estimated;
    });
    characters.sort(function (a,b) {
      if (state.characterSort === "bounty") {
        var difference = bountyRankValue(b) - bountyRankValue(a);
        if (difference) return difference;
      }
      return a.name.localeCompare(b.name,"fr");
    });
    var visibleCharacters = characters.slice(0,state.characterLimit);
    var remainingIndexed = Math.max(0, Number(state.characterTotal) - state.characters.length);
    var affiliations = availableAffiliationCategories(catalog);
    var roles = availableCategories(catalog,function (item) { return roleCategory(item.role); },roleCategories);
    var activeFilters = [];
    if (state.query.trim()) activeFilters.push('<button data-clear-character-filter="query" aria-label="Retirer la recherche">Recherche : ' + escapeHtml(state.query) + ' <span aria-hidden="true">×</span></button>');
    if (state.characterAffiliation) activeFilters.push('<button data-clear-character-filter="affiliation">Affiliation : ' + escapeHtml(state.characterAffiliation) + ' <span aria-hidden="true">×</span></button>');
    if (state.characterRole) activeFilters.push('<button data-clear-character-filter="role">Rôle : ' + escapeHtml(state.characterRole) + ' <span aria-hidden="true">×</span></button>');
    if (state.characterBountyFilter !== "all") activeFilters.push('<button data-clear-character-filter="bounty">Prime : ' + (state.characterBountyFilter === "known" ? 'confirmée' : state.characterBountyFilter === "estimate" ? 'estimée' : 'aucune') + ' <span aria-hidden="true">×</span></button>');
    if (showEmperorFilter && state.characterEmperorsOnly) activeFilters.push('<button data-clear-character-filter="emperors">Empereurs <span aria-hidden="true">×</span></button>');
    var hasActiveFilters = activeFilters.length > 0;
    var indexedLabel = hasActiveFilters ? characters.length + ' résultat' + (characters.length > 1 ? 's' : '') : characters.length + remainingIndexed + ' fiches indexées';
    var filtersOpen = state.characterFiltersOpen ? ' open' : '';
    var emperorFilter = showEmperorFilter ? '<button class="character-emperor-filter' + (state.characterEmperorsOnly ? ' is-active' : '') + '" type="button" data-toggle-character-emperors aria-pressed="' + (state.characterEmperorsOnly ? 'true' : 'false') + '"><span aria-hidden="true">✦</span> Empereurs</button>' : '';
    html += '<div class="character-sticky-bar"><div class="character-filter-bar"><label class="filter-search character-search-control"><span aria-hidden="true">⌕</span><input id="characterSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="Nom, rôle ou affiliation…" aria-label="Rechercher un personnage"></label><div class="character-density-control" role="group" aria-label="Densité des cartes"><button type="button" data-character-density="comfortable" aria-pressed="' + (state.characterDensity !== "compact" ? 'true' : 'false') + '" title="Cartes confortables">Confort</button><button type="button" data-character-density="compact" aria-pressed="' + (state.characterDensity === "compact" ? 'true' : 'false') + '" title="Cartes compactes">Compact</button></div></div><details class="character-filter-details" data-character-filter-details' + filtersOpen + '><summary>Filtres et tri <span aria-hidden="true">⌄</span></summary><div class="character-filter-controls"><label class="filter-control"><span>Trier</span><select class="filter-select" data-character-sort aria-label="Trier les personnages"><option value="alpha"' + (state.characterSort === "alpha" ? ' selected' : '') + '>Ordre alphabétique</option><option value="bounty"' + (state.characterSort === "bounty" ? ' selected' : '') + '>Prime décroissante</option></select></label><label class="filter-control"><span>Équipages & groupes</span><select class="filter-select" data-character-affiliation aria-label="Filtrer par équipage ou groupe"><option value="">Tous les équipages et groupes</option>' + affiliations.map(function (affiliation) { return '<option value="' + escapeHtml(affiliation) + '"' + (state.characterAffiliation === affiliation ? ' selected' : '') + '>' + escapeHtml(affiliation) + '</option>'; }).join("") + '</select></label><label class="filter-control"><span>Famille de rôle</span><select class="filter-select" data-character-role aria-label="Filtrer par famille de rôle"><option value="">Tous les rôles</option>' + roles.map(function (role) { return '<option value="' + escapeHtml(role) + '"' + (state.characterRole === role ? ' selected' : '') + '>' + escapeHtml(role) + '</option>'; }).join("") + '</select></label><label class="filter-control"><span>Prime</span><select class="filter-select" data-character-bounty aria-label="Filtrer par statut de prime"><option value="all"' + (state.characterBountyFilter === "all" ? ' selected' : '') + '>Toutes les fiches</option><option value="known"' + (state.characterBountyFilter === "known" ? ' selected' : '') + '>Prime confirmée</option><option value="estimate"' + (state.characterBountyFilter === "estimate" ? ' selected' : '') + '>Estimation</option><option value="none"' + (state.characterBountyFilter === "none" ? ' selected' : '') + '>Sans prime</option></select></label>' + emperorFilter + '</div></details><div class="character-filter-summary"><span class="character-result-count" aria-live="polite">' + indexedLabel + '</span>' + (activeFilters.length ? '<div class="character-active-filters">' + activeFilters.join("") + '<button class="clear-character-filters" data-clear-character-filter="all">Tout effacer</button></div>' : '') + '</div>' + (state.characterSort === "bounty" ? '<p class="bounty-sort-note">Les primes confirmées et les estimations sont indiquées séparément sur chaque avis de recherche.</p>' : '') + '</div><div class="character-grid' + (state.characterDensity === "compact" ? ' is-compact' : '') + '">';
    visibleCharacters.forEach(function (item) {
      var bounties = safeEvents(item.bounties);
      var estimate = bounties.length ? null : estimateBounty(item);
      var bounty = bounties.length
        ? bountyPoster(item,bountyText(bounties[bounties.length-1].amount),false)
        : estimate ? bountyPoster(item,estimateText(estimate),true) : '';
      var emperor = item.greatEmperor ? '<span class="character-emperor-badge">' + escapeHtml(item.emperorTitle || "Empereur connu") + '</span>' : '';
      var characterKey = identityKey(item.name);
      var description = item.description && item.description !== item.role ? item.description : "";
      var needsExpansion = description.length > 150;
      var affiliationLabels = Array.from(new Set((item.affiliations || [item.group]).filter(Boolean)));
      if (!affiliationLabels.length && item.group) affiliationLabels.push(item.group);
      var affiliationMarkup = affiliationLabels.slice(0,2).map(function (label) { return affiliationBadge(label,state.query); }).join("");
      if (affiliationLabels.length > 2) affiliationMarkup += '<span class="character-affiliation-more" title="' + escapeHtml(affiliationLabels.slice(2).join(" · ")) + '">+' + (affiliationLabels.length - 2) + '</span>';
      var summaryId = "character-summary-" + characterKey.replace(/[^a-z0-9_-]/g,"");
      var portraitFallback = '<span class="character-portrait-fallback" aria-hidden="true">' + escapeHtml(item.name.slice(0,1).toUpperCase()) + '</span>';
      var portrait = item.image
        ? '<img class="character-card-photo" src="' + escapeHtml(item.image) + '" alt="Portrait de ' + escapeHtml(item.name) + '" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false">' + portraitFallback.replace('aria-hidden="true"','aria-hidden="true" hidden')
        : portraitFallback;
      html += '<div class="character-card-wrap"><article class="character-card" data-open-character="' + escapeHtml(characterKey) + '" style="--affiliation-hue:' + affiliationHue(item.group || item.name) + '"><header class="character-card-header"><button type="button" class="character-open" data-open-character="' + escapeHtml(characterKey) + '" aria-label="Ouvrir la fiche de ' + escapeHtml(item.name) + '"><span class="character-portrait">' + portrait + '</span><span class="character-card-heading"><strong>' + highlightText(item.name,state.query) + '</strong><span class="character-role">' + highlightText(item.role || "Rôle non précisé",state.query) + '</span></span></button>' + favoriteButton("character",characterKey,item.name,"card-favorite") + '</header><div class="character-card-summary">' + (description ? '<p class="character-description' + (needsExpansion ? ' is-clamped' : '') + '" id="' + escapeHtml(summaryId) + '">' + escapeHtml(description) + '</p>' : '<p class="character-description character-description-empty">Résumé détaillé à découvrir dans la fiche.</p>') + (needsExpansion ? '<button type="button" class="character-summary-toggle" data-expand-character-summary aria-expanded="false" aria-controls="' + escapeHtml(summaryId) + '">Lire le résumé <span aria-hidden="true">⌄</span></button>' : '') + '</div><footer class="character-card-footer"><div class="character-card-footer-main"><div class="character-bounty-slot">' + bounty + '</div><div class="character-card-badges">' + affiliationMarkup + emperor + '</div></div></footer></article></div>';
    });
    if (!characters.length) {
      if (state.catalogLoading) html += '<div class="empty-state"><strong>Chargement des fiches</strong>Le catalogue se met à jour jusqu’à ton arc.</div>';
      else {
        var suggestions = characterSuggestions(catalog,state.query);
        var popular = popularAffiliations(catalog);
        html += '<div class="empty-state character-empty-state"><strong>Aucun personnage trouvé</strong><span>Essaie un autre nom ou explore une affiliation connue.</span><div class="character-suggestions">' + suggestions.map(function (character) { return '<button type="button" data-character-suggestion="query" data-value="' + escapeHtml(character.name) + '">Vouliez-vous dire « ' + escapeHtml(character.name) + ' » ?</button>'; }).join("") + popular.map(function (affiliation) { return '<button type="button" data-character-suggestion="affiliation" data-value="' + escapeHtml(affiliation) + '">' + escapeHtml(affiliation) + '</button>'; }).join("") + (hasActiveFilters ? '<button type="button" data-clear-character-filter="all">Effacer les filtres</button>' : '') + '</div></div>';
      }
    }
    if (characters.length > visibleCharacters.length || remainingIndexed > 0) html += '<button class="show-more" data-show-more>Afficher 60 autres personnages · ' + (Math.max(0, characters.length - visibleCharacters.length) + remainingIndexed) + ' restants</button>';
    return html + '</div>';
  }

  function normalizedAffiliation(value) {
    return stripMarks(value).replace(/[^a-z0-9]+/g," ").trim().replace(/\b(?:au|du)\b/g,"de");
  }

  function crewForAffiliation(label) {
    var target = normalizedAffiliation(label);
    if (!target) return null;
    return (state.crews || []).find(function (crew) {
      if (Number(crew.knownAt) > state.progress) return false;
      var name = normalizedAffiliation(crew.canonicalName || crew.name);
      return name && (target === name || target.indexOf(name) >= 0 || name.indexOf(target) >= 0);
    }) || null;
  }

  function affiliationCrewKey(crew) {
    return String(crew.id || stripMarks(crew.name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
  }

  function marineAffiliation(label) {
    return /marine|gouvernement|world government|cipher pol|\bcp\s*\d|world noble|noble mondial/.test(stripMarks(label));
  }

  function pirateAffiliation(label) {
    return /pirat|corsaire|flotte pirate/.test(stripMarks(label));
  }

  function affiliationVisual(label, crew, isMarine) {
    if (crew && window.GRANDLINE_PAGES && typeof window.GRANDLINE_PAGES.crewImage === "function") {
      return window.GRANDLINE_PAGES.crewImage(crew,false);
    }
    if (isMarine) return '<svg class="character-affiliation-emblem" viewBox="0 0 48 48" role="img" aria-label="Emblème de la Marine"><circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2"/><path d="M24 10v24m-8-6v4a8 8 0 0 0 16 0v-4M17 19l7 5 7-5M13 38l11-5 11 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<span class="character-affiliation-emblem character-affiliation-initial" aria-hidden="true">' + escapeHtml(String(label || "?").slice(0,1).toUpperCase()) + '</span>';
  }

  function renderAffiliationEntry(label) {
    var isMarine = marineAffiliation(label);
    var crew = isMarine ? null : crewForAffiliation(label);
    var isPirate = pirateAffiliation(label);
    var visual = '<span class="character-affiliation-visual">' + affiliationVisual(label,crew,isMarine) + '</span>';
    var copy = '<span class="character-affiliation-copy"><strong>' + escapeHtml(label) + '</strong>';
    var action = crew
      ? '<small>Ouvrir la fiche du groupe ↗</small>'
      : isMarine
        ? '<small>Ouvrir Marine &amp; Gouvernement ↗</small>'
        : isPirate ? '<small>Voir les équipages ↗</small>' : '';
    copy += action + '</span>';
    if (crew) return '<button type="button" class="character-affiliation-entry" data-open-crew="' + escapeHtml(affiliationCrewKey(crew)) + '">' + visual + copy + '</button>';
    if (isMarine) return '<button type="button" class="character-affiliation-entry" data-page="government">' + visual + copy + '</button>';
    if (isPirate) return '<button type="button" class="character-affiliation-entry" data-page="crews">' + visual + copy + '</button>';
    return '<div class="character-affiliation-entry is-static">' + visual + copy + '</div>';
  }

  function renderCharacterDetail(routeKey, returnCrew, returnLocation, returnPage) {
    var characters = collectCharacters();
    var key = String(routeKey || "");
    var character = characters.find(function (item) { return identityKey(item.name) === key || stripMarks(item.name).replace(/[^a-z0-9]+/g,"-") === key; });
    var back = returnLocation
      ? '<button class="detail-back" data-map-location="' + escapeHtml(returnLocation) + '">← Retour à la fiche du lieu</button>'
      : returnCrew
        ? '<button class="detail-back" data-open-crew="' + escapeHtml(returnCrew) + '">← Retour à la fiche de l’équipage</button>'
        : returnPage === "government"
          ? '<button class="detail-back" data-page="government">← Retour à la Marine</button>'
          : '<button class="detail-back" data-return-character-list>← Retour aux personnages</button>';
    if (!progressArc()) return heading("FICHE PERSONNAGE", "Personnage", "Choisis d’abord un arc pour ouvrir les fiches sans spoiler.", "◎") + progressHint();
    if (!character) return heading("FICHE PERSONNAGE", "Fiche indisponible", "Ce personnage n’est pas répertorié dans les informations accessibles jusqu’à ton arc.", "◎") + back;
    var affiliations = character.affiliations.filter(function (item,index,list) { return list.indexOf(item) === index; });
    var firstChapter = Number(character.firstAppearanceChapter || character.firstChapter) || 0;
    var firstArc = DATA.arcs.find(function (arc) { return firstChapter >= Number(arc.chapterStart) && firstChapter <= Number(arc.chapterEnd); }) || DATA.arcs[character.knownAt] || progressArc();
    var firstChapterLabel = character.firstAppearanceChapter == null ? "Premier repère connu" : "Première apparition connue";
    var description = character.description && character.description !== character.role
      ? character.description
      : character.name + ' est répertorié' + (character.role ? ' comme ' + character.role.toLowerCase() : '') + (affiliations.length ? ' et rattaché' + (character.role && /e$/.test(character.role) ? 'e' : '') + ' à ' + affiliations.join(', ') : '') + '.';
    var emperor = character.greatEmperor ? '<span>' + escapeHtml(character.emperorTitle || "Empereur connu à cet arc") + '</span>' : '';
    var characterKey = identityKey(character.name);
    var html = back + '<section class="detail-hero character-detail-hero">' + characterImage(character,true) + '<div class="detail-hero-copy"><span class="eyebrow">FICHE PERSONNAGE</span><h1>' + escapeHtml(character.name) + '</h1><p>' + escapeHtml(description) + '</p><div class="detail-badges"><span>' + escapeHtml(character.role || "Rôle non précisé") + '</span><span>' + escapeHtml(firstChapterLabel) + ' · ' + escapeHtml(firstArc.name) + (character.firstChapter ? ' · chapitre ' + escapeHtml(character.firstChapter) : '') + '</span>' + emperor + '</div><div class="favorite-detail-row">' + favoriteButton("character",characterKey,character.name,"favorite-inline") + '<span>Garder ce personnage dans mes favoris</span></div></div></section>';
    html += '<div class="detail-facts-grid"><article class="detail-fact"><span>Rôle documenté</span><strong>' + escapeHtml(character.role || "Non précisé") + '</strong></article><article class="detail-fact character-affiliation-fact"><span>Affiliation' + (affiliations.length > 1 ? 's' : '') + '</span><div class="character-affiliation-list">' + (affiliations.length ? affiliations.map(renderAffiliationEntry).join("") : '<div class="character-affiliation-entry is-static"><span class="character-affiliation-visual"><span class="character-affiliation-emblem character-affiliation-initial" aria-hidden="true">?</span></span><span class="character-affiliation-copy"><strong>Non précisée</strong></span></div>') + '</div></article><article class="detail-fact"><span>Repère de la fiche</span><strong>' + escapeHtml(firstArc.name) + '</strong></article></div>';
    return html + renderJourney(character) + renderFights(character);
  }

  return { collectCharacters, renderCharacters, renderCharacterDetail, characterImage };
};
