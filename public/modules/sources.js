window.GRANDLINE_PAGE_FACTORIES = window.GRANDLINE_PAGE_FACTORIES || {};
window.GRANDLINE_PAGE_FACTORIES.sources = function (context) {
  var { heading } = context;
  function renderSources() {
    var html = heading("TRANSPARENCE", "Sources & fonctionnement", "Les faits sont présentés comme des repères de navigation, avec leurs limites et leurs sources clairement indiquées.", "✦");
    html += '<section class="sources-card"><h3>Sources de données</h3><ul>';
    html += '<li><a href="https://www.onepieceapi.com/documentation" target="_blank" rel="noreferrer">One Piece API</a> : personnages, navires, premières apparitions, affiliations, noms et images des fruits. Source communautaire paginée.</li>';
    html += '<li><a href="https://documentation.api-onepiece.com/" target="_blank" rel="noreferrer">API One Piece</a> : épisodes, chapitres et correspondances avec les tomes.</li>';
    html += '<li><a href="https://onepiece.fandom.com/wiki/Category:Devil_Fruits" target="_blank" rel="noreferrer">Wiki One Piece — Fruits du Démon</a> : vérification des fruits nommés et des entrées identifiées de façon incertaine.</li>';
    html += '<li><a href="https://onepiece.fandom.com/wiki/Category:Weapon_Images" target="_blank" rel="noreferrer">Wiki One Piece — images d’armes</a> : visuels réels des lames, avec lien vers la fiche de chaque arme.</li>';
    html += '<li><a href="https://one-piece.com/story/index.html" target="_blank" rel="noreferrer">ONE PIECE.com</a> : repères éditoriaux du récit et des personnages.</li>';
    html += '</ul><h3>Actualisation et base</h3><p>Le catalogue est conservé dans Cloudflare D1 (SQLite). Une visite normale lit cette base locale au site; elle ne lance pas de téléchargement massif depuis des API. Le bouton « Mettre à jour » importe les pages disponibles et note la date de synchronisation. Les anciennes fiches restent en place si une source est indisponible.</p>';
    html += '<h3>Repère anti-spoiler</h3><p>Ton arc reste enregistré sur cet appareil. Les personnages, groupes, membres, bateaux, fruits et guides sont filtrés jusqu’à ce repère. Une relation de membre ou un événement peut se dévoiler plus tard que le nom de son équipage ou de son navire. Les données sans première apparition fiable ne sont pas renvoyées à l’index.</p>';
    html += '<h3>Fruits nommés, oubliés ou incertains</h3><p>Le catalogue se synchronise depuis une source paginée et inclut des fruits mineurs comme le Kuku Kuku no Mi. Les pouvoirs non nommés ou seulement supposés sont séparés et étiquetés comme incertains. Un fruit dont l’arc d’apparition ne peut pas être établi reste enregistré mais son nom est masqué pour éviter un spoiler.</p>';
    html += '<h3>Images et limites</h3><p>Les images de référence des bateaux s’affichent quand la source en fournit. Sinon, la fiche utilise une illustration vectorielle originale. Les portraits et images de fruits apparaissent eux aussi lorsqu’ils sont disponibles; les images des lames renvoient à leur source. Les moments importants des navires sont datés pour éviter de révéler la suite de l’histoire. Les API communautaires peuvent contenir des erreurs et les correspondances anime/manga sont indicatives.</p></section>';
    return html;
  }
  return { renderSources };
};
