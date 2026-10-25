window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.fruits = function (context) {
  var { DATA, state, progressArc, escapeHtml, stripMarks, identityKey, safeCharacterName, filtered, heading, progressHint, favoriteButton } = context;
  var illustrationCache = new Map();
  var fruitSource = null;
  var fruitProgress = null;
  var fruitCatalogCache = null;

  function fruitKey(value) {
    return stripMarks(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function knownFruitModel(fruit) {
    var model = String(fruit.model || "").trim();
    return /^(unknown|inconnu|none|null|à confirmer|a confirmer)$/i.test(model) ? "" : model;
  }

  function fruitIdentity(fruit) {
    var name = normalizeFruitType(fruit.name);
    var model = knownFruitModel(fruit);
    var nameHasModel = /,\s*(?:model|mod[eè]le)\s+/i.test(String(fruit.name || ""));
    if (name === normalizeFruitType("Gomu Gomu no Mi") || nameHasModel) model = "";
    return name + (model ? "::" + normalizeFruitType(model) : "");
  }

  function fruitDisplayName(fruit) {
    var model = knownFruitModel(fruit);
    if (normalizeFruitType(fruit.name) === normalizeFruitType("Gomu Gomu no Mi")) return fruit.name;
    if (!model || /,\s*(?:model|mod[eè]le)\s+/i.test(String(fruit.name || "")) || normalizeFruitType(fruit.name).indexOf(normalizeFruitType(model)) !== -1) return fruit.name;
    return fruit.name + ", modèle " + model;
  }

  function fruitRouteKey(fruit) {
    var model = knownFruitModel(fruit);
    if (/,\s*(?:model|mod[eè]le)\s+/i.test(String(fruit.name || "")) || normalizeFruitType(fruit.name) === normalizeFruitType("Gomu Gomu no Mi")) model = "";
    return fruitKey(fruit.name + (model ? " " + model : ""));
  }

  function fruitIllustration(fruit, index) {
    var acceptedImage = fruitImageIsFruit(fruit, fruit.image) ? fruit.image : null;
    var displayName = fruitDisplayName(fruit);
    var cacheKey = JSON.stringify([displayName, acceptedImage || "", fruit.imageSource || ""]);
    if (illustrationCache.has(cacheKey)) return illustrationCache.get(cacheKey);
    var sourceImage = "";
    if (acceptedImage) {
      var source = fruit.imageSource || "https://www.onepieceapi.com/documentation";
      sourceImage = '<img class="fruit-source-image" src="' + escapeHtml(acceptedImage) + '" alt="Image du fruit ' + escapeHtml(displayName) + '" loading="lazy" decoding="async" onerror="this.hidden=true;this.parentElement.querySelector(\'.fruit-art-fallback\').hidden=false"><span class="fruit-image-credit" title="Source : ' + escapeHtml(source) + '">Image du fruit · source référencée</span>';
    }
    var hash = String(displayName || index).split("").reduce(function (value, char) { return (value * 31 + char.charCodeAt(0)) >>> 0; }, 7);
    var hue = hash % 360;
    var colors = ["hsl(" + hue + " 68% 79%)", "hsl(" + hue + " 62% 48%)", "hsl(" + ((hue + 78) % 360) + " 52% 69%)", "hsl(" + ((hue + 155) % 360) + " 46% 54%)"];
    var id = "fruit-skin-" + hash + "-" + fruitKey(displayName || index);
    var shape = hash % 3;
    var silhouette = shape === 0
      ? "M110 47 C96 31 84 31 72 42 C54 36 40 51 39 72 C35 99 50 128 73 132 C83 134 91 127 98 127 C107 134 119 133 129 125 C152 106 154 74 141 54 C133 42 121 40 110 47Z"
      : shape === 1
        ? "M103 39 C92 29 79 35 73 48 C55 42 43 56 45 79 C46 99 56 126 76 134 C88 139 96 131 103 127 C111 133 124 133 134 123 C151 106 148 73 137 56 C129 43 116 38 103 39Z"
        : "M106 42 C91 31 81 37 72 49 C57 41 43 53 40 73 C36 97 50 124 68 132 C82 139 94 127 101 127 C111 138 125 132 136 120 C153 101 149 72 138 55 C130 42 118 38 106 42Z";
    var curlOffset = hash % 2 ? 1 : -1;
    var generated = '<svg class="fruit-art" viewBox="0 0 200 170" role="img" aria-label="Illustration générée d’un fruit fantastique pour ' + escapeHtml(displayName) + '"><defs><radialGradient id="' + id + '" cx="31%" cy="24%"><stop stop-color="#fff" stop-opacity=".84"/><stop offset=".22" stop-color="' + colors[0] + '"/><stop offset="1" stop-color="' + colors[1] + '"/></radialGradient><pattern id="' + id + '-swirl" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(' + (hash % 28) + ')"><path d="M3 15c0-8 10-11 16-7 6 4 4 13-2 14-5 1-8-4-5-7 2-2 5-1 5 1" fill="none" stroke="' + colors[2] + '" stroke-width="2.4" stroke-linecap="round" opacity=".75"/></pattern></defs><ellipse cx="101" cy="149" rx="47" ry="8" fill="#05090c" opacity=".48"/><path d="' + silhouette + '" fill="url(#' + id + ')" stroke="' + colors[1] + '" stroke-width="2.5"/><path d="' + silhouette + '" fill="url(#' + id + '-swirl)" opacity=".86"/><path d="M102 45 C100 34 102 25 108 19 C114 13 123 16 122 22 C121 28 114 28 112 24" fill="none" stroke="#775039" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M108 25 C123 8 145 10 150 23 C140 36 122 38 108 30Z" fill="' + colors[3] + '" stroke="#6b8a58" stroke-width="2"/><path d="M74 49 C68 63 68 75 73 88 M128 49 C137 63 138 78 134 89" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".28"/><path d="M' + (curlOffset > 0 ? '57' : '119') + ' 92c-11-9-23 1-16 10 6 8 18 1 13-6-3-5-10-2-8 2m35 16c10-9 22 1 15 10-6 8-18 1-13-6 3-5 10-2 8 2" fill="none" stroke="' + colors[2] + '" stroke-width="3" stroke-linecap="round" opacity=".92"/><circle cx="72" cy="58" r="3" fill="#fff" opacity=".72"/></svg>';
    var markup = acceptedImage
      ? sourceImage + '<span class="fruit-art-fallback" hidden>' + generated + '</span>'
      : generated;
    illustrationCache.set(cacheKey, markup);
    return markup;
  }

  function currentFruitType(fruit) {
    var entries = (fruit.typeHistory || []).filter(function (entry) { return entry.from <= state.progress; });
    return entries.length ? entries[entries.length - 1].label : fruit.type || "Type non confirmé";
  }

  function normalizeFruitType(value) {
    return stripMarks(String(value || "")).toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  var parameciaNames = new Set(("Aro Aro no Mi|Ato Ato no Mi|Awa Awa no Mi|Baku Baku no Mi|Bane Bane no Mi|Bara Bara no Mi|Bari Bari no Mi|Bata Bata no Mi|Beri Beri no Mi|Beta Beta no Mi|Bisu Bisu no Mi|Bomu Bomu no Mi|Buki Buki no Mi|Buku Buku no Mi|Chiyu Chiyu no Mi|Choki Choki no Mi|Deka Deka no Mi|Doa Doa no Mi|Doku Doku no Mi|Doru Doru no Mi|Fude Fude no Mi|Fuku Fuku no Mi|Fuwa Fuwa no Mi|Gabu Gabu no Mi|Giro Giro no Mi|Gocha Gocha no Mi|Gomu Gomu no Mi|Gura Gura no Mi|Guru Guru no Mi|Hana Hana no Mi|Hira Hira no Mi|Hobi Hobi no Mi|Horo Horo no Mi|Horu Horu no Mi|Hoya Hoya no Mi|Iba Iba no Mi|Iku Iku no Mi|Ishi Ishi no Mi|Ito Ito no Mi|Jake Jake no Mi|Jiki Jiki no Mi|Juku Juku no Mi|Kage Kage no Mi|Kibi Kibi no Mi|Kira Kira no Mi|Kiro Kiro no Mi|Kobu Kobu no Mi|Kuku Kuku no Mi|Kuri Kuri no Mi|Maki Maki no Mi|Mane Mane no Mi|Mato Mato no Mi|Memo Memo no Mi|Mero Mero no Mi|Mira Mira no Mi|Mochi Mochi no Mi|Muchi Muchi no Mi|Nagi Nagi no Mi|Netsu Netsu no Mi|Nikyu Nikyu no Mi|Nomi Nomi no Mi|Nori Nori no Mi|Noro Noro no Mi|Nui Nui no Mi|Ope Ope no Mi|Ori Ori no Mi|Oshi Oshi no Mi|Oto Oto no Mi|Pamu Pamu no Mi|Pero Pero no Mi|Poke Poke no Mi|Riki Riki no Mi|Sabi Sabi no Mi|Shari Shari no Mi|Shibo Shibo no Mi|Shiku Shiku no Mi|Shima Shima no Mi|Shiro Shiro no Mi|Soru Soru no Mi|Sube Sube no Mi|Sui Sui no Mi|Suke Suke no Mi|Supa Supa no Mi|Toge Toge no Mi|Toki Toki no Mi|Ton Ton no Mi|Toshi Toshi no Mi|Tsutsu Tsutsu no Mi|Wapu Wapu no Mi|Wara Wara no Mi|Woshu Woshu no Mi|Yomi Yomi no Mi|Zushi Zushi no Mi").split("|").map(normalizeFruitType));
  var logiaNames = new Set(("Ame Ame no Mi|Gasu Gasu no Mi|Goro Goro no Mi|Hie Hie no Mi|Magu Magu no Mi|Mera Mera no Mi|Moku Moku no Mi|Mori Mori no Mi|Numa Numa no Mi|Pasa Pasa no Mi|Pika Pika no Mi|Suna Suna no Mi|Susu Susu no Mi|Toro Toro no Mi|Yami Yami no Mi|Yuki Yuki no Mi").split("|").map(normalizeFruitType));
  var mythicalZoanNames = new Set(("Batto Batto no Mi, modèle Vampire|Gomu Gomu no Mi|Hebi Hebi no Mi, modèle Yamata no Orochi|Hito Hito no Mi, modèle Daibutsu|Hito Hito no Mi, modèle Onyudo|Inu Inu no Mi, modèle Bake-danuki|Inu Inu no Mi, modèle Kyubi no Kitsune|Inu Inu no Mi, modèle Okuchi no Makami|Risu Risu no Mi, modèle Ratatoskr|Ryu Ryu no Mi, modèle Kirin|Ryu Ryu no Mi, modèle Nidhöggr|Tori Tori no Mi, modèle Nue|Tori Tori no Mi, modèle Phénix|Uma Uma no Mi, modèle Pégase|Uo Uo no Mi, modèle Seiryu").split("|").map(normalizeFruitType));
  var ancientZoanNames = new Set(("Kumo Kumo no Mi, modèle Rosamygale Grauvogeli|Neko Neko no Mi, modèle Saber Tiger|Ryu Ryu no Mi, modèle Allosaure|Ryu Ryu no Mi, modèle Allosaurus|Ryu Ryu no Mi, modèle Brachiosaurus|Ryu Ryu no Mi, modèle Pachycephalosaurus|Ryu Ryu no Mi, modèle Pteranodon|Ryu Ryu no Mi, modèle Spinosaurus|Ryu Ryu no Mi, modèle Triceratops|Zou Zou no Mi, modèle Mammouth").split("|").map(normalizeFruitType));
  var zoanNames = new Set(("Batto Batto no Mi|Hebi Hebi no Mi|Hebi Hebi no Mi, modèle Anaconda|Hebi Hebi no Mi, modèle Cobra royal|Hito Hito no Mi|Inu Inu no Mi, modèle Teckel|Inu Inu no Mi, modèle Chacal|Inu Inu no Mi, modèle Loup|Kame Kame no Mi|Mogu Mogu no Mi|Mushi Mushi no Mi, modèle Kabutomushi|Mushi Mushi no Mi, modèle Suzumebachi|Neko Neko no Mi, modèle Léopard|Rako Rako no Mi|Sara Sara no Mi, modèle Axolotl|Tori Tori no Mi, modèle Albatros|Tori Tori no Mi, modèle Faucon|Tori Tori no Mi, modèle Aigle|Uma Uma no Mi|Ushi Ushi no Mi, modèle Bison|Ushi Ushi no Mi, modèle Girafe|Zou Zou no Mi").split("|").map(normalizeFruitType));

  function fruitCategory(fruit) {
    var label = currentFruitType(fruit);
    var normalizedLabel = normalizeFruitType(label);
    var normalizedSubtype = normalizeFruitType(fruit.subType || "");
    var name = normalizeFruitType(fruit.name);
    var model = normalizeFruitType(knownFruitModel(fruit));
    var hasKnownName = function (set) {
      return set.has(name) || (fruit.aliases || []).some(function (alias) { return set.has(normalizeFruitType(alias)); });
    };
    var hasZoan = /zoan/.test(normalizedLabel) || /zoan/.test(normalizedSubtype) || hasKnownName(zoanNames) || hasKnownName(mythicalZoanNames) || hasKnownName(ancientZoanNames) || /^fruitzoan/.test(name) || model.length > 0;
    var isArtificial = /artificial|artificiel|smile/.test(normalizedLabel + normalizedSubtype) || /smile/.test(name);
    var isMythical = /mythical|mythique|legendary|legendaire/.test(normalizedLabel + normalizedSubtype) || hasKnownName(mythicalZoanNames);
    var isAncient = /ancient|prehistoric|prehistorique/.test(normalizedLabel + normalizedSubtype) || hasKnownName(ancientZoanNames);
    var isSpecialParamecia = /specialparamecia|parameciaspecial/.test(normalizedLabel) || name === normalizeFruitType("Mochi Mochi no Mi");

    if (/logia/.test(normalizedLabel) || (!/paramecia|zoan/.test(normalizedLabel) && hasKnownName(logiaNames))) return "logia";
    if (/paramecia/.test(normalizedLabel) || (!/zoan|logia/.test(normalizedLabel) && hasKnownName(parameciaNames))) return isSpecialParamecia ? "paramecia-special" : "paramecia";
    if (hasZoan || isMythical || isAncient || isArtificial) {
      if (isMythical) return "zoan-mythique";
      if (isAncient) return "zoan-prehistorique";
      if (isArtificial) return "zoan-artificiel";
      return "zoan-classique";
    }
    return "unknown";
  }

  function fruitMatchesCategory(fruit, category) {
    var type = fruitCategory(fruit);
    if (category === "all") return true;
    if (category === "zoan") return type.indexOf("zoan-") === 0;
    if (category === "paramecia") return type === "paramecia" || type === "paramecia-special";
    if (category === "zoan-artificiel" && type.indexOf("zoan-") === 0) {
      var typeText = normalizeFruitType(currentFruitType(fruit) + " " + (fruit.subType || ""));
      return type === category || /artificial|artificiel|smile/.test(typeText) || /smile/.test(normalizeFruitType(fruit.name));
    }
    return type === category;
  }

  function fruitTypeLabel(fruit) {
    var labels = {"paramecia":"Paramecia","paramecia-special":"Paramecia spéciale","logia":"Logia","zoan":"Zoan","zoan-classique":"Zoan classique","zoan-mythique":"Zoan mythique","zoan-prehistorique":"Zoan préhistorique","zoan-artificiel":"Zoan artificiel","unknown":"Type non confirmé"};
    return labels[fruitCategory(fruit)] || "Type non confirmé";
  }

  function fruitImageIsFruit(fruit, image) {
    if (!image) return false;
    try {
      var url = new URL(image, window.location.href);
      var path = decodeURIComponent(url.pathname).split("/revision/")[0];
      var filename = path.split("/").pop() || "";
      var normalizedPath = normalizeFruitType(path);
      var model = String(fruit.model || "").trim();
      if (!model) {
        var modelMatch = String(fruit.name || "").match(/,\s*(?:model|mod[eè]le)\s+(.+)$/i);
        if (modelMatch) model = modelMatch[1];
      }
      var modelMatches = !model || normalizeFruitType(filename).indexOf(normalizeFruitType(model)) !== -1;
      if (/supabase\.co$/i.test(url.hostname) && /\/devil-fruits\//i.test(url.pathname)) return modelMatches;
      if (/beastform|humanform|hybridform|anime|manga|attack|ability|scene|shot/.test(normalizeFruitType(filename))) return false;
      var roots = [fruit.name].concat(fruit.aliases || []).map(function (name) {
        return String(name || "").split(/,\s*(?:model|mod[eè]le)\s*/i)[0];
      }).map(normalizeFruitType).filter(function (name) { return name.length >= 6; });
      var nameMatches = roots.some(function (root) { return normalizedPath.indexOf(root) !== -1; });
      return nameMatches && modelMatches;
    } catch { return false; }
  }

  function arcForChapter(chapter) {
    var number = Number(chapter);
    if (!number) return null;
    return DATA.arcs.find(function (arc) { return number >= Number(arc.chapterStart) && number <= Number(arc.chapterEnd); }) || null;
  }

  function safeOwnerName(name) {
    var original = String(name || "");
    var parentheses = original.match(/\(([^)]+)\)/);
    if (parentheses) {
      var safeAlias = safeCharacterName(parentheses[1]);
      if (safeAlias !== parentheses[1]) return safeAlias;
    }
    return safeCharacterName(original);
  }

  function visibleFruitUsers(fruit) {
    var users = Array.isArray(fruit.users) ? fruit.users.slice() : [];
    if (!users.length && fruit.user && !/à confirmer|inconnu/i.test(fruit.user)) {
      users.push({ name:fruit.user, chapter:Number(fruit.firstChapter), role:"Utilisateur connu" });
    }
    return users.filter(function (user) {
      var chapter = Number(user.chapter) || Number(fruit.firstChapter);
      var revealArc = arcForChapter(chapter);
      var knownAt = revealArc ? DATA.arcs.indexOf(revealArc) : Number(fruit.firstSeen);
      return knownAt <= state.progress;
    }).sort(function (a, b) { return (Number(a.chapter) || 0) - (Number(b.chapter) || 0); }).map(function (user) {
      return Object.assign({},user,{displayName:safeOwnerName(user.name)});
    });
  }

  function fruitUserCard(user, firstArc) {
    var characterKey = identityKey(user.name);
    var character = (state.characters || []).find(function (item) {
      return identityKey(item.name) === characterKey && Number(item.knownAt) <= state.progress;
    });
    var characterName = character && character.name || user.displayName;
    var initial = escapeHtml(String(user.displayName || "?").trim().slice(0, 1).toUpperCase() || "?");
    var revealLabel = userArcLabel(user, firstArc);
    var portrait = character && character.image
      ? '<img class="detail-member-photo fruit-user-photo" src="' + escapeHtml(character.image) + '" alt="Portrait de ' + escapeHtml(user.displayName) + '" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden class="detail-member-photo detail-member-avatar fruit-user-avatar" aria-hidden="true">' + initial + '</span>'
      : '<span class="detail-member-photo detail-member-avatar fruit-user-avatar" role="img" aria-label="Portrait de ' + escapeHtml(user.displayName) + '">' + initial + '</span>';
    return '<button type="button" class="detail-member-card fruit-user-card" data-open-character="' + escapeHtml(identityKey(characterName)) + '" aria-label="Ouvrir la fiche de personnage de ' + escapeHtml(user.displayName) + '">' + portrait + '<span class="detail-member-copy"><strong>' + escapeHtml(user.displayName) + '</strong><span>' + escapeHtml(user.role || "Utilisateur connu") + '</span>' + (revealLabel ? '<span class="fruit-user-reveal">' + escapeHtml(revealLabel) + '</span>' : '') + '</span><span class="detail-member-arrow" aria-hidden="true">↗</span></button>';
  }

  function userArcLabel(user, firstArc) {
    var userArc = arcForChapter(user.chapter) || firstArc;
    return userArc ? "Révélé dans " + userArc.name : "";
  }

  function describeFruit(fruit) {
    var detailed = fruit.longDescription || fruit.knownAs || fruit.description;
    if (detailed && detailed !== "Description non renseignée dans la source.") return detailed;
    var type = currentFruitType(fruit);
    var model = fruit.model || "";
    if (/zoan/i.test(type) && model && !/inconnu|à confirmer/i.test(model)) {
      return "Ce Zoan permet à son utilisateur de prendre une forme correspondant au modèle " + model + " ainsi qu’une forme hybride. Ces transformations donnent accès aux caractéristiques physiques de l’animal, comme sa taille, sa mobilité ou ses capacités naturelles.";
    }
    if (/logia/i.test(type)) {
      return "Ce Logia est lié à un élément ou à une matière naturelle. Son utilisateur peut en produire, en contrôler et transformer son corps en cette matière, selon les limites montrées dans l’œuvre.";
    }
    if (/zoan/i.test(type)) {
      return "Le modèle précis de ce Zoan n’est pas confirmé dans cette fiche. Le pouvoir relève de la transformation animale; les informations visibles ici s’arrêtent à ce qui est établi à l’arc choisi.";
    }
    return "Ce fruit confère une capacité singulière. La description des effets et des limites s’appuie sur les éléments répertoriés dans l’œuvre et reste volontairement prudente lorsque le pouvoir n’a pas été détaillé.";
  }

  function collectFruits() {
    if (fruitSource === state.fruits && fruitProgress === state.progress && fruitCatalogCache) return fruitCatalogCache;
    var fruits = DATA.fruits.slice();
    (state.fruits || []).forEach(function (fruit) {
      var index = fruits.findIndex(function (item) { return fruitIdentity(item) === fruitIdentity(fruit); });
      if (index >= 0) fruits[index] = Object.assign({}, fruits[index], fruit);
      else fruits.push(fruit);
    });
    fruitSource = state.fruits;
    fruitProgress = state.progress;
    fruitCatalogCache = fruits.filter(function (fruit) { return Number(fruit.firstSeen) <= state.progress; });
    return fruitCatalogCache;
  }

  function renderFruits() {
    var html = heading("POUVOIRS & FRUITS", "Fruits du Démon", "Catalogue filtré selon ton arc. Les fiches sans repère d’apparition vérifié restent masquées pour préserver l’anti-spoiler.", "◉");
    if (!progressArc()) return html + progressHint();
    var allFruits = collectFruits();
    var selectedCategory = state.fruitCategory || "all";
    var categoryOptions = [
      { id:"all", label:"Tous" },
      { id:"paramecia", label:"Paramecia" },
      { id:"paramecia-special", label:"Paramecia spéciale" },
      { id:"logia", label:"Logia" },
      { id:"zoan", label:"Zoan" },
      { id:"zoan-classique", label:"Zoan classique" },
      { id:"zoan-mythique", label:"Zoan mythique" },
      { id:"zoan-prehistorique", label:"Zoan préhistorique" },
      { id:"zoan-artificiel", label:"Zoan artificiel" },
      { id:"unknown", label:"Type non confirmé" },
    ];
    html += '<div class="fruit-category-toolbar" role="group" aria-label="Filtrer les Fruits du Démon par catégorie">' + categoryOptions.map(function (option) {
      var count = option.id === "all" ? allFruits.length : allFruits.filter(function (fruit) { return fruitMatchesCategory(fruit, option.id); }).length;
      if (option.id !== "all" && !count) return "";
      return '<button type="button" class="fruit-category-filter' + (selectedCategory === option.id ? ' active' : '') + '" data-fruit-category="' + option.id + '" aria-pressed="' + (selectedCategory === option.id ? 'true' : 'false') + '">' + escapeHtml(option.label) + ' <span>' + count + '</span></button>';
    }).join("") + '</div>';
    var fruits = allFruits.filter(function (fruit) { return fruitMatchesCategory(fruit, selectedCategory); });
    fruits = filtered(state.query, fruits, function (fruit) {
      return [fruitDisplayName(fruit), fruit.name, fruit.model, fruit.knownAs, fruit.longDescription, fruitTypeLabel(fruit), currentFruitType(fruit)].concat(visibleFruitUsers(fruit).map(function (user) { return user.displayName; }));
    });
    html += '<div class="collection-summary"><strong>' + fruits.length + ' résultats sur ' + allFruits.length + ' fruits et pouvoirs répertoriés</strong><br>Affichage des informations connues jusqu’à ' + escapeHtml(progressArc().name) + '. ' + (state.unclassifiedFruits ? state.unclassifiedFruits + ' entrées de la base attendent une date d’apparition fiable; leurs noms restent cachés.' : 'Les entrées affichées ont un repère narratif classé.') + '</div><div class="fruit-grid">';
    fruits.forEach(function (fruit) {
      var detail = describeFruit(fruit);
      var cardDescription = detail.length > 156 ? detail.slice(0, 153).trimEnd() + "…" : detail;
      var users = visibleFruitUsers(fruit);
      var userLabel = users.length ? users.map(function (user) { return user.displayName; }).join(", ") : "non confirmé dans les sources consultées";
      var artwork = fruitIllustration(fruit, DATA.fruits.indexOf(fruit) + (state.fruits || []).indexOf(fruit));
      var fruitKey = fruitRouteKey(fruit);
      html += '<article class="fruit-card"><button class="fruit-card-open" data-open-fruit="' + escapeHtml(fruitKey) + '" aria-label="Ouvrir la fiche du ' + escapeHtml(fruitDisplayName(fruit)) + '"><div class="fruit-visual">' + artwork + '</div><div class="fruit-card-copy"><span class="fruit-type">' + escapeHtml(fruitTypeLabel(fruit)) + '</span><h3>' + escapeHtml(fruitDisplayName(fruit)) + '</h3><p>' + escapeHtml(cardDescription) + '<br>Utilisateur' + (users.length > 1 ? 's connus' : ' connu') + ' : ' + escapeHtml(userLabel) + (fruit.canonStatus ? '<br><span class="fruit-source-status">' + escapeHtml(fruit.canonStatus) + '</span>' : '') + '</p><span class="fruit-card-link">Ouvrir la fiche complète ↗</span></div></button>' + favoriteButton("fruit",fruitKey,fruitDisplayName(fruit),"card-favorite") + '</article>';
    });
    if (!fruits.length) html += '<div class="empty-state"><strong>Aucun résultat</strong>Essaie un autre fruit ou utilisateur.</div>';
    return html + '</div>';
  }

  function renderFruitDetail(routeKey) {
    if (!progressArc()) return heading("FICHE FRUIT DU DÉMON", "Fruit du Démon", "Choisis d’abord un arc pour ouvrir une fiche sans spoiler.", "◉") + progressHint();
    var fruit = collectFruits().find(function (item) { return fruitRouteKey(item) === String(routeKey || "") || (!knownFruitModel(item) && fruitKey(item.name) === String(routeKey || "")); });
    if (!fruit) return heading("FICHE FRUIT DU DÉMON", "Fiche indisponible", "Ce fruit n’est pas répertorié dans les informations accessibles jusqu’à ton arc.", "◉") + '<button class="detail-back" data-page="fruits">← Retour aux fruits du Démon</button>';
    var users = visibleFruitUsers(fruit);
    var firstArc = arcForChapter(fruit.firstChapter) || DATA.arcs[Number(fruit.firstSeen)] || progressArc();
    var type = fruitTypeLabel(fruit);
    var art = fruitIllustration(fruit, DATA.fruits.indexOf(fruit));
    var description = describeFruit(fruit);
    var userHtml = users.length
      ? '<div class="fruit-detail-user-list">' + users.map(function (user) {
          return fruitUserCard(user, firstArc);
        }).join("") + '</div>'
      : '<div class="empty-state"><strong>Aucun utilisateur confirmé</strong>Les sources consultées ne permettent pas encore d’attribuer ce fruit à une personne précise.</div>';
    var html = '<button class="detail-back" data-page="fruits">← Retour au catalogue</button><section class="detail-hero fruit-detail-hero"><div class="fruit-detail-visual">' + art + '</div><div class="detail-hero-copy"><span class="eyebrow">FICHE FRUIT DU DÉMON</span><h1>' + escapeHtml(fruitDisplayName(fruit)) + '</h1><p>' + escapeHtml(description) + '</p><div class="detail-badges"><span>' + escapeHtml(type) + '</span><span>Première mention connue · ' + escapeHtml(firstArc.name) + (fruit.firstChapter ? ' · chapitre ' + escapeHtml(fruit.firstChapter) : '') + '</span></div><div class="favorite-detail-row">' + favoriteButton("fruit",fruitRouteKey(fruit),fruitDisplayName(fruit),"favorite-inline") + '<span>Garder ce fruit dans mes favoris</span></div></div></section>';
    html += '<section class="fruit-detail-section"><div class="section-heading detail-section-heading"><div><h2>Utilisateurs connus</h2><p>Les détenteurs ne sont affichés qu’à partir de leur révélation dans l’histoire.</p></div><span class="tag">' + users.length + ' fiche' + (users.length > 1 ? 's' : '') + '</span></div>' + userHtml + '</section>';
    html += '<div class="detail-facts-grid"><article class="detail-fact"><span>Type connu à cet arc</span><strong>' + escapeHtml(type) + '</strong></article><article class="detail-fact"><span>Première mention recensée</span><strong>' + escapeHtml(firstArc.name) + (fruit.firstChapter ? ' · ch. ' + escapeHtml(fruit.firstChapter) : '') + '</strong></article><article class="detail-fact"><span>Statut de la fiche</span><strong>' + escapeHtml(fruit.canonStatus || "Canon manga") + '</strong></article></div>';
    if (fruit.sourceUrl || fruit.image) html += '<p class="fruit-detail-source">Données de catalogue : <a href="' + escapeHtml(fruit.sourceUrl || fruit.imageSource || "https://www.onepieceapi.com/documentation") + '" target="_blank" rel="noreferrer">source de référence ↗</a>. Les images vérifiées du fruit gardent le crédit de leur source.</p>';
    return html;
  }

  return { collectFruits, currentFruitType, fruitDisplayName, fruitIllustration, fruitRouteKey, renderFruits, renderFruitDetail };
};
