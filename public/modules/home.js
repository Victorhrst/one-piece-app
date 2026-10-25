window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.home = function (context) {
  var { progressArc, escapeHtml } = context;

  function renderHome() {
    var arc = progressArc();
    var heroTitle = arc
      ? 'Le monde que tu connais.<br><em>Le prochain cap reste caché.</em>'
      : 'La grande aventure<br><em>commence ici.</em>';
    var heroDescription = arc
      ? "Ton repère est réglé sur " + arc.name + ". Explore le monde et les personnages connus jusqu’à cet arc."
      : "Choisis ton dernier arc terminé pour découvrir le monde à ton rythme, sans révéler la suite.";
    // Pour changer le fond, remplace public/images/home-background.jpg en gardant ce nom.
    var backgroundImage = "/images/home-background.jpg";

    var html = '<section class="home-immersive" aria-label="Accueil Grand Line">';
    html += '<img class="home-scene-image" src="' + backgroundImage + '" alt="" fetchpriority="high">';
    html += '<div class="home-scene-shade" aria-hidden="true"></div>';
    html += '<main class="home-copy">';
    html += '<p class="home-eyebrow"><span aria-hidden="true"></span> LE WIKI QUI GARDE LE CAP</p>';
    html += '<h1>' + heroTitle + '</h1>';
    html += '<p class="home-description">' + escapeHtml(heroDescription) + '</p>';
    html += '<button type="button" class="home-current-arc" data-action="open-progress" aria-label="Choisir ou modifier mon arc"><span class="home-current-symbol" aria-hidden="true">⌖</span><span class="home-current-copy"><span>TON REPÈRE</span><strong>' + escapeHtml(arc ? arc.name : "Pas encore défini") + '</strong></span><span class="home-current-action">' + (arc ? "Modifier" : "Choisir mon arc") + ' <span aria-hidden="true">→</span></span></button>';
    html += '<div class="home-primary-actions"><button class="home-explore-button" data-page="map"><span class="home-button-icon" aria-hidden="true">⌖</span><span>Explorer la carte</span><span class="home-button-arrow" aria-hidden="true">↗</span></button><button class="home-guide-button" data-page="guide"><span class="home-button-icon" aria-hidden="true">▤</span><span>Épisodes & chapitres</span><span class="home-button-arrow" aria-hidden="true">↗</span></button></div>';
    html += '</main>';
    html += '<footer class="home-footer"><nav class="home-shortcuts" aria-label="Accès rapide"><button data-page="favorites"><span aria-hidden="true">☆</span><span>Mes favoris</span></button><button data-page="crews"><span aria-hidden="true">⚑</span><span>Équipages</span></button><button data-page="characters"><span aria-hidden="true">◎</span><span>Personnages</span></button><button data-page="ships"><span aria-hidden="true">⛵</span><span>Bateaux</span></button><button data-page="fruits"><span aria-hidden="true">◉</span><span>Fruits du Démon</span></button></nav><p class="home-disclaimer">Projet de fan indépendant · les images restent la propriété de leurs ayants droit.</p></footer>';
    html += '</section>';
    return html;
  }

  return { renderHome };
};
