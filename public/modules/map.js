window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.map = function (context) {
  var DATA = context.DATA;
  var state = context.state;
  var escapeHtml = context.escapeHtml;
  var heading = context.heading;
  var pageIcon = context.pageIcon;
  var safeCharacterName = context.safeCharacterName;
  var identityKey = context.identityKey;

  // The points are an itinerary schematic: canon does not give coordinates for most islands.
  // Keep every entry's first-known arc here; every route, search and detail view uses visibleLocations().
  var locations = [
    { id:"goat-island", name:"Goat Island", short:"Goat Island", sea:"East Blue", type:"Île", arc:"alabasta", x:55, y:150, note:"Une petite île rocheuse de l’East Blue." },
    { id:"foosha", name:"Dawn Island · Village de Foosha", short:"Dawn Island · Foosha", sea:"East Blue", type:"Village", arc:"romance-dawn", x:105, y:420, note:"Un village côtier de Dawn Island, dans l’East Blue." },
    { id:"shells-town", name:"Région de Yotsuba · Shells Town", short:"Shells Town", sea:"East Blue", type:"Ville", arc:"romance-dawn", x:205, y:500, note:"Une ville portuaire de la région de Yotsuba, dans l’East Blue." },
    { id:"orange-town", name:"Îles Organ · Orange Town", short:"Orange Town", sea:"East Blue", type:"Ville", arc:"orange-town", x:305, y:420, note:"Une petite ville portuaire des îles Organ." },
    { id:"rare-animal-island", name:"Île des animaux rares", short:"Île des animaux rares", sea:"East Blue", type:"Île", arc:"syrup-village", x:405, y:500, note:"Une île de l’East Blue connue pour sa faune." },
    { id:"syrup-village", name:"Îles Gecko · Village de Sirop", short:"Village de Sirop", sea:"East Blue", type:"Village", arc:"syrup-village", x:505, y:420, note:"Un village de l’archipel des îles Gecko." },
    { id:"baratie", name:"Baratie", short:"Baratie", sea:"East Blue", type:"Restaurant flottant", arc:"baratie", x:605, y:500, note:"Un restaurant construit sur un navire en mer, dans la région de Sambas." },
    { id:"conomi-islands", name:"Îles Conomi", short:"Îles Conomi", sea:"East Blue", type:"Archipel", arc:"arlong-park", x:705, y:420, note:"Un archipel de l’East Blue." },
    { id:"loguetown", name:"Îles Polestar · Loguetown", short:"Loguetown", sea:"East Blue", type:"Ville", arc:"loguetown", x:805, y:500, note:"Une ville de l’East Blue, sur les îles Polestar, près de l’entrée de la route maritime." },
    { id:"reverse-mountain", name:"Reverse Mountain & Twin Cape", short:"Reverse Mountain", sea:"Grand Line", type:"Passage maritime", arc:"reverse-mountain", x:866, y:410, note:"Le passage en X des courants relie les quatre mers à la Grand Line. Le phare de Twin Cape est le refuge de Laboon." },
    { id:"whisky-peak", name:"Cactus Island · Whisky Peak", short:"Whisky Peak", sea:"Grand Line", type:"Île", arc:"whisky-peak", x:1050, y:500, note:"Une ville installée sur Cactus Island." },
    { id:"little-garden", name:"Little Garden", short:"Little Garden", sea:"Grand Line", type:"Île", arc:"little-garden", x:1170, y:410, note:"Une île couverte d’une nature ancienne." },
    { id:"drum-island", name:"Île de Drum", short:"Île de Drum", sea:"Grand Line", type:"Île", arc:"drum-island", x:1290, y:500, note:"Une île montagneuse au climat froid." },
    { id:"alabasta", name:"Sandy Island · Alabasta", short:"Alabasta", sea:"Grand Line", type:"Royaume insulaire", arc:"alabasta", x:1410, y:410, note:"Un vaste royaume désertique de la Grand Line, avec notamment Nanohana, Rainbase et Alubarna." },
    { id:"jaya", name:"Jaya", short:"Jaya", sea:"Grand Line", type:"Île", arc:"jaya", x:1530, y:500, note:"Une île de la première moitié de la Grand Line, où se trouve Mock Town." },
    { id:"skypiea", name:"Skypiea", short:"Skypiea", sea:"Grand Line", type:"Île céleste", arc:"skypiea", x:1650, y:150, note:"Une île du ciel, avec Angel Island et Upper Yard." },
    { id:"long-ring-long-land", name:"Long Ring Long Land", short:"Long Ring Long Land", sea:"Grand Line", type:"Archipel", arc:"long-ring-long-land", x:1770, y:410, note:"Un ensemble de terres à la forme particulière." },
    { id:"water-7", name:"Water 7", short:"Water 7", sea:"Grand Line", type:"Ville insulaire", arc:"water-7", x:1890, y:500, note:"Une ville portuaire célèbre pour ses chantiers navals." },
    { id:"enies-lobby", name:"Enies Lobby", short:"Enies Lobby", sea:"Grand Line", type:"Île judiciaire", arc:"enies-lobby", x:2010, y:410, note:"Une île fortifiée de la Grand Line." },
    { id:"thriller-bark", name:"Florian Triangle · Thriller Bark", short:"Thriller Bark", sea:"Grand Line", type:"Navire-île", arc:"thriller-bark", x:2050, y:600, note:"Une immense île-navire qui traverse le Florian Triangle." },
    { id:"sabaody", name:"Archipel Sabaody", short:"Sabaody", sea:"Grand Line", type:"Archipel", arc:"sabaody", x:2280, y:410, note:"Un archipel de mangroves juste avant le passage de la Red Line." },
    { id:"amazon-lily", name:"Amazon Lily", short:"Amazon Lily", sea:"Calm Belt", type:"Île", arc:"amazon-lily", x:2300, y:270, note:"Une île située dans le Calm Belt." },
    { id:"impel-down", name:"Impel Down", short:"Impel Down", sea:"Calm Belt", type:"Prison sous-marine", arc:"impel-down", x:2180, y:270, note:"Une prison bâtie sous la mer, dans le Calm Belt." },
    { id:"marineford", name:"Marineford", short:"Marineford", sea:"Grand Line", type:"Île fortifiée", arc:"marineford", x:2200, y:500, note:"Une île fortifiée de la Grand Line." },
    { id:"rusukaina", name:"Rusukaina", short:"Rusukaina", sea:"Calm Belt", type:"Île", arc:"post-war", x:2350, y:650, note:"Une île isolée du Calm Belt." },
    { id:"kuraigana", name:"Île de Kuraigana", short:"Kuraigana", sea:"Grand Line", type:"Île", arc:"post-war", x:2450, y:650, note:"Une île de la Grand Line avec des ruines anciennes." },
    { id:"weatheria", name:"Weatheria", short:"Weatheria", sea:"Grand Line", type:"Île céleste", arc:"post-war", x:2550, y:120, note:"Une île céleste consacrée à l’étude de la météo." },
    { id:"boin-archipelago", name:"Archipel Boin", short:"Archipel Boin", sea:"Grand Line", type:"Archipel", arc:"post-war", x:2650, y:650, note:"Un archipel de la Grand Line." },
    { id:"momoiro-island", name:"Île Momoiro", short:"Île Momoiro", sea:"Grand Line", type:"Île", arc:"post-war", x:2750, y:650, note:"Une île de la Grand Line." },
    { id:"torino-kingdom", name:"Royaume de Torino", short:"Royaume de Torino", sea:"South Blue", type:"Royaume insulaire", arc:"post-war", x:2850, y:750, note:"Un royaume insulaire du South Blue." },
    { id:"tequila-wolf", name:"Tequila Wolf", short:"Tequila Wolf", sea:"East Blue", type:"Île", arc:"post-war", x:2950, y:120, note:"Une île de l’East Blue." },
    { id:"baltigo", name:"Baltigo", short:"Baltigo", sea:"Grand Line", type:"Île", arc:"post-war", x:3050, y:120, note:"Une île de la Grand Line." },
    { id:"karakuri-island", name:"Île Karakuri", short:"Île Karakuri", sea:"Grand Line", type:"Île", arc:"post-war", x:3150, y:650, note:"Une île hivernale de la Grand Line." },
    { id:"namakura-island", name:"Île Namakura", short:"Île Namakura", sea:"Grand Line", type:"Île", arc:"post-war", x:3250, y:650, note:"Une île de la Grand Line." },
    { id:"kenzan-island", name:"Île Kenzan", short:"Île Kenzan", sea:"Grand Line", type:"Île", arc:"post-war", x:3350, y:750, note:"Une île de la Grand Line." },
    { id:"red-line", name:"Red Line", short:"Red Line", sea:"Red Line", type:"Continent", arc:"sabaody", x:2370, y:290, note:"Le vaste continent qui traverse le globe et coupe la Grand Line. À ce passage, la route sous-marine mène à l’île des Hommes-Poissons tandis que la route terrestre rejoint Marie Joie." },
    { id:"marie-joie", name:"Marie Joie", short:"Marie Joie", sea:"Red Line", type:"Cité sacrée", arc:"sabaody", x:2370, y:135, note:"La cité sacrée bâtie au sommet de la Red Line, au-dessus du point où la Grand Line la traverse." },
    { id:"fishman-island", name:"Île des Hommes-Poissons", short:"Île des Hommes-Poissons", sea:"Grand Line", type:"Île sous-marine", arc:"fishman-island", x:2370, y:540, note:"Une île située sous la mer, au pied de la Red Line, avec notamment la Crique des Sirènes et la Forêt Marine." },
    { id:"punk-hazard", name:"Punk Hazard", short:"Punk Hazard", sea:"Grand Line", type:"Île", arc:"punk-hazard", x:2650, y:410, note:"Une île de la Grand Line aux phénomènes climatiques inhabituels." },
    { id:"dressrosa", name:"Dressrosa", short:"Dressrosa", sea:"Grand Line", type:"Royaume insulaire", arc:"dressrosa", x:2770, y:500, note:"Un royaume insulaire du Nouveau Monde." },
    { id:"green-bit", name:"Green Bit", short:"Green Bit", sea:"Grand Line", type:"Île", arc:"dressrosa", x:2890, y:410, note:"Une île boisée proche de Dressrosa." },
    { id:"zou", name:"Zou", short:"Zou", sea:"Grand Line", type:"Île mobile", arc:"zou", x:3010, y:500, note:"Une île qui se déplace sur le dos d’une créature géante." },
    { id:"cacao-island", name:"Île Cacao", short:"Île Cacao", sea:"Grand Line", type:"Île", arc:"whole-cake-island", x:3130, y:410, note:"Une île de l’archipel de Totto Land." },
    { id:"whole-cake-island", name:"Whole Cake Island", short:"Whole Cake Island", sea:"Grand Line", type:"Île", arc:"whole-cake-island", x:3250, y:500, note:"Une île de l’archipel de Totto Land." },
    { id:"nuts-island", name:"Île Nuts", short:"Île Nuts", sea:"Grand Line", type:"Île", arc:"whole-cake-island", x:3370, y:410, note:"Une île de l’archipel de Totto Land." },
    { id:"totto-land", name:"Archipel de Totto Land", short:"Totto Land", sea:"Grand Line", type:"Archipel", arc:"whole-cake-island", x:3130, y:650, note:"Un archipel de la Grand Line qui comprend plusieurs îles." },
    { id:"mirror-world", name:"Mirro-World", short:"Mirro-World", sea:"Grand Line", type:"Lieu singulier", arc:"whole-cake-island", x:3490, y:500, note:"Un lieu accessible à travers des miroirs." },
    { id:"germa-kingdom", name:"Germa Kingdom", short:"Germa Kingdom", sea:"Grand Line", type:"Royaume mobile", arc:"whole-cake-island", x:3610, y:410, note:"Un royaume qui voyage à bord de navires." },
    { id:"wano", name:"Pays de Wano", short:"Pays de Wano", sea:"Grand Line", type:"Pays insulaire", arc:"wano", x:3730, y:500, note:"Un pays insulaire fermé sur lui-même." },
    { id:"onigashima", name:"Onigashima", short:"Onigashima", sea:"Grand Line", type:"Île", arc:"wano", x:3850, y:410, note:"Une île au large du pays de Wano." },
    { id:"egghead", name:"Egghead", short:"Egghead", sea:"Grand Line", type:"Île", arc:"egghead", x:3970, y:500, note:"Une île de la Grand Line connue pour sa technologie." },
    { id:"elbaph", name:"Elbaph", short:"Elbaph", sea:"Grand Line", type:"Île", arc:"elbaph", x:4090, y:410, note:"Une île du Nouveau Monde." },
  ];
  // Fiches éditoriales scellées par l'arc d'apparition du lieu. Les portraits
  // et affiliations ne sont rendus qu'après leur propre seuil de découverte.
  var islandProfiles = {
    "goat-island": { description:"Un petit îlot rocheux de l’East Blue, battu par les vagues et loin des grandes routes maritimes.", art:"rocky", control:"Aucune autorité ou affiliation pirate confirmée dans les repères connus.", representatives:[{name:"Zenny",role:"Habitant de l’île",arc:"alabasta"}] },
    "foosha": { description:"Le village côtier de Foosha se trouve sur Dawn Island. Son port et ses collines abritent une communauté paisible de l’East Blue.", art:"village", control:"Village sous l’autorité du royaume de Goa ; aucun équipage pirate n’y exerce de contrôle officiel.", representatives:[{name:"Monkey D. Luffy",role:"Habitant du village",arc:"romance-dawn"},{name:"Shanks",role:"Capitaine de passage",arc:"romance-dawn"},{name:"Makino",role:"Tenancière du bar",arc:"romance-dawn"}] },
    "shells-town": { description:"Shells Town est une ville portuaire de la région de Yotsuba, dominée par une base de la Marine et entourée de petites îles.", art:"port", control:"Ville civile de l’East Blue ; la base locale est tenue par la Marine.", representatives:[{name:"Roronoa Zoro",role:"Chasseur de pirates puis pirate",arc:"romance-dawn"},{name:"Morgan",role:"Ancien colonel de la Marine",arc:"romance-dawn"},{name:"Helmeppo",role:"Jeune officier de la Marine",arc:"romance-dawn"}] },
    "orange-town": { description:"Petite ville des îles Organ, Orange Town s’organise autour de rues commerçantes et d’un port de l’East Blue.", art:"village", control:"Ville civile ; l’occupation pirate montrée dans l’arc a pris fin à ce repère.", representatives:[{name:"Buggy",role:"Capitaine pirate",arc:"orange-town"},{name:"Nami",role:"Navigatrice",arc:"orange-town"},{name:"Chouchou",role:"Gardien du magasin",arc:"orange-town"}] },
    "rare-animal-island": { description:"Une île isolée de l’East Blue où se rencontrent plusieurs animaux étonnants. Son relief reste volontairement schématique sur la carte.", art:"jungle", control:"Aucune autorité ou affiliation pirate confirmée dans les repères connus.", representatives:[{name:"Gaimon",role:"Habitant de l’île",arc:"syrup-village"}] },
    "syrup-village": { description:"Installé sur les îles Gecko, le village de Sirop est un hameau côtier calme entouré de collines verdoyantes.", art:"village", control:"Village civil sans contrôle pirate officiel connu.", representatives:[{name:"Usopp",role:"Tireur d’élite et conteur du village",arc:"syrup-village"},{name:"Kaya",role:"Habitante du village",arc:"syrup-village"},{name:"Kuro",role:"Ancien capitaine pirate",arc:"syrup-village"}] },
    "baratie": { description:"Le Baratie est un restaurant flottant en forme de grand navire. Il accueille les voyageurs et marins de passage dans la région de Sambas.", art:"ship", control:"Restaurant indépendant dirigé par Zeff ; pas de pavillon pirate propriétaire.", representatives:[{name:"Sanji",role:"Cuisinier",arc:"baratie"},{name:"Zeff",role:"Fondateur et chef du restaurant",arc:"baratie"},{name:"Don Krieg",role:"Capitaine pirate",arc:"baratie"}] },
    "conomi-islands": { description:"Les îles Conomi forment un archipel de l’East Blue, avec des villages de pêcheurs, des vergers et des criques abritées.", art:"orchard", control:"Archipel civil ; l’emprise de l’équipage d’Arlong n’est plus en place à la fin de cet arc.", representatives:[{name:"Nami",role:"Navigatrice originaire de l’archipel",arc:"arlong-park"},{name:"Nojiko",role:"Habitante de Cocoyasi",arc:"arlong-park"},{name:"Arlong",role:"Ancien chef pirate local",arc:"arlong-park"}] },
    "loguetown": { description:"Loguetown est une grande ville portuaire des îles Polestar, à l’approche de Reverse Mountain et de l’entrée de Grand Line.", art:"port", control:"Ville sous juridiction de la Marine ; le port attire marins, marchands et pirates.", representatives:[{name:"Smoker",role:"Capitaine de la Marine",arc:"loguetown"},{name:"Tashigi",role:"Officière de la Marine",arc:"loguetown"},{name:"Buggy",role:"Capitaine pirate",arc:"loguetown"}] },
    "reverse-mountain": { description:"Les courants des quatre mers remontent les pentes de Reverse Mountain et convergent vers l’entrée de Grand Line. Twin Cape et son phare se trouvent au pied de la descente ; Laboon y demeure auprès de Crocus.", art:"mountain", control:"Passage maritime sans souveraineté pirate connue ; Crocus veille sur le phare de Twin Cape.", representatives:[{name:"Crocus",role:"Gardien du phare",arc:"reverse-mountain"},{name:"Laboon",role:"Baleine de Twin Cape",arc:"reverse-mountain"}] },
    "whisky-peak": { description:"Whisky Peak est une ville installée sur Cactus Island. Ses cactus élancés se dressent autour des maisons et du port de la Grand Line.", art:"desert-town", control:"La ville est habitée par des civils ; l’organisation clandestine présente pendant l’arc est démasquée à ce repère.", representatives:[{name:"Nefertari Vivi",role:"Princesse d’Alabasta sous couverture",arc:"whisky-peak"},{name:"Igaram",role:"Garde royal",arc:"whisky-peak"},{name:"Mr. 5",role:"Agent de Baroque Works",arc:"whisky-peak"}] },
    "little-garden": { description:"Little Garden est une île tropicale à la végétation préhistorique, où la faune et les plantes ont prospéré pendant des millions d’années.", art:"jungle", control:"Territoire sauvage sans gouvernement ni équipage pirate résident connu.", representatives:[{name:"Dorry",role:"Géant guerrier",arc:"little-garden"},{name:"Brogy",role:"Géant guerrier",arc:"little-garden"},{name:"Mr. 3",role:"Agent de Baroque Works",arc:"little-garden"}] },
    "drum-island": { description:"L’île de Drum est un royaume insulaire froid, reconnaissable à ses sommets pointus couverts de neige et à ses villages de montagne.", art:"snow", control:"Royaume de Drum dirigé par le roi Dalton à la fin de l’arc.", representatives:[{name:"Tony Tony Chopper",role:"Médecin originaire de Drum",arc:"drum-island"},{name:"Dalton",role:"Roi de Drum",arc:"drum-island"},{name:"Dr. Kureha",role:"Médecin du château",arc:"drum-island"}] },
    "alabasta": { description:"Alabasta est un vaste royaume désertique de la Grand Line. Nanohana, Rainbase et la capitale Alubarna ponctuent son littoral et son intérieur aride.", art:"desert-kingdom", control:"Royaume souverain de la dynastie Nefertari ; aucun équipage pirate n’en est propriétaire.", representatives:[{name:"Nefertari Vivi",role:"Princesse d’Alabasta",arc:"alabasta"},{name:"Nefertari Cobra",role:"Roi d’Alabasta",arc:"alabasta"},{name:"Pell",role:"Garde royal",arc:"alabasta"}] },
    "jaya": { description:"Jaya est une île de la première moitié de Grand Line. La ville portuaire de Mock Town contraste avec les forêts et les reliefs de l’intérieur.", art:"jungle-town", control:"Île sans contrôle officiel d’un équipage pirate unique ; plusieurs bandes fréquentent son port.", representatives:[{name:"Mont Blanc Cricket",role:"Habitant de Jaya",arc:"jaya"},{name:"Bellamy",role:"Capitaine pirate",arc:"jaya"},{name:"Masira",role:"Récupérateur en mer",arc:"jaya"}] },
    "skypiea": { description:"Skypiea est une île céleste. Angel Island et Upper Yard associent villages de nuages, mer blanche et vestiges d’une terre plus ancienne.", art:"sky", control:"Île céleste ; l’autorité en place à la fin de l’arc revient à Gan Fall et aux habitants.", representatives:[{name:"Conis",role:"Habitante d’Angel Island",arc:"skypiea"},{name:"Gan Fall",role:"Chevalier du ciel",arc:"skypiea"},{name:"Wyper",role:"Guerrier shandia",arc:"skypiea"}] },
    "long-ring-long-land": { description:"Long Ring Long Land est un ensemble de terres allongées et espacées, dont le relief singulier change avec les marées.", art:"long-island", control:"Archipel habité sans propriétaire pirate officiel connu.", representatives:[{name:"Tonjit",role:"Habitant nomade de l’île",arc:"long-ring-long-land"},{name:"Foxy",role:"Capitaine pirate",arc:"long-ring-long-land"}] },
    "water-7": { description:"Water 7 est une ville portuaire bâtie autour de canaux et d’étages successifs. Ses chantiers navals comptent parmi les plus réputés du monde.", art:"canal-city", control:"Ville indépendante, gouvernée par la mairie et les corporations de charpentiers ; pas de souveraineté pirate.", representatives:[{name:"Iceburg",role:"Maire et président de Galley-La",arc:"water-7"},{name:"Paulie",role:"Charpentier de Galley-La",arc:"water-7"},{name:"Franky",role:"Charpentier naval",arc:"water-7"}] },
    "enies-lobby": { description:"Enies Lobby est une île judiciaire fortifiée du Gouvernement mondial, bâtie au-dessus d’un gouffre marin et accessible par une série de portes monumentales.", art:"fortress", control:"Territoire du Gouvernement mondial et siège judiciaire sous la garde du Cipher Pol à ce repère.", representatives:[{name:"Rob Lucci",role:"Agent du Cipher Pol",arc:"enies-lobby"},{name:"Spandam",role:"Directeur du CP9",arc:"enies-lobby"},{name:"Oimo",role:"Gardien géant",arc:"enies-lobby"}] },
    "thriller-bark": { description:"Thriller Bark est un navire gigantesque aménagé comme une île, qui dérive dans le brouillard du Florian Triangle avec ses forêts et ses manoirs.", art:"ghost-ship", control:"Navire sous l’autorité de Gecko Moria à cet arc ; son équipage pirate en assure l’occupation.", representatives:[{name:"Brook",role:"Musicien pirate",arc:"thriller-bark"},{name:"Gecko Moria",role:"Capitaine de Thriller Bark",arc:"thriller-bark"},{name:"Perona",role:"Membre de l’équipage",arc:"thriller-bark"}] },
    "sabaody": { description:"L’archipel Sabaody est formé par les racines et les bulles géantes de mangroves. Ses bosquets numérotés servent d’escale avant la traversée de la Red Line.", art:"mangrove", control:"Archipel sans souveraineté pirate unique ; plusieurs équipages et autorités y circulent.", representatives:[{name:"Silvers Rayleigh",role:"Artisan du revêtement naval",arc:"sabaody"},{name:"Shakuyaku",role:"Tenancière du bar",arc:"sabaody"},{name:"Camie",role:"Habitante de l’archipel",arc:"sabaody"}] },
    "amazon-lily": { description:"Amazon Lily se trouve dans le Calm Belt. Son port isolé, ses falaises et ses forêts entourent le village de la tribu Kuja.", art:"jungle-fort", control:"Île et royaume de la tribu Kuja, gouvernés par Boa Hancock ; l’équipage des Kuja est son principal pouvoir pirate.", representatives:[{name:"Boa Hancock",role:"Impératrice des Kuja",arc:"amazon-lily"},{name:"Marguerite",role:"Guerrière kuja",arc:"amazon-lily"},{name:"Sandersonia",role:"Guerrière kuja",arc:"amazon-lily"}] },
    "impel-down": { description:"Impel Down est une immense prison sous-marine isolée dans le Calm Belt. Ses niveaux sont organisés en blocs de détention de plus en plus sévères.", art:"prison", control:"Établissement pénitentiaire du Gouvernement mondial, dirigé par le directeur Magellan à cet arc.", representatives:[{name:"Magellan",role:"Directeur de la prison",arc:"impel-down"},{name:"Hannyabal",role:"Directeur adjoint",arc:"impel-down"},{name:"Emporio Ivankov",role:"Figure de Newkama Land",arc:"impel-down"}] },
    "marineford": { description:"Marineford est le quartier général de la Marine à ce repère. Ses quais fortifiés et sa baie en font un port militaire majeur de Grand Line.", art:"naval-fort", control:"Quartier général de la Marine et territoire du Gouvernement mondial à cet arc.", representatives:[{name:"Sengoku",role:"Amiral en chef de la Marine",arc:"marineford"},{name:"Edward Newgate",role:"Capitaine de l’équipage de Barbe Blanche",arc:"marineford"},{name:"Portgas D. Ace",role:"Pirate détenu à Marineford",arc:"marineford"}] },
    "rusukaina": { description:"Rusukaina est une île isolée du Calm Belt, au climat rude et à la faune particulièrement dangereuse.", art:"wild", control:"Île sauvage sans établissement permanent connu.", representatives:[{name:"Monkey D. Luffy",role:"Voyageur et élève de Rayleigh",arc:"post-war"},{name:"Silvers Rayleigh",role:"Mentor de passage",arc:"post-war"}] },
    "kuraigana": { description:"L’île de Kuraigana est recouverte de ruines et de forêts sombres. Le château qui domine l’île est entouré de babouins imitateurs.", art:"ruins", control:"Île isolée ; le château est occupé par Dracule Mihawk à ce repère.", representatives:[{name:"Dracule Mihawk",role:"Résident du château",arc:"post-war"},{name:"Perona",role:"Résidente de passage",arc:"post-war"}] },
    "weatheria": { description:"Weatheria est une île céleste où des chercheurs étudient les phénomènes météorologiques et les nuages.", art:"sky-lab", control:"Communauté de chercheurs indépendante, sans équipage pirate propriétaire.", representatives:[{name:"Nami",role:"Élève en météorologie",arc:"post-war"},{name:"Haredas",role:"Chercheur météorologue",arc:"post-war"}] },
    "boin-archipelago": { description:"L’archipel Boin est couvert d’une végétation luxuriante et de plantes carnivores ; ses îles ont l’apparence de fleurs géantes.", art:"flower-island", control:"Archipel sauvage, sans autorité pirate connue.", representatives:[{name:"Heracles",role:"Habitant et instructeur",arc:"post-war"},{name:"Usopp",role:"Voyageur de passage",arc:"post-war"}] },
    "momoiro-island": { description:"L’île Momoiro, aussi appelée royaume de Kamabakka, est connue pour ses jardins colorés et sa communauté de combattants okama.", art:"garden", control:"Royaume indépendant dirigé par Emporio Ivankov et lié à l’Armée révolutionnaire.", representatives:[{name:"Emporio Ivankov",role:"Reine du royaume de Kamabakka",arc:"post-war"},{name:"Sanji",role:"Voyageur de passage",arc:"post-war"}] },
    "torino-kingdom": { description:"Le royaume de Torino est un territoire insulaire du South Blue, où les villages sont nichés dans une forêt de très grands arbres.", art:"forest-village", control:"Royaume local indépendant ; aucun équipage pirate n’en est propriétaire.", representatives:[{name:"Tony Tony Chopper",role:"Voyageur accueilli par les habitants",arc:"post-war"}] },
    "tequila-wolf": { description:"Tequila Wolf est un chantier colossal de l’East Blue, où un pont de pierre est construit depuis des siècles au-dessus de la mer.", art:"bridge", control:"Territoire administré par le Gouvernement mondial et surveillé par ses soldats.", representatives:[{name:"Nico Robin",role:"Prisonnière puis évadée",arc:"post-war"},{name:"Armée révolutionnaire",role:"Force de libération",arc:"post-war"}] },
    "baltigo": { description:"Baltigo est une île aride de Grand Line, connue pour ses étendues désertiques et ses reliefs dénudés.", art:"desert", control:"Base de l’Armée révolutionnaire à ce repère.", representatives:[{name:"Monkey D. Dragon",role:"Chef de l’Armée révolutionnaire",arc:"post-war"},{name:"Sabo",role:"Officier de l’Armée révolutionnaire",arc:"post-war"}] },
    "karakuri-island": { description:"L’île Karakuri est une terre froide parsemée de montagnes, d’ateliers et de mécanismes. La carte en montre le paysage sans en dévoiler les secrets techniques.", art:"snow-lab", control:"Île habitée ; aucune affiliation pirate officielle confirmée dans les repères connus.", representatives:[{name:"Tony Tony Chopper",role:"Voyageur accueilli par les habitants",arc:"post-war"}] },
    "namakura-island": { description:"Namakura est une île isolée du Grand Line, dont le village et les coutumes locales sont éloignés des grandes routes maritimes.", art:"village", control:"Communauté locale sans équipage pirate propriétaire connu.", representatives:[{name:"Brook",role:"Voyageur de passage",arc:"post-war"}] },
    "kenzan-island": { description:"Kenzan est une île escarpée et boisée de Grand Line, représentée ici comme un repère de voyage plutôt qu’à l’échelle.", art:"mountain-forest", control:"Aucune autorité ou affiliation pirate confirmée dans les repères connus.", representatives:[{name:"Roronoa Zoro",role:"Visiteur de l’île",arc:"post-war"}] },
    "red-line": { description:"La Red Line est un continent gigantesque qui encercle le globe et croise Grand Line en deux points. À l’approche de Sabaody, son sommet porte la cité de Marie Joie ; son passage sous-marin conduit à l’île des Hommes-Poissons.", art:"red-mountain", control:"Continent traversant plusieurs territoires ; la cité de Marie Joie est sous l’autorité du Gouvernement mondial.", representatives:[{name:"Saint Charlos",role:"Dragon céleste de Marie Joie",arc:"sabaody"}] },
    "marie-joie": { description:"Marie Joie est bâtie au sommet de la Red Line, au-dessus de la route de Grand Line. La cité accueille les plus hautes autorités du Gouvernement mondial.", art:"holy-city", control:"Cité du Gouvernement mondial, résidence des Dragons Célestes ; aucun équipage pirate n’en est propriétaire.", representatives:[{name:"Saint Charlos",role:"Dragon céleste de la cité",arc:"sabaody"}] },
    "fishman-island": { description:"À dix mille mètres sous la mer, l’île des Hommes-Poissons est protégée par une immense bulle. Le royaume de Ryugu, la Crique des Sirènes et la Forêt Marine composent cette escale sous-marine.", art:"underwater", control:"Royaume de Ryugu gouverné par Neptune ; à la fin de cet arc, Luffy revendique l’île comme territoire des Chapeaux de paille afin de la protéger.", representatives:[{name:"Neptune",role:"Roi du royaume de Ryugu",arc:"fishman-island"},{name:"Shirahoshi",role:"Princesse du royaume de Ryugu",arc:"fishman-island"},{name:"Jinbe",role:"Allié de l’île et des Chapeaux de paille",arc:"fishman-island"}] },
    "punk-hazard": { description:"Punk Hazard est une île de Grand Line marquée par des conditions climatiques extrêmes et les vestiges d’installations scientifiques.", art:"volcan-lab", control:"Île abandonnée et sans gouvernement local ; des installations de recherche y subsistent à cet arc.", representatives:[{name:"Caesar Clown",role:"Scientifique installé sur l’île",arc:"punk-hazard"},{name:"Smoker",role:"Vice-amiral de la Marine",arc:"punk-hazard"},{name:"Kinemon",role:"Samouraï de Wano",arc:"punk-hazard"}] },
    "dressrosa": { description:"Dressrosa est un royaume insulaire ensoleillé, construit autour d’une capitale animée et de sa grande arène. Green Bit se trouve juste au large de ses côtes.", art:"mediterranean-city", control:"Royaume de Dressrosa gouverné par la famille Riku après l’arc ; l’alliance des Chapeaux de paille veille à sa sécurité.", representatives:[{name:"Rebecca",role:"Gladiatrice et membre de la famille royale",arc:"dressrosa"},{name:"Riku Doldo III",role:"Roi de Dressrosa",arc:"dressrosa"},{name:"Kyros",role:"Protecteur de la famille royale",arc:"dressrosa"}] },
    "green-bit": { description:"Green Bit est une île boisée et inhabitée, séparée de Dressrosa par un bras de mer réputé dangereux.", art:"forest", control:"Aucun équipage ne revendique officiellement l’île ; le peuple Tontatta y vit à l’abri dans la forêt.", representatives:[{name:"Leo",role:"Guerrier tontatta",arc:"dressrosa"},{name:"Usopp",role:"Allié des Tontattas",arc:"dressrosa"},{name:"Nico Robin",role:"Archéologue en mission",arc:"dressrosa"}] },
    "zou": { description:"Zou est une île mobile située sur le dos de Zunesha. Les cités et forêts des Minks se déplacent ainsi au fil des mers du Nouveau Monde.", art:"elephant-island", control:"Pays des Minks gouverné par ses ducs ; les Chapeaux de paille sont leurs alliés, sans posséder l’île.", representatives:[{name:"Inuarashi",role:"Duc des Minks",arc:"zou"},{name:"Nekomamushi",role:"Duc des Minks",arc:"zou"},{name:"Carrot",role:"Guerrière mink",arc:"zou"}] },
    "cacao-island": { description:"L’île Cacao est une île habitée de Totto Land, réputée pour ses ateliers et ses rues aux façades inspirées des douceurs.", art:"candy-town", control:"Territoire de Big Mom et de son équipage pirate à cet arc.", representatives:[{name:"Charlotte Pudding",role:"Habitante de Totto Land",arc:"whole-cake-island"},{name:"Charlotte Oven",role:"Ministre de Totto Land",arc:"whole-cake-island"}] },
    "whole-cake-island": { description:"Whole Cake Island est le centre de Totto Land. Son paysage de pâtisseries et son château donnent à l’île un aspect de conte gourmand.", art:"cake-castle", control:"Territoire dirigé par Big Mom et l’équipage des Pirates de Big Mom.", representatives:[{name:"Charlotte Linlin",role:"Souveraine de Totto Land",arc:"whole-cake-island"},{name:"Charlotte Katakuri",role:"Commandant des Pirates de Big Mom",arc:"whole-cake-island"},{name:"Sanji",role:"Cuisinier des Chapeaux de paille",arc:"whole-cake-island"}] },
    "nuts-island": { description:"Nuts Island est l’une des îles habitées de Totto Land, avec un village et des plantations aux couleurs de l’archipel.", art:"candy-town", control:"Territoire de Big Mom et de son équipage pirate à cet arc.", representatives:[{name:"Charlotte Smoothie",role:"Commandante des Pirates de Big Mom",arc:"whole-cake-island"}] },
    "totto-land": { description:"Totto Land est un archipel du Nouveau Monde composé de nombreuses îles et gouverné depuis Whole Cake Island.", art:"archipelago", control:"Territoire pirate de Big Mom à cet arc.", representatives:[{name:"Charlotte Linlin",role:"Souveraine de l’archipel",arc:"whole-cake-island"},{name:"Charlotte Perospero",role:"Ministre de Totto Land",arc:"whole-cake-island"}] },
    "mirror-world": { description:"Mirro-World est un espace singulier accessible par les miroirs de Totto Land. Ses reflets permettent de passer d’un miroir à l’autre.", art:"mirror", control:"Espace associé aux pouvoirs de Brûlée, au sein du territoire de Big Mom.", representatives:[{name:"Charlotte Brûlée",role:"Habitante de Totto Land",arc:"whole-cake-island"}] },
    "germa-kingdom": { description:"Germa Kingdom est un royaume mobile dont les quartiers se déploient à partir d’une flotte de navires spécialisés.", art:"fleet", control:"Royaume et flotte sous l’autorité de la famille Vinsmoke ; alliance militaire indépendante.", representatives:[{name:"Vinsmoke Judge",role:"Roi et commandant de Germa 66",arc:"whole-cake-island"},{name:"Vinsmoke Reiju",role:"Princesse de Germa",arc:"whole-cake-island"}] },
    "wano": { description:"Le pays de Wano est un pays insulaire fermé, composé de régions aux paysages et climats distincts, dominé par de hautes montagnes et des cascades.", art:"japanese-castle", control:"Pays gouverné par le shogun à la fin de l’arc ; les Chapeaux de paille ont contribué à sa libération, sans en devenir propriétaires.", representatives:[{name:"Kozuki Momonosuke",role:"Shogun de Wano à la fin de l’arc",arc:"wano"},{name:"Kinemon",role:"Samouraï des Neuf Fourreaux rouges",arc:"wano"},{name:"Tama",role:"Habitante de Wano",arc:"wano"}] },
    "onigashima": { description:"Onigashima est une île au large de Wano, reconnaissable à sa silhouette rocheuse et à son grand château en forme de crâne.", art:"skull-island", control:"Repère de l’équipage aux Cent Bêtes durant l’arc de Wano.", representatives:[{name:"Kaido",role:"Capitaine des Pirates aux Cent Bêtes",arc:"wano"},{name:"Yamato",role:"Combattant d’Onigashima",arc:"wano"},{name:"Kozuki Momonosuke",role:"Adversaire de Kaido",arc:"wano"}] },
    "egghead": { description:"Egghead est une île futuriste du Nouveau Monde, équipée de laboratoires et de technologies très avancées.", art:"futuristic", control:"Île de recherche du Gouvernement mondial, sous la responsabilité du corps scientifique de Vegapunk à cet arc.", representatives:[{name:"Dr. Vegapunk",role:"Scientifique en chef",arc:"egghead"},{name:"Jewelry Bonney",role:"Pirate présente sur l’île",arc:"egghead"},{name:"Sentomaru",role:"Commandant de la Marine",arc:"egghead"}] },
    "elbaph": { description:"Elbaph est une terre de géants du Nouveau Monde, dont les villages, les forêts et les reliefs rappellent les récits de guerriers anciens.", art:"giant-village", control:"Terre des géants, gouvernée par ses communautés ; aucun équipage pirate n’en est propriétaire.", representatives:[{name:"Dorry",role:"Guerrier géant d’Elbaph",arc:"elbaph"},{name:"Brogy",role:"Guerrier géant d’Elbaph",arc:"elbaph"},{name:"Hajrudin",role:"Capitaine géant allié",arc:"elbaph"}] },
  };
  var locationArtPages = {
    "goat-island":["Goat Island"], "foosha":["Dawn Island","Foosha Village"], "shells-town":["Shells Town"],
    "orange-town":["Orange Town"], "rare-animal-island":["Rare Animal Island"], "syrup-village":["Syrup Village"],
    "baratie":["Baratie"], "conomi-islands":["Conomi Islands"], "loguetown":["Loguetown"],
    "reverse-mountain":["Reverse Mountain","Twin Cape"], "whisky-peak":["Whisky Peak","Cactus Island"],
    "little-garden":["Little Garden"], "drum-island":["Drum Island"], "alabasta":["Arabasta Kingdom","Alabasta"],
    "jaya":["Jaya"], "skypiea":["Skypiea"], "long-ring-long-land":["Long Ring Long Land"],
    "water-7":["Water 7","Water Seven"], "enies-lobby":["Enies Lobby"], "thriller-bark":["Thriller Bark"],
    "sabaody":["Sabaody Archipelago","Sabaody"], "amazon-lily":["Amazon Lily"], "impel-down":["Impel Down"],
    "marineford":["Marineford"], "rusukaina":["Rusukaina"], "kuraigana":["Kuraigana Island","Kuraigana"],
    "weatheria":["Weatheria"], "boin-archipelago":["Boin Archipelago"], "momoiro-island":["Momoiro Island","Kamabakka Kingdom"],
    "torino-kingdom":["Torino Kingdom"], "tequila-wolf":["Tequila Wolf"], "baltigo":["Baltigo"],
    "karakuri-island":["Karakuri Island"], "namakura-island":["Namakura Island"], "kenzan-island":["Kenzan Island"],
    "red-line":["Red Line"], "marie-joie":["Mary Geoise","Marie Joie"], "fishman-island":["Fish-Man Island","Fishman Island"],
    "punk-hazard":["Punk Hazard"], "dressrosa":["Dressrosa"], "green-bit":["Green Bit"], "zou":["Zou"],
    "cacao-island":["Cacao Island"], "whole-cake-island":["Whole Cake Island"], "nuts-island":["Nuts Island"],
    "totto-land":["Totto Land"], "mirror-world":["Mirro-World"], "germa-kingdom":["Germa Kingdom"],
    "wano":["Wano Country"], "onigashima":["Onigashima"], "egghead":["Egghead"], "elbaph":["Elbaf","Elbaph"]
  };
  var locationArtCache = new Map();
  var locationArtRequests = new Map();
  var curatedLocationArt = {
    alabasta: { image:"https://static.wikia.nocookie.net/onepiece/images/2/29/Arabasta_Kingdom_Infobox.png/revision/latest?cb=20240103024400", sourceUrl:"https://onepiece.fandom.com/wiki/Arabasta_Kingdom" },
    "water-7": { image:"https://vignette.wikia.nocookie.net/onepiece/images/9/93/Water_7_Infobox.png/revision/latest?cb=20160819212754", sourceUrl:"https://onepiece.fandom.com/wiki/Water_7" }
  };
  var safeBlueOrder = ["East Blue", "West Blue", "North Blue", "South Blue"];
  var safeGeographyOrder = ["Grand Line", "Calm Belt"];

  function arcIndex(id) {
    return DATA.arcs.findIndex(function (arc) { return arc.id === id; });
  }

  function visibleLocations() {
    if (state.progress === null || state.progress < 0) return [];
    return locations.filter(function (location) {
      var required = arcIndex(location.arc);
      return required >= 0 && required <= state.progress;
    });
  }

  function geographyRevealed() {
    return state.progress >= arcIndex("reverse-mountain");
  }

  function availableSeas(discovered) {
    var values = discovered.map(function (location) { return location.sea; });
    if (state.progress >= 0) values.push("East Blue");
    if (geographyRevealed()) values = values.concat(safeBlueOrder, safeGeographyOrder);
    return ["Toutes les mers"].concat(safeBlueOrder.filter(function (sea) { return values.indexOf(sea) >= 0; }), safeGeographyOrder.filter(function (sea) { return values.indexOf(sea) >= 0; }), ["Red Line"].filter(function (sea) { return values.indexOf(sea) >= 0; }));
  }

  function availableTypes(discovered) {
    return ["Tous les types"].concat(Array.from(new Set(discovered.map(function (location) { return location.type; }))).sort());
  }

  function filteredLocations() {
    var query = String(state.mapQuery || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    return visibleLocations().filter(function (location) {
      var seaMatch = state.mapSea === "Toutes les mers" || location.sea === state.mapSea;
      var typeMatch = state.mapType === "Tous les types" || location.type === state.mapType;
      var textMatch = !query || (location.name + " " + location.type + " " + location.sea).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().indexOf(query) !== -1;
      return seaMatch && typeMatch && textMatch;
    });
  }

  function selectOptions(options, selected) {
    return options.map(function (option) {
      return '<option value="' + escapeHtml(option) + '"' + (option === selected ? " selected" : "") + '>' + escapeHtml(option) + '</option>';
    }).join("");
  }

  function mapScale() {
    return Math.min(1, Math.max(.38, (window.innerHeight - 210) / 820));
  }

  function profileFor(location) {
    return islandProfiles[location.id] || { description:location.note, art:"island", control:"Aucune autorité ou affiliation pirate supplémentaire n’est confirmée dans les repères connus.", representatives:[] };
  }

  function unlockedCharacterFor(person) {
    return (state.characters || []).find(function (entry) {
      return Number(entry.knownAt) <= state.progress && identityKey(entry.name) === identityKey(person.name);
    }) || null;
  }

  function visibleRepresentatives(location) {
    var profile = profileFor(location);
    return profile.representatives.filter(function (person) {
      return arcIndex(person.arc) >= 0 && arcIndex(person.arc) <= state.progress && safeCharacterName(person.name);
    });
  }

  function representativePortrait(person, displayName, character) {
    var initials = displayName.split(/\s+/).filter(Boolean).slice(0,2).map(function (part) { return part.slice(0,1); }).join("").toUpperCase() || "✦";
    var hash = String(person.name || "").split("").reduce(function (value,char) { return (value * 31 + char.charCodeAt(0)) >>> 0; }, 17);
    var hue = hash % 360;
    var fallback = '<svg class="detail-member-photo member-art" viewBox="0 0 80 96" role="img" aria-label="Illustration de ' + escapeHtml(displayName) + '"><defs><linearGradient id="map-member-' + hash + '" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(' + hue + ' 48% 42%)"/><stop offset="1" stop-color="hsl(' + ((hue + 52) % 360) + ' 45% 17%)"/></linearGradient></defs><rect width="80" height="96" rx="7" fill="url(#map-member-' + hash + ')"/><circle cx="40" cy="33" r="16" fill="#ead9bd"/><path d="M12 92c1-23 11-35 28-35s27 12 28 35" fill="#172329"/><circle cx="61" cy="75" r="11" fill="#101b20" stroke="#dfc77c"/><text x="61" y="79" text-anchor="middle" fill="#f2e6bf" font-size="11" font-family="serif">' + escapeHtml(initials.slice(0,1)) + '</text></svg>';
    if (!character || !character.image) return fallback;
    return '<img class="detail-member-photo" src="' + escapeHtml(character.image) + '" alt="Portrait de ' + escapeHtml(displayName) + '" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>' + fallback + '</span>';
  }

  function safeArtworkUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === "https:" && (url.hostname === "static.wikia.nocookie.net" || url.hostname === "vignette.wikia.nocookie.net") ? url.href : "";
    } catch { return ""; }
  }

  async function fetchClientArtwork(location, signal) {
    var titles = locationArtPages[location.id] || [location.name];
    for (var i = 0; i < titles.length; i += 1) {
      var params = new URLSearchParams({ action:"query", format:"json", formatversion:"2", prop:"pageimages", piprop:"thumbnail|original", pithumbsize:"1000", redirects:"1", origin:"*", titles:titles[i] });
      var response = await fetch("https://onepiece.fandom.com/api.php?" + params.toString(), { credentials:"omit", signal:signal });
      if (!response.ok) continue;
      var payload = await response.json();
      var pages = payload && payload.query && payload.query.pages;
      pages = Array.isArray(pages) ? pages : pages && typeof pages === "object" ? Object.keys(pages).map(function (key) { return pages[key]; }) : [];
      var page = pages.find(function (item) { return !item.missing; });
      var image = safeArtworkUrl(page && page.thumbnail && page.thumbnail.source || page && page.original && page.original.source);
      if (image) {
        var title = String(page.title || titles[i]).replace(/ /g, "_");
        return { image:image, sourceUrl:"https://onepiece.fandom.com/wiki/" + encodeURIComponent(title) };
      }
    }
    return null;
  }

  function locationArtworkMarkup(location) {
    var cached = locationArtCache.get(location.id);
    var available = !!(cached && cached.image && cached.sourceUrl);
    var fallback = '<div class="worldmap-artwork-fallback"' + (available ? ' hidden' : '') + '>' + islandArt(location, true) + '</div>';
    var photo = available ? '<img class="worldmap-location-photo" src="' + escapeHtml(cached.image) + '" alt="Visuel de ' + escapeHtml(location.name) + ' dans One Piece" decoding="async" fetchpriority="high" onerror="this.hidden=true;this.previousElementSibling.hidden=false;this.closest(\'figure\').querySelector(\'[data-location-art-credit]\').hidden=true;this.closest(\'figure\').querySelector(\'[data-location-art-status]\').textContent=\'Illustration schématique disponible en remplacement.\'">' : '';
    var credit = available ? '<a data-location-art-credit href="' + escapeHtml(cached.sourceUrl) + '" target="_blank" rel="noreferrer">Visuel : One Piece Wiki (Fandom) ↗</a>' : '';
    var status = available ? '' : locationArtCache.has(location.id) ? 'Visuel de référence indisponible; illustration schématique affichée.' : 'Recherche d’un visuel de référence…';
    return '<figure class="worldmap-artwork detail-image" data-location-art-root="' + escapeHtml(location.id) + '"><div class="worldmap-artwork-frame">' + fallback + photo + '</div><figcaption><span data-location-art-status role="status">' + status + '</span>' + credit + '</figcaption></figure>';
  }

  function paintLocationArtwork(location, artwork) {
    var root = Array.from(document.querySelectorAll("[data-location-art-root]")).find(function (item) { return item.getAttribute("data-location-art-root") === location.id; });
    if (!root || !visibleLocations().some(function (item) { return item.id === location.id; })) return;
    var fallback = '<div class="worldmap-artwork-fallback"' + (artwork ? ' hidden' : '') + '>' + islandArt(location, true) + '</div>';
    var photo = artwork ? '<img class="worldmap-location-photo" src="' + escapeHtml(artwork.image) + '" alt="Visuel de ' + escapeHtml(location.name) + ' dans One Piece" decoding="async" fetchpriority="high" onerror="this.hidden=true;this.previousElementSibling.hidden=false;this.closest(\'figure\').querySelector(\'[data-location-art-credit]\').hidden=true;this.closest(\'figure\').querySelector(\'[data-location-art-status]\').textContent=\'Illustration schématique disponible en remplacement.\'">' : '';
    var credit = artwork ? '<a data-location-art-credit href="' + escapeHtml(artwork.sourceUrl) + '" target="_blank" rel="noreferrer">Visuel : One Piece Wiki (Fandom) ↗</a>' : '';
    var status = artwork ? '' : 'Visuel de référence indisponible; illustration schématique affichée.';
    root.innerHTML = '<div class="worldmap-artwork-frame">' + fallback + photo + '</div><figcaption><span data-location-art-status role="status">' + status + '</span>' + credit + '</figcaption>';
  }

  function requestLocationArtwork(location) {
    if (locationArtCache.has(location.id)) {
      paintLocationArtwork(location, locationArtCache.get(location.id));
      return;
    }
    if (locationArtRequests.has(location.id)) return;
    var request = (async function () {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 8000);
      try {
        var params = new URLSearchParams({ location:location.id, progress:String(state.progress) });
        var payload = null;
        try {
          var response = await fetch("/api/location-art?" + params.toString(), { credentials:"same-origin", signal:controller.signal });
          payload = response.ok ? await response.json() : null;
        } catch {
          // Try the public image API below if this deployment cannot reach the wiki server-side.
        }
        var image = safeArtworkUrl(payload && payload.image);
        var sourceUrl = payload && typeof payload.sourceUrl === "string" && payload.sourceUrl.indexOf("https://onepiece.fandom.com/wiki/") === 0 ? payload.sourceUrl : "";
        if (image && sourceUrl) return { image:image, sourceUrl:sourceUrl };
        try { return await fetchClientArtwork(location, controller.signal); } catch { return null; }
      } catch {
        // The local illustration remains available if the reference service is offline.
      } finally {
        clearTimeout(timer);
      }
      return null;
    })().then(function (artwork) {
      if (!artwork) artwork = curatedLocationArt[location.id] || null;
      locationArtCache.set(location.id, artwork);
      locationArtRequests.delete(location.id);
      paintLocationArtwork(location, artwork);
    }).catch(function () {
      locationArtCache.set(location.id, null);
      locationArtRequests.delete(location.id);
      paintLocationArtwork(location, null);
    });
    locationArtRequests.set(location.id, request);
  }

  function islandArt(location, large) {
    var profile = profileFor(location);
    var palettes = {
      rocky:["#385a67","#c7b37a","#82928b"], village:["#315b69","#96a66f","#e5bd76"], port:["#315d77","#b7ad83","#e9c582"], orchard:["#2f655b","#9bab64","#e3c77d"], ship:["#355d6c","#815d48","#c7a86c"], mountain:["#294e68","#b7c5bd","#738b88"], "desert-town":["#775f46","#d5ae68","#93754e"], jungle:["#315b55","#789251","#c2ad64"], snow:["#456b83","#d2dfe0","#78909a"], "desert-kingdom":["#796044","#d9ae64","#f0d18a"], desert:["#665943","#c8a562","#8e7651"], "jungle-town":["#395d59","#83965c","#d3b16d"], sky:["#73a9bb","#e7dfb7","#b7d5ca"], "long-island":["#3a6872","#97ae83","#d6c68f"], "canal-city":["#315c70","#d0b886","#e2ca8e"], fortress:["#40566a","#989b8b","#d6bb78"], "ghost-ship":["#283e50","#596b60","#c1a474"], mangrove:["#286078","#8aa269","#d7bb75"], "jungle-fort":["#32604f","#a0a16c","#c6b27a"], prison:["#33526a","#6d8184","#d0b77a"], "naval-fort":["#315c72","#a6b8b1","#e0c47a"], wild:["#315b52","#87965d","#c0a768"], ruins:["#394c56","#837f67","#c2ab73"], "sky-lab":["#74a9ba","#d4d9bd","#e3c97f"], "flower-island":["#385e58","#a2a66b","#e1bc72"], garden:["#516750","#d49089","#e4c47e"], "forest-village":["#49684f","#a6ad79","#ddc48b"], bridge:["#3b6275","#b99b72","#d7c29a"], "mountain-forest":["#365d61","#9aab83","#c9b77d"], "red-mountain":["#426477","#8f5e4b","#d08b68"], "holy-city":["#416b82","#eadcb0","#d1a35c"], underwater:["#236182","#63adab","#edcf81"], "volcan-lab":["#464e5c","#9b684e","#e29d66"], "mediterranean-city":["#39718a","#e6c486","#bb735c"], forest:["#366252","#73945c","#c4bb75"], "elephant-island":["#426a68","#a1a67b","#d9c181"], "candy-town":["#526a81","#d08d92","#f0d28a"], "cake-castle":["#826a75","#e6a1a0","#f0d58e"], archipelago:["#316479","#8f9f70","#e2c882"], mirror:["#435d74","#90bfd0","#e0ca87"], fleet:["#365b72","#a9a58b","#dfc37b"], "japanese-castle":["#3b5964","#b4745f","#e0c782"], "skull-island":["#394b57","#7d685d","#d1bd82"], futuristic:["#3e7288","#b7d3d3","#e7d480"], "giant-village":["#486d62","#8ba06e","#dcc383"], island:["#315d69","#8ea276","#d1bc7c"]
    };
    var palette = palettes[profile.art] || palettes.island;
    var land = '<path d="M25 82 Q35 70 53 75 Q70 62 91 73 Q111 58 128 72 Q148 66 158 81 Q150 99 126 101 H50 Q32 99 25 82Z" fill="' + palette[1] + '" stroke="#d4c68f" stroke-width="2"/>';
    var features = "";
    var art = profile.art;
    if (art === "sky" || art === "sky-lab") {
      land = '<path d="M42 80 Q58 70 76 78 Q98 67 117 76 Q137 70 148 81 Q141 91 119 92 H62 Q48 90 42 80Z" fill="' + palette[1] + '" stroke="#ecdfbb" stroke-width="2"/><path d="M57 89 68 106h44l11-17" fill="#f5f0da" opacity=".8"/>';
      features = '<path d="M42 48c0-7 6-12 14-12 3-10 19-10 23 0 9 0 14 5 14 12H42Zm48-16c0-6 5-10 11-10 3-8 16-8 19 0 7 0 12 4 12 10H90Z" fill="#f2f0dc" stroke="#d3e4dd" stroke-width="2"/><circle cx="151" cy="33" r="4" fill="#f2d982"/>';
    } else if (art === "underwater") {
      land = '<ellipse cx="92" cy="88" rx="62" ry="20" fill="#4b8584" stroke="#82cbc5" stroke-width="2"/><path d="M42 82 Q48 36 91 35 Q137 36 143 82" fill="#b6dad3" fill-opacity=".24" stroke="#b8e3dc" stroke-width="3"/><path d="M56 73 Q68 58 82 70V83H56Zm29-19h17v29H85Zm23 15q14-11 23 2v12h-23Z" fill="#edd49a" stroke="#f5e8c2" stroke-width="2"/><path d="M35 91q-8-18 1-25m7 26q-4-11 4-17m83 18q12-18 4-27m6 26q-3-12 5-19" fill="none" stroke="#6fc1ba" stroke-width="4" stroke-linecap="round"/><circle cx="47" cy="39" r="3" fill="#b6e9e0"/><circle cx="136" cy="43" r="4" fill="#b6e9e0"/>';
      features = '<path d="M0 25q18-9 35 0t35 0m20 0q18-9 35 0t35 0M5 112q18-9 35 0t35 0m25 0q18-9 35 0t35 0" fill="none" stroke="#8dd3d0" stroke-opacity=".55" stroke-width="2"/>';
    } else if (art === "mangrove") {
      features = '<path d="M53 79 57 33m0 36-14 14m16-9 12 12M91 78l3-55m0 39-17 18m18-14 13 15M127 80l-3-40m1 28-13 14m13-12 12 13" fill="none" stroke="#b8a26f" stroke-width="5" stroke-linecap="round"/><circle cx="57" cy="30" r="18" fill="#748f68" stroke="#c9bb82" stroke-width="2"/><circle cx="94" cy="22" r="20" fill="#80996e" stroke="#c9bb82" stroke-width="2"/><circle cx="124" cy="38" r="16" fill="#718a63" stroke="#c9bb82" stroke-width="2"/><circle cx="40" cy="52" r="4" fill="#cbe4e4" opacity=".8"/><circle cx="147" cy="58" r="3" fill="#cbe4e4" opacity=".8"/>';
    } else if (art === "red-mountain") {
      land = '<path d="M12 105 38 70 56 75 76 18 99 62 115 52 143 105Z" fill="' + palette[1] + '" stroke="' + palette[2] + '" stroke-width="3"/><path d="m63 51 13-33 15 29-13-6-7 9Zm-22 29 10-7 8 11" fill="#e0c18c" opacity=".75"/><path d="M77 83c25-7 43-8 62-4" fill="none" stroke="#6fd0db" stroke-width="5" stroke-linecap="round"/>';
      features = '<path d="M19 111h140" stroke="#b6e3ea" stroke-width="3"/><circle cx="80" cy="88" r="6" fill="#f2d27d"/>';
    } else if (art === "desert" || art === "desert-town" || art === "desert-kingdom" || art === "jungle-town" || art === "port" || art === "village" || art === "orchard" || art === "canal-city" || art === "mediterranean-city" || art === "candy-town" || art === "cake-castle" || art === "holy-city" || art === "garden" || art === "forest-village" || art === "naval-fort" || art === "fortress" || art === "prison" || art === "ship" || art === "ghost-ship" || art === "fleet" || art === "bridge" || art === "japanese-castle" || art === "futuristic" || art === "volcan-lab" || art === "mirror") {
      var building = "<path d='M49 77V53l12-10 12 10v24Zm34 3V45h21v35Zm30-1V57l13-10 13 10v22Z' fill='" + palette[2] + "' stroke='#f0dfad' stroke-width='2'/><path d='M56 77V57h10v20m24 0V53h13v24m21 0V61h8v16' fill='none' stroke='#63594a' stroke-width='2'/>";
      if (art === "desert" || art === "desert-town" || art === "desert-kingdom") building = "<path d='M58 87 82 45l23 42Zm52 0 18-30 17 30Z' fill='" + palette[2] + "' stroke='#f0dfad' stroke-width='2'/><path d='M35 89q29-14 58 0t58 0' fill='none' stroke='#edd18b' stroke-width='3'/>";
      if (art === "canal-city" || art === "mediterranean-city") building = "<path d='M45 76V53l12-10 12 10v23Zm30 0V39h20v37Zm30 0V53l13-10 13 10v23Z' fill='" + palette[2] + "' stroke='#f0dfad' stroke-width='2'/><path d='M32 86q25-8 50 0t51 0m-101 9q25-8 50 0t51 0' fill='none' stroke='#6bc2d0' stroke-width='5'/>";
      if (art === "fortress" || art === "naval-fort" || art === "prison") building = "<path d='M44 82V48h17v12h13V48h17v12h13V48h17v34Z' fill='" + palette[2] + "' stroke='#eee0b7' stroke-width='2'/><path d='M57 82V66h12v16m22 0V66h12v16m-28-27h7m13 0h7' fill='none' stroke='#5b5c5a' stroke-width='3'/>";
      if (art === "ship" || art === "ghost-ship" || art === "fleet") building = "<path d='M35 80h111l-18 21H57Z' fill='" + palette[2] + "' stroke='#eed8a5' stroke-width='2'/><path d='M90 33v46M91 38 63 70h28Zm7 7 27 24H98Z' fill='none' stroke='#e9dfc3' stroke-width='3'/><path d='M46 106q18-8 36 0t37 0t36 0' fill='none' stroke='#7bc9d4' stroke-width='3'/>";
      if (art === "japanese-castle" || art === "holy-city" || art === "cake-castle" || art === "futuristic") building = "<path d='M46 85V60h18V48l28-20 28 20v12h18v25Z' fill='" + palette[2] + "' stroke='#f0dfad' stroke-width='2'/><path d='M58 60h62M78 43h28M86 85V65h15v20m-31-37 28-20 28 20' fill='none' stroke='#fff0cd' stroke-width='3'/><circle cx='93' cy='18' r='5' fill='#edcf80'/>";
      if (art === "mirror") building += "<path d='M30 74q15-13 30 0t30 0t30 0t30 0' fill='none' stroke='#b4e4ec' stroke-width='2'/>";
      if (art === "volcan-lab") building = "<path d='M59 83 80 28l24 55Zm50-4V51h30v28Z' fill='" + palette[2] + "' stroke='#f0dfad' stroke-width='2'/><path d='M79 38q-9-9-2-18m13 10q-2-12 8-17' fill='none' stroke='#f0a178' stroke-width='4' stroke-linecap='round'/>";
      features = building;
      if (art === "desert" || art === "desert-town" || art === "desert-kingdom") land = '<path d="M18 92 Q47 72 77 88 Q110 67 160 88 Q144 105 105 105H45Q28 102 18 92Z" fill="' + palette[1] + '" stroke="#e8c57f" stroke-width="2"/>';
      if (art === "candy-town" || art === "cake-castle") features += '<circle cx="47" cy="38" r="8" fill="#df9c9d"/><circle cx="140" cy="43" r="7" fill="#efd58a"/><path d="M42 42v18m98-14v18" stroke="#eee3bd" stroke-width="2"/>';
      if (art === "futuristic") features += '<circle cx="43" cy="50" r="9" fill="none" stroke="#80d3dd" stroke-width="3"/><path d="M37 50h12m-6-6v12" stroke="#80d3dd" stroke-width="2"/>';
    } else if (art === "snow" || art === "snow-lab" || art === "mountain-forest" || art === "ruins" || art === "skull-island" || art === "wild" || art === "jungle" || art === "forest" || art === "flower-island" || art === "giant-village") {
      var mountainFill = art === "snow" || art === "snow-lab" ? "#dbe7e3" : palette[1];
      land = '<path d="M18 99 49 51 70 76 96 25 126 75 145 52 165 99Z" fill="' + mountainFill + '" stroke="' + palette[2] + '" stroke-width="2"/><path d="m83 48 13-23 13 25-13-7Zm-37 22 7-13 8 13" fill="#edf0dd" opacity=".9"/>';
      features = '<path d="M37 93v-19m0 8-8-8m8 13 8-10m48 16V68m0 10-8-8m8 14 8-10m27 9V73m0 8-8-8m8 14 8-11" fill="none" stroke="' + palette[2] + '" stroke-width="4" stroke-linecap="round"/>';
      if (art === "ruins") features = '<path d="M44 95V69h15v26m0-26V53h14v42m28 0V61h15v34m0-34V49h14v46M41 70h20m41-9h18" fill="none" stroke="#d0be8d" stroke-width="5"/>';
      if (art === "skull-island") features = '<path d="M49 90V69h14V53l29-22 29 22v16h14v21Z" fill="#91816e" stroke="#e4d2a2" stroke-width="2"/><circle cx="83" cy="61" r="6" fill="#28343d"/><circle cx="101" cy="61" r="6" fill="#28343d"/><path d="M84 75h16m-8-5v12" stroke="#28343d" stroke-width="4"/>';
      if (art === "flower-island") features = '<path d="M42 84v-19m0 10-9-9m9 14 9-12m48 13V60m0 12-9-9m9 14 9-10m21 12V64m0 10-8-8m8 11 8-9" fill="none" stroke="#70934e" stroke-width="4"/><circle cx="42" cy="60" r="10" fill="#dc9e91"/><circle cx="99" cy="58" r="11" fill="#e5c77c"/><circle cx="130" cy="62" r="10" fill="#c88594"/>';
    } else if (art === "long-island" || art === "archipelago" || art === "elephant-island") {
      land = '<path d="M13 89 Q39 78 59 86 Q77 71 96 83 Q119 73 139 85 Q151 79 169 88 L164 100H21Z" fill="' + palette[1] + '" stroke="#d6c58a" stroke-width="2"/><path d="M28 76v19m32-20v21m31-18v18m38-19v17" stroke="' + palette[2] + '" stroke-width="3"/>';
      features = art === "elephant-island" ? '<path d="M26 80q10-24 29-20l8 11 14 2q8 6 2 13H34q-8-1-8-6Zm39-8 9-12m-9 12 13 2" fill="#718b73" stroke="#dac78d" stroke-width="3" stroke-linecap="round"/><path d="M39 84v12m13-12v12m11-12v12" stroke="#685f4c" stroke-width="3"/>' : '<path d="M39 78V58l13-11 13 11v20m35 0V50l16-13 16 13v28" fill="' + palette[2] + '" stroke="#eee0b6" stroke-width="2"/><path d="M32 87q18-8 35 0t35 0t35 0" fill="none" stroke="#75c5d3" stroke-width="4"/>';
    }
    var water = '<rect width="180" height="120" rx="12" fill="' + palette[0] + '"/><path d="M0 25q17-8 34 0t34 0t34 0t34 0t34 0M0 111q17-8 34 0t34 0t34 0t34 0t34 0" fill="none" stroke="#a7dbe0" stroke-opacity=".3" stroke-width="2"/>';
    var markup = '<svg class="' + (large ? 'worldmap-location-art detail-image' : 'worldmap-mini-art') + '" viewBox="0 0 180 120" role="' + (large ? 'img' : 'presentation') + '" ' + (large ? 'aria-label="Illustration de ' + escapeHtml(location.name) + '"' : 'aria-hidden="true"') + ' xmlns="http://www.w3.org/2000/svg">' + water + land + features + '<path d="M8 117h164" stroke="#d2be7e" stroke-opacity=".65" stroke-width="2"/></svg>';
    return markup;
  }

  function pointMarkup(location) {
    var labelY = location.y < 250 ? location.y + 47 : location.y < 350 ? location.y + 50 : location.y > 600 ? location.y - 32 : (location.y === 410 ? location.y - 44 : location.y + 46);
    var shortLabel = location.short.length > 20 ? location.short.slice(0, 18) + "…" : location.short;
    var laboon = location.id === "reverse-mountain" ? '<path class="worldmap-laboon" d="M972 417c8-12 25-15 38-8l12 7 8-8 9 3-4 10 6 6-12 2-8-5-10 6-18-1-12-5-9 2-7-5 12-4Z"/><path class="worldmap-laboon-tail" d="m1030 411 3-9 8 4m-8 5 8 1 5-7"/><text class="worldmap-laboon-label" x="1010" y="450">Laboon</text>' : "";
    return '<a class="worldmap-pin worldmap-pin-' + escapeHtml(location.type.toLowerCase().replace(/[^a-z0-9]+/g, "-")) + '" href="#lieu/' + encodeURIComponent(location.id) + '" data-map-location="' + escapeHtml(location.id) + '" aria-label="Ouvrir ' + escapeHtml(location.name) + '" data-location-id="' + escapeHtml(location.id) + '" tabindex="0">' +
      '<ellipse class="worldmap-pin-halo" pointer-events="all" cx="' + location.x + '" cy="' + location.y + '" rx="45" ry="33"/><svg class="worldmap-pin-scene" x="' + (location.x - 39) + '" y="' + (location.y - 27) + '" width="78" height="52" viewBox="0 0 180 120">' + islandArt(location, false).replace(/^<svg[^>]*>|<\/svg>$/g, "") + '</svg>' +
      laboon + '<text class="worldmap-pin-label" x="' + location.x + '" y="' + labelY + '" text-anchor="middle">' + escapeHtml(shortLabel) + '</text></a>';
  }

  function worldSvg(list) {
    var hasChartedTheGrandLine = geographyRevealed();
    var staticLabels = state.progress >= 0 ? '<text x="255" y="78">EAST BLUE</text>' : "";
    if (hasChartedTheGrandLine) staticLabels += '<text x="1290" y="78">NORTH BLUE</text><text x="255" y="788">WEST BLUE</text><text x="1290" y="788">SOUTH BLUE</text><text x="1200" y="274">CALM BELT</text><text x="1200" y="600">CALM BELT</text><text x="1260" y="382">GRAND LINE</text><text x="2410" y="280" transform="rotate(90 2410 280)">RED LINE</text>';
    var taraiTriangle = state.progress >= arcIndex("marineford") ? '<g class="worldmap-tarai" aria-label="Courant de Tarai et Portes de la Justice"><path class="worldmap-tarai-edge" d="M2010 410 Q2100 319 2180 270 Q2245 386 2200 500 Q2088 506 2010 410Z"/><path class="worldmap-tarai-swirl" d="M2098 392c7-19 33-25 47-11 14 14 7 38-10 44-15 5-29-7-24-20 4-10 18-11 22-2 3 7-5 12-10 8"/><text class="worldmap-tarai-label" x="2130" y="444">COURANT DE TARAI</text><g class="worldmap-justice-gate" transform="translate(1982 352)"><path d="M0 28V8h5v20m19 0V8h5v20M3 8h23M4 3h21v4H4Zm6 12v13m9-13v13"/></g><g class="worldmap-justice-gate" transform="translate(2142 219)"><path d="M0 28V8h5v20m19 0V8h5v20M3 8h23M4 3h21v4H4Zm6 12v13m9-13v13"/></g><g class="worldmap-justice-gate" transform="translate(2215 525)"><path d="M0 28V8h5v20m19 0V8h5v20M3 8h23M4 3h21v4H4Zm6 12v13m9-13v13"/></g><text class="worldmap-gate-caption" x="2160" y="552">PORTES DE LA JUSTICE</text></g>' : "";
    var secondCrossingArt = state.progress >= arcIndex("sabaody") ? '' : "";
    var geographyArt = hasChartedTheGrandLine
      ? '<path d="M0 0h845v820H0z" fill="#144d74" fill-opacity=".62"/><path d="M2438 0h1802v820H2438z" fill="#103f66" fill-opacity=".72"/><path d="M866 215H4240M866 606H4240" stroke="#9bc7d9" stroke-opacity=".24" stroke-width="2" stroke-dasharray="5 11"/><path class="worldmap-calm-band" d="M866 278 C1100 255 1260 290 1490 276 S1920 256 2250 278 S3200 298 4240 272"/><path class="worldmap-calm-band" d="M866 570 C1100 596 1260 558 1490 574 S1920 601 2250 571 S3200 548 4240 578"/><path class="worldmap-grand-line" d="M0 426 C370 402 640 447 1000 424 S1670 400 2040 427 S2820 451 3200 425 S3900 399 4240 427"/><path class="worldmap-route" d="M36 426 C370 402 640 447 1000 424 S1670 400 2040 427 S2820 451 3200 425 S3900 399 4200 427"/><path class="worldmap-redline" d="M1870 0 Q1850 130 1880 225 Q1910 300 1870 392 L1870 465 Q1910 555 1880 650 Q1845 740 1872 820 L1950 820 Q1916 725 1950 638 Q1980 544 1940 460 L1940 386 Q1976 292 1944 214 Q1908 128 1940 0Z" transform="translate(458 0)"/><path class="worldmap-redline" d="M842 0 Q820 120 847 205 Q870 300 840 390 L840 463 Q874 558 850 646 Q820 742 844 820 L892 820 Q865 730 892 640 Q922 552 888 462 L888 387 Q916 290 890 205 Q861 118 890 0Z"/><path class="worldmap-mountain-x" d="M830 314 L902 390 L830 466 L902 542 M902 314 L830 390 L902 466 L830 542"/><circle class="worldmap-mountain-summit" cx="866" cy="428" r="19"/>'
      : "";
    var accessibleDescription = hasChartedTheGrandLine ? "Les quatre mers et les Calm Belts entourent la Grand Line. Fais glisser horizontalement la carte et sélectionne une escale déjà découverte." : state.progress >= 0 ? "Carte de l’East Blue et de ses lieux déjà découverts." : "Carte marine en attente de ton repère de lecture.";
    var displayScale = mapScale() * state.mapZoom;
    return '<div class="worldmap-viewport" id="worldMapViewport" style="height:' + Math.round(820 * displayScale) + 'px" aria-label="Carte horizontale, fais glisser pour naviguer" tabindex="0">' +
      '<svg id="worldMapCanvas" class="worldmap-canvas" viewBox="0 0 4240 820" width="' + Math.round(4240 * displayScale) + '" height="' + Math.round(820 * displayScale) + '" role="group" aria-labelledby="worldMapTitle worldMapDescription" xmlns="http://www.w3.org/2000/svg">' +
      '<title id="worldMapTitle">Carte schématique du monde de One Piece</title><desc id="worldMapDescription">' + escapeHtml(accessibleDescription) + '</desc>' +
      '<defs><pattern id="mapWaves" width="70" height="34" patternUnits="userSpaceOnUse"><path d="M2 18c9-8 19-8 28 0s19 8 28 0" fill="none" stroke="#77c3df" stroke-opacity=".2" stroke-width="2"/><path d="M22 31c9-8 19-8 28 0" fill="none" stroke="#77c3df" stroke-opacity=".13" stroke-width="1.5"/></pattern><pattern id="mapPaper" width="31" height="31" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r="1" fill="#c7e5ef" fill-opacity=".2"/><circle cx="21" cy="17" r=".8" fill="#c7e5ef" fill-opacity=".14"/></pattern></defs>' +
      '<rect width="4240" height="820" rx="18" fill="#0c3f68"/><rect width="4240" height="820" rx="18" fill="url(#mapWaves)"/><rect width="4240" height="820" rx="18" fill="url(#mapPaper)"/>' +
      geographyArt + secondCrossingArt + taraiTriangle + '<g class="worldmap-static-label">' + staticLabels + '</g>' +
      '<g class="worldmap-compass" transform="translate(4115 126)"><circle r="48"/><path d="M0-37 8-7 0 0-8-7Z M0 37-8 7 0 0 8 7Z"/><text x="0" y="-58">N</text></g>' +
      '<g class="worldmap-islands" aria-label="Lieux visibles à ta progression">' + list.map(pointMarkup).join("") + '</g></svg></div>';
  }

  function renderMap() {
    var html = heading("CARTOGRAPHIE VIVANTE", "Le monde de One Piece", "Parcours les mers, retrouve les escales déjà découvertes et ouvre leur fiche. La carte s’adapte à ton arc de lecture.", "⌖");
    if (state.mapLoading) return html + '<div class="empty-state"><strong>Chargement de la carte…</strong>Préparation des repères maritimes.</div>';
    if (!Array.isArray(locations) || !DATA || !Array.isArray(DATA.arcs)) return html + '<div class="empty-state"><strong>La carte n’a pas pu être chargée</strong>Les repères sont indisponibles pour le moment.<br><br><button class="button-primary" data-map-retry>Réessayer <span>↻</span></button></div>';
    var discovered = visibleLocations();
    var seas = availableSeas(discovered);
    var types = availableTypes(discovered);
    if (seas.indexOf(state.mapSea) === -1) state.mapSea = "Toutes les mers";
    if (types.indexOf(state.mapType) === -1) state.mapType = "Tous les types";
    var visible = filteredLocations();
    html += '<div class="worldmap-toolbar"><label class="filter-search worldmap-search"><span>⌕</span><input type="search" data-map-search value="' + escapeHtml(state.mapQuery) + '" placeholder="Chercher un lieu découvert…" autocomplete="off" aria-label="Rechercher parmi les lieux découverts"></label>' +
      '<label class="worldmap-select"><span>Mer</span><select data-map-sea aria-label="Filtrer par mer">' + selectOptions(seas, state.mapSea) + '</select></label>' +
      '<label class="worldmap-select"><span>Type</span><select data-map-type aria-label="Filtrer par type de lieu">' + selectOptions(types, state.mapType) + '</select></label>' +
      '<div class="worldmap-zoom" aria-label="Commandes de zoom"><button type="button" data-map-zoom="out" aria-label="Dézoomer">−</button><button type="button" data-map-zoom="reset" aria-label="Réinitialiser le zoom">' + Math.round(state.mapZoom * 100) + '%</button><button type="button" data-map-zoom="in" aria-label="Zoomer">+</button></div></div>';
    html += '<div class="worldmap-legend" aria-label="Légende"><span><i class="legend-island"></i>Lieu découvert</span>' + (geographyRevealed() ? '<span><i class="legend-route"></i>Grand Line</span><span><i class="legend-mountain"></i>Red Line</span>' : '') + '<span class="worldmap-count">' + visible.length + ' lieu' + (visible.length > 1 ? 'x' : '') + ' affiché' + (visible.length > 1 ? 's' : '') + ' sur ' + discovered.length + ' découvert' + (discovered.length > 1 ? 's' : '') + '</span></div>';
    if (!discovered.length) {
      html += '<div class="empty-state worldmap-empty"><strong>La carte attend ton premier repère</strong>Les lieux s’affichent au rythme de ta progression.<br><br><button class="button-primary" data-action="open-progress">Choisir mon arc <span>→</span></button></div>' + worldSvg([]);
    } else {
      html += worldSvg(visible);
      if (!visible.length) html += '<div class="empty-state worldmap-empty"><strong>Aucun lieu ne correspond à ces filtres</strong>Essaie une autre recherche ou réinitialise les filtres.</div>';
      if (state.mapQuery.trim() && visible.length) {
        html += '<div class="worldmap-results"><h2>Résultats découverts</h2><div class="worldmap-result-list">' + visible.map(function (location) {
          return '<a class="worldmap-result" href="#lieu/' + encodeURIComponent(location.id) + '" data-map-location="' + escapeHtml(location.id) + '"><span class="worldmap-result-icon">✦</span><span><strong>' + escapeHtml(location.name) + '</strong><small>' + escapeHtml(location.type) + ' · ' + escapeHtml(location.sea) + '</small></span><b>→</b></a>';
        }).join("") + '</div></div>';
      }
    }
    return html;
  }

  function renderLocationDetail(key) {
    // Resolve from the already-filtered collection so a copied or guessed hash cannot reveal a locked name.
    var location = visibleLocations().find(function (item) { return item.id === key; });
    if (!location) return '<div class="location-locked"><p class="eyebrow">FICHE DE LIEU</p><div class="page-title-row"><div><h1>Ce lieu n’est pas disponible</h1><p>Cette fiche n’est pas accessible à ton repère de lecture.</p></div><span class="page-ornament" aria-hidden="true">' + pageIcon("map") + '</span></div><div class="empty-state"><strong>Continue à ton rythme</strong>Seuls les lieux déjà découverts peuvent être ouverts.<br><br><button class="button-primary" data-action="open-progress">Mon arc de lecture <span>→</span></button> <button class="button-secondary location-back" data-page="map">Retour à la carte</button></div></div>';
    var requiredIndex = arcIndex(location.arc);
    var requiredArc = DATA.arcs[requiredIndex];
    var nearby = visibleLocations().filter(function (item) { return item.id !== location.id && item.sea === location.sea; }).slice(0, 5);
    var headingHtml = heading("REPÈRE DE VOYAGE", location.name, "Fiche cartographique d’un lieu découvert à ton arc.", "⌖");
    var profile = profileFor(location);
    var representatives = visibleRepresentatives(location);
    var artwork = locationArtworkMarkup(location);
    var html = headingHtml + '<button class="detail-back" data-page="map">← Retour à la carte</button><section class="detail-hero worldmap-detail-hero">' + artwork + '<div class="detail-hero-copy"><span class="eyebrow">' + escapeHtml(location.type) + ' · ' + escapeHtml(location.sea) + '</span><h1>' + escapeHtml(location.name) + '</h1><p>' + escapeHtml(profile.description) + '</p><div class="detail-badges"><span>Mer : ' + escapeHtml(location.sea) + '</span><span>Type : ' + escapeHtml(location.type) + '</span><span>Découvert : ' + escapeHtml(requiredArc ? requiredArc.name : "Progression inconnue") + '</span></div></div></section><section class="worldmap-profile-grid"><article class="worldmap-profile-card"><span class="eyebrow">STATUT DU LIEU</span><h2>Autorité et affiliation pirate</h2><p>' + escapeHtml(profile.control) + '</p></article><article class="worldmap-profile-card"><span class="eyebrow">REPÈRE MARITIME</span><h2>' + escapeHtml(location.sea) + '</h2><p>' + escapeHtml(location.note) + '</p></article></section>';
    if (representatives.length) {
      html += '<section class="profile-story"><div class="section-heading detail-section-heading"><div><span class="eyebrow">FIGURES ASSOCIÉES</span><h2>Représentants du lieu</h2><p>Les personnages connus jusqu’à ' + escapeHtml(DATA.arcs[state.progress] ? DATA.arcs[state.progress].name : "ton repère") + '.</p></div></div><div class="detail-member-grid">' + representatives.map(function (person) {
        var displayName = safeCharacterName(person.name);
        var character = unlockedCharacterFor(person);
        var portrait = representativePortrait(person, displayName, character);
        var card = '<span class="detail-member-copy"><strong>' + escapeHtml(displayName) + '</strong><span>' + escapeHtml(person.role) + '</span></span>' + '<span class="detail-member-arrow" aria-hidden="true">↗</span>';
        return character
          ? '<button class="detail-member-card" data-open-character="' + escapeHtml(identityKey(character.name)) + '" data-return-location="' + escapeHtml(location.id) + '">' + portrait + card + '</button>'
          : '<article class="detail-member-card detail-member-card-static">' + portrait + '<span class="detail-member-copy"><strong>' + escapeHtml(displayName) + '</strong><span>' + escapeHtml(person.role) + '</span></span></article>';
      }).join("") + '</div></section>';
    }
    if (nearby.length) html += '<section class="worldmap-nearby"><div class="section-heading"><div><span class="eyebrow">MÊME MER</span><h2>Autres lieux découverts</h2><p>Les fiches proposées sont déjà visibles à ton repère de lecture.</p></div></div><div class="worldmap-result-list">' + nearby.map(function (item) {
      return '<a class="worldmap-result" href="#lieu/' + encodeURIComponent(item.id) + '" data-map-location="' + escapeHtml(item.id) + '"><span class="worldmap-result-icon">✦</span><span><strong>' + escapeHtml(item.name) + '</strong><small>' + escapeHtml(item.type) + '</small></span><b>→</b></a>';
    }).join("") + '</div></section>';
    requestLocationArtwork(location);
    return html;
  }

  function updateMapZoom() {
    var canvas = document.getElementById("worldMapCanvas");
    if (!canvas) return;
    var displayScale = mapScale() * state.mapZoom;
    canvas.setAttribute("width", String(Math.round(4240 * displayScale)));
    canvas.setAttribute("height", String(Math.round(820 * displayScale)));
    var viewport = document.getElementById("worldMapViewport");
    if (viewport) viewport.style.height = Math.round(820 * displayScale) + "px";
    var zoomValue = document.querySelector('[data-map-zoom="reset"]');
    if (zoomValue) zoomValue.textContent = Math.round(state.mapZoom * 100) + "%";
  }

  window.addEventListener("resize", updateMapZoom);

  var activeDrag = null;
  document.addEventListener("pointerdown", function (event) {
    var viewport = event.target.closest && event.target.closest(".worldmap-viewport");
    if (!viewport || event.pointerType !== "mouse" || event.button !== 0 || (event.target.closest && event.target.closest("[data-map-location]"))) return;
    activeDrag = { id:event.pointerId, viewport:viewport, startX:event.clientX, startScroll:viewport.scrollLeft };
    viewport.classList.add("is-dragging");
    if (viewport.setPointerCapture) viewport.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  document.addEventListener("pointermove", function (event) {
    if (!activeDrag || activeDrag.id !== event.pointerId) return;
    activeDrag.viewport.scrollLeft = activeDrag.startScroll - (event.clientX - activeDrag.startX);
  });
  function finishDrag(event) {
    if (!activeDrag || activeDrag.id !== event.pointerId) return;
    activeDrag.viewport.classList.remove("is-dragging");
    activeDrag = null;
  }
  document.addEventListener("pointerup", finishDrag);
  document.addEventListener("pointercancel", finishDrag);
  document.addEventListener("scroll", function (event) {
    if (event.target && event.target.id === "worldMapViewport") state.mapScrollLeft = event.target.scrollLeft;
  }, true);
  document.addEventListener("wheel", function (event) {
    var viewport = event.target.closest && event.target.closest(".worldmap-viewport");
    if (!viewport) return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      state.mapZoom = Math.max(.72, Math.min(1.35, state.mapZoom * (event.deltaY < 0 ? 1.1 : .9)));
      updateMapZoom();
      return;
    }
    var delta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta) {
      event.preventDefault();
      viewport.scrollLeft += delta;
    }
  }, {passive:false});

  return { renderMap:renderMap, renderLocationDetail:renderLocationDetail, updateMapZoom:updateMapZoom };
};
