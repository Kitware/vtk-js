---
title: Rendering Profiles
---

# Rendering Profiles

VTK.js rendering profiles are side-effect imports that register rendering implementations for classes used by the scene graph. They keep applications smaller by letting you import only the rendering backends and mapper support you need.

## Why profiles exist

Many VTK.js classes are pure pipeline or data-model classes. They only become renderable after a matching rendering profile registers the view-node overrides required by the active backend such as OpenGL or WebGPU.

Without the relevant profile import, VTK.js can still construct the data objects, actors, mappers, and pipeline, but rendering may fail when the scene graph asks `ViewNodeFactory` to create a backend-specific implementation for one of those classes.

## Typical usage

Import a profile near your application entry point before creating the render window content:

```js
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
```

If you need broader coverage, import the combined profile:

```js
import '@kitware/vtk.js/Rendering/Profiles/All';
```

## Common profiles

- `Geometry`: core polygonal rendering support.
- `Volume`: image and volume rendering support.
- `Glyph`: glyph-specific mapper support.
- `Molecule`: sphere and stick mapper support.
- `LIC`: line integral convolution rendering support.
- `All`: imports all supported profiles.

## When a profile is missing

A missing profile often shows up as an error from `Rendering/SceneGraph/ViewNodeFactory` saying that no implementation was found for a class and that a rendering profile is likely missing.

That warning means one of these is true:

- A built-in renderable class is being used without importing the profile that registers its rendering implementation.
- A custom renderable class has not been registered with the view-node factory.

If you are unsure which profile is required, importing `Rendering/Profiles/All` is the easiest way to confirm that the issue is profile-related. After that, you can narrow it back down to the smallest profile set your application needs.
