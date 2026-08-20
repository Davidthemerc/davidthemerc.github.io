# SuperService v1.1 — Modular GitHub Pages Build

This folder is ready to deploy directly to GitHub Pages.

## Structure

```text
SuperService_v1.1_Modular/
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
└── README.md
```

## Deploy to GitHub Pages

Upload the **contents of this folder** to the root of the branch/folder your GitHub Pages site publishes.

For the common setup:

1. Put `index.html` in the repository root.
2. Put the `assets` folder beside `index.html`.
3. Commit and push.
4. In GitHub, open **Settings → Pages**.
5. Select **Deploy from a branch**.
6. Choose the branch containing these files, usually `main`.
7. Choose `/ (root)` and save.

The relative paths are already configured:

- `assets/css/styles.css`
- `assets/js/app.js`

No server, build step, package manager, framework, or external dependency is required.

## Save Data

SuperService remains fully client-side and continues to use the browser's localStorage under the existing `superservice-save` key. Moving from the single-file version to this modular version does not intentionally change the save schema.

## Development

- Edit interface/layout styling in `assets/css/styles.css`.
- Edit gameplay/application logic in `assets/js/app.js`.
- Edit the page shell in `index.html`.

The single-file v1.1 release remains available separately for users who prefer one-file deployment.
