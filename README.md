# Grand Line — Wiki One Piece

Wiki francophone à thème sombre, filtré selon le dernier arc vu ou lu. Le choix de progression reste enregistré dans le navigateur; les réponses du catalogue sont limitées à cet arc.

## Architecture

- `app/page.tsx` sert la coque HTML dans le rendu du site.
- `public/app.js` gère la navigation, l’état de progression et les événements de l’interface.
- `public/modules/` contient le dépôt client et les vues séparées par fonctionnalité : accueil, guide, équipages, personnages, fruits, lames et institutions.
- `app/api/` contient les routes du catalogue local et de synchronisation.
- `db/schema.ts` définit les tables D1; les migrations SQL générées sont conservées sous `drizzle/` avec leurs snapshots Drizzle.
- `content/` conserve les arcs et les fiches éditoriales servant de référence au filtre anti-spoiler.
- `public/` contient les ressources livrées au navigateur.

## Base et synchronisation

Cloudflare D1 (SQLite) conserve personnages, affiliations, membres, Fruits du Démon, épisodes, chapitres, arcs et état de synchronisation. Le chargement normal ne contacte aucune encyclopédie externe : le site lit le catalogue D1 local. Le bouton « Mettre à jour » lance une synchronisation paginée, puis les prochaines visites lisent la base déjà remplie. Le guide détaillé ne se charge qu’à son ouverture, et l’index des personnages utilise une pagination. Les imports n’effacent pas les données existantes si une source échoue.

Les fiches sans première apparition fiable restent dans la base mais ne sont pas renvoyées à la page; les noms futurs ne sont donc pas révélés par l’index. Les fruits portant une attribution incertaine sont explicitement marqués comme hypothèses. Les visuels proviennent de l’API communautaire lorsqu’elle en fournit; sinon le site dessine une illustration vectorielle de fruit à peau spiralée.

## Sources

- [Documentation One Piece API](https://www.onepieceapi.com/documentation) — personnages, affiliations, images et catalogue de fruits.
- [API One Piece](https://documentation.api-onepiece.com/) — correspondances épisodes, chapitres et tomes.
- [Catégorie des Fruits du Démon de One Piece Wiki](https://onepiece.fandom.com/wiki/Category:Devil_Fruits) — vérification éditoriale des noms canons et des entrées non nommées.

Les API et wikis sont des sources communautaires et peuvent comporter des erreurs. Les correspondances anime/manga restent indicatives. Le projet est indépendant d’Eiichiro Oda, Shueisha et Toei Animation.

## Développement

Le projet utilise le starter Vinext fourni pour les Sites. Après installation des dépendances, lancer `npm run db:generate` après une modification de schéma, puis `npm run build`. Le manifeste `.openai/hosting.json` conserve l’identité du Site et déclare la liaison D1 `DB`.
