---
title: Building VTK.js
---

# Building VTK.js

VTK.js builds with Vite. Library builds write ES modules to `dist/esm` and UMD output to `dist/umd`.

## Library builds

```sh
$ npm install
$ npm run build
$ npm run build:esm
$ npm run build:umd
$ npm run dev:esm
$ npm run dev:umd
$ npm run build:release
```

`npm run build` builds both package formats. `dev:esm` and `dev:umd` watch for changes. `build:release` runs linting before the build.

## Documentation builds

VTK.js documentation uses VitePress.

```sh
$ npm run docs:dev
$ npm run docs:generate
$ npm run docs:build-examples
$ npm run docs:build
$ npm run docs:serve
```

`docs:dev` starts the local documentation server. `docs:generate` regenerates API pages, example pages, the sidebar, and the gallery.
