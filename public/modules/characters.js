window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.characters = function (context) {
  var { DATA, state, progressArc, emperorsRevealed, escapeHtml, stripMarks, identityKey, safeCharacterName, filtered, heading, progressHint, favoriteButton } = context;
  var emperorCrewReveal = {"pirates du roux":432,"pirates de barbe blanche":432,"pirates de barbe noire":650,"pirates de big mom":651,"pirates aux cent betes":698,"pirates au chapeau de paille":1053,"cross guild":1058};
  var characterSource = null;
  var characterProgress = null;
  var characterCatalogCache = null;
  var characterArtCache = new Map();

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
          existing.bounties = Array.isArray(character.bounties) ? character.bounties : [];
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
        if (Array.isArray(character.bounties) && character.bounties.length) existing.bounties = character.bounties;
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
    var characters = filtered(state.query, collectCharacters(), function (item) {
      return [item.name, item.role, item.group, item.affiliations.join(" ")];
    }).slice();
    var showEmperorFilter = emperorsRevealed();
    if (showEmperorFilter && state.characterEmperorsOnly) characters = characters.filter(function (item) { return item.greatEmperor === true; });
    characters.sort(function (a,b) {
      if (state.characterSort === "bounty") {
        var difference = bountyRankValue(b) - bountyRankValue(a);
        if (difference) return difference;
      }
      return a.name.localeCompare(b.name,"fr");
    });
    var visibleCharacters = characters.slice(0,state.characterLimit);
    var remainingIndexed = Math.max(0, Number(state.characterTotal) - state.characters.length);
    html += '<div class="filter-row catalog-filters"><label class="filter-search"><span>⌕</span><input id="characterSearch" type="search" value="' + escapeHtml(state.query) + '" placeholder="Nom, rôle ou affiliation…"></label><label class="filter-control"><span>Trier</span><select class="filter-select" data-character-sort aria-label="Trier les personnages"><option value="alpha"' + (state.characterSort === "alpha" ? ' selected' : '') + '>Ordre alphabétique</option><option value="bounty"' + (state.characterSort === "bounty" ? ' selected' : '') + '>Prime décroissante</option></select></label>' + (showEmperorFilter ? '<label class="filter-control"><span>Empereurs</span><select class="filter-select" data-character-emperors aria-label="Filtrer les personnages empereurs"><option value="no"' + (!state.characterEmperorsOnly ? ' selected' : '') + '>Tous les personnages</option><option value="yes"' + (state.characterEmperorsOnly ? ' selected' : '') + '>Empereur connu à cet arc</option></select></label>' : '') + '<span class="result-count">' + (characters.length + remainingIndexed) + ' fiches indexées</span></div>' + (state.characterSort === "bounty" ? '<p class="bounty-sort-note">Les primes connues restent canoniques jusqu’à ton arc. Les estimations sont non officielles et volontairement larges, surtout pour les équipages d’Empereur. Le tri utilise le milieu de la fourchette.</p>' : '') + '<div class="character-grid">';
    visibleCharacters.forEach(function (item) {
      var bounties = safeEvents(item.bounties);
      var estimate = bounties.length ? null : estimateBounty(item);
      var bounty = bounties.length ? '<span class="character-bounty">Prime connue · ' + bountyText(bounties[bounties.length-1].amount) + '</span>' : (estimate ? '<span class="character-bounty bounty-estimate">Estimation · ' + estimateText(estimate) + '</span>' : '');
      var emperor = item.greatEmperor ? '<span class="character-emperor-badge">' + escapeHtml(item.emperorTitle || "Empereur connu") + '</span>' : '';
      var characterKey = identityKey(item.name);
      html += '<div class="character-card-wrap"><button class="character-card character-open" data-open-character="' + escapeHtml(characterKey) + '">' + characterImage(item,false) + '<span class="character-card-copy"><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.role) + ' · ' + escapeHtml(item.group) + '</span>' + (item.description && item.description !== item.role ? '<span class="character-description">' + escapeHtml(item.description) + '</span>' : '') + bounty + emperor + '</span><span class="character-open-mark" aria-hidden="true">↗</span></button>' + favoriteButton("character",characterKey,item.name,"card-favorite") + '</div>';
    });
    if (!characters.length) html += state.catalogLoading
      ? '<div class="empty-state"><strong>Chargement des fiches</strong>Le catalogue se met à jour jusqu’à ton arc.</div>'
      : '<div class="empty-state"><strong>Aucun personnage trouvé</strong>Essaie un autre nom.</div>';
    if (characters.length > visibleCharacters.length || remainingIndexed > 0) html += '<button class="show-more" data-show-more>Afficher 60 autres personnages · ' + (Math.max(0, characters.length - visibleCharacters.length) + remainingIndexed) + ' restants</button>';
    return html + '</div>';
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
          : '<button class="detail-back" data-page="characters">← Retour aux personnages</button>';
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
    html += '<div class="detail-facts-grid"><article class="detail-fact"><span>Rôle documenté</span><strong>' + escapeHtml(character.role || "Non précisé") + '</strong></article><article class="detail-fact"><span>Affiliation' + (affiliations.length > 1 ? 's' : '') + '</span><strong>' + escapeHtml(affiliations.join(" · ") || "Non précisée") + '</strong></article><article class="detail-fact"><span>Repère de la fiche</span><strong>' + escapeHtml(firstArc.name) + '</strong></article></div>';
    return html + renderJourney(character) + renderFights(character);
  }

  return { collectCharacters, renderCharacters, renderCharacterDetail, characterImage };
};
