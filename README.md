# Grand Line — Wiki One Piece

Wiki francophone à thème sombre, filtré selon le dernier arc vu ou lu. Le choix de progression reste enregistré dans le navigateur; les réponses du catalogue sont limitées à cet arc.

## Architecture

- `app/page.tsx` sert la coque HTML dans le rendu du site.
- `public/app.js` gère la navigation, l’état de progression et les événements de l’interface.
- `public/modules/` contient le dépôt client et les vues séparées par fonctionnalité : accueil, carte du monde, guide, équipages, bateaux, personnages, fruits, lames et institutions.
- `app/api/` contient les routes du catalogue local et de synchronisation.
- `db/schema.ts` définit les tables D1; les migrations SQL générées sont conservées sous `drizzle/` avec leurs snapshots Drizzle.
- `content/` conserve les arcs, les profils progressifs de personnages, les accomplissements d’équipages, les notices de bateaux et les chronologies de fruits.
- `public/` contient les ressources livrées au navigateur.

## Base et synchronisation

Cloudflare D1 (SQLite) conserve personnages, affiliations, membres, bateaux, Fruits du Démon, épisodes, chapitres, arcs et état de synchronisation. Le chargement normal ne contacte aucune encyclopédie externe : le site lit le catalogue D1 local. Le bouton « Mettre à jour » lance une synchronisation paginée, puis les prochaines visites lisent la base déjà remplie. Le guide détaillé ne se charge qu’à son ouverture, et l’index des personnages utilise une pagination. Les imports n’effacent pas les données existantes si une source échoue.

Les fiches sans première apparition fiable restent dans la base mais ne sont pas renvoyées à la page. Les descriptions, accomplissements et primes sont filtrés par chapitre avant d’arriver au navigateur. Les fiches d’équipages, de bateaux et de personnages ont une page dédiée; les bateaux d’équipage sont également liés depuis la fiche de leur équipage. Les visuels proviennent de l’API communautaire ou du wiki Fandom; une illustration vectorielle s’affiche lorsqu’aucune image de référence n’est disponible.

La carte du monde utilise la progression locale pour masquer les lieux non découverts dans le dessin, la recherche, les filtres, les fiches et les routes directes `#lieu/...`. Son schéma SVG est illustratif et ne prétend pas placer les îles à l’échelle.

## Sources

- [Documentation One Piece API](https://www.onepieceapi.com/documentation) — personnages, affiliations, images, catalogue de fruits et navires.
- [API One Piece](https://documentation.api-onepiece.com/) — correspondances épisodes, chapitres et tomes.
- [Catégorie des Fruits du Démon de One Piece Wiki](https://onepiece.fandom.com/wiki/Category:Devil_Fruits) — vérification éditoriale des noms canons et des entrées non nommées.
- [Repères manga des Fruits du Démon](https://www.reddit.com/r/OnePiece/comments/1gkr07k/devil_fruit_list/) — chronologie communautaire utilisée comme point de départ, puis complétée pour les entrées récentes.

Les API et wikis sont des sources communautaires et peuvent comporter des erreurs. Les correspondances anime/manga restent indicatives. Le projet est indépendant d’Eiichiro Oda, Shueisha et Toei Animation.

## Développement

Le projet utilise le starter Vinext fourni pour les Sites. Après installation des dépendances, lancer `npm run db:generate` après une modification de schéma, puis `npm run build`. Le manifeste `.openai/hosting.json` conserve l’identité du Site et déclare la liaison D1 `DB`.
