---
title: Creating a test in VTK.js
---

# Creating a test in VTK.js

VTK.js tests use [Vitest](https://vitest.dev/) in browser mode through Playwright. Test files are picked up from `Sources/**/test*.js`.

Class tests usually live in a `test` directory next to the class. Shared repository tests live in `Sources/Testing/test*.js`.

## Writing tests

Use Vitest APIs directly:

```js
import { it, expect } from "vitest";

it("validates defaults", () => {
  const instance = vtkMyClass.newInstance();
  expect(instance.getProp1()).toBe("prop1 default value");
});
```

For rendering tests:

- Use `it.skipIf(__VTK_TEST_NO_WEBGL__)` for WebGL-specific tests.
- Use `it.skipIf(!__VTK_TEST_WEBGPU__)` for WebGPU-specific tests.
- Use `testUtils.createGarbageCollector()` to clean up VTK objects and DOM nodes.
- Use `testUtils.compareImages(image, [baseline], testName, tolerance)` for baseline image checks.

## Running tests

```sh
$ npm test
$ npm run test:watch
$ npm run test:firefox
$ npm run test:webgpu
$ npx vitest run Sources/Common/Core/DataArray/test/testDataArray.js
```

The default local browser is Chromium. `test:firefox` selects Firefox, and `test:webgpu` enables the WebGPU test path.

For a local headless run:

```sh
$ npx vitest run --browser.headless
```

For the Vitest UI:

```sh
$ npx vitest --ui
```

## Baseline images

Image comparison tests use checked-in PNG baselines next to the test file. To update a baseline, run the test locally, save the image produced by `captureNextImage()`, replace the baseline PNG, and re-run the test.
