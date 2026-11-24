# Arcade Hub — GitHub + Cloudflare Pages

A static browser arcade built around the supplied game collection, with an original animated particle background, searchable cards, categories, favorites, recently played games, and an in-page player.

## Deploy to Cloudflare Pages

1. Create a new **public or private GitHub repository**.
2. Extract this ZIP on your computer.
3. Upload the contents of this folder to the repository root (the `index.html` file must be at the top level, not inside another nested folder).
4. Commit the files to the `main` branch.
5. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**.
6. Select your GitHub repository.
7. Use these build settings:
   - Framework preset: **None**
   - Production branch: **main**
   - Build command: leave blank
   - Build output directory: `.`
8. Click **Save and Deploy**.

Cloudflare Pages will rebuild the site when you push future changes to GitHub.

## Included features

- Animated particle-and-glow background
- Home page with featured and recently played games
- Search across the game catalog
- Category filters
- Favorites saved in the browser
- Full-screen game player with reload and fullscreen controls
- Responsive desktop and mobile layout
- Local thumbnail artwork for every catalog card, plus web-sourced covers where available

## Game files and thumbnails

The catalog contains the HTML game files from the supplied archive that are suitable to include here. A small number of files were left out because their content falls into categories I can't help make accessible.

The archive also included a legacy Flash file. It is listed as a legacy item, but modern browsers no longer support Flash playback.

Most games use their original supplied HTML file. Some games depend on third-party CDNs or external services; if one does not load, its original dependency may no longer be available or may block embedding.

A few recognizable titles use web-sourced thumbnail URLs. The rest have original local SVG cover art generated for this project, so every card still has an image even when a reliable public cover could not be found. Third-party thumbnail URLs may change or have their own usage terms.

## Important notes

- Only publish game files and images that you have permission to host and redistribute.
- This is a static website. Favorites and recently played lists are stored in each visitor's own browser.
- Adding or removing games from the live catalog is done by changing `games.json` and uploading the corresponding game file and thumbnail to GitHub.
- The large Geometry Dash Lite HTML file has been split into smaller JavaScript chunks so each deployed asset stays under Cloudflare Pages' per-file upload limit. Keep all `geometrydashlite-part-*.js` files alongside `geometrydashlite.html`.
- If you rename a game file, update its matching `file` value in `games.json`.

## Main files

- `index.html` — page structure
- `styles.css` — layout, colors, cards, and responsive styling
- `app.js` — search, categories, favorites, player, and animated background
- `games.json` — game titles, file paths, categories, and thumbnails
- `assets/thumbs/` — generated fallback cover art


## Websites tab
The Websites tab contains 10 user-provided destinations. Each card uses a bundled local SVG thumbnail and navigates in the current tab (`target="_self"`). The ChatGPT destination contains the exact signed URL provided and may expire.

## Website card icons

The Websites page now loads each service’s real website favicon through Google’s favicon endpoint. Local SVG tiles remain as automatic fallbacks if a favicon cannot be loaded. The icons are fetched when the site is viewed, so the deployed site needs an internet connection for the live favicons.
