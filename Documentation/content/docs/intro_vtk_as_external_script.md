title: Importing vtk.js as an external script
---

This guide illustrates how to build a vtk.js application by leveraging import maps. While this approach may require a modern browser that supports import maps, it offers a cleaner setup and gives you fine-grained control over which modules are imported.

Below you can find an [HTML](https://raw.githubusercontent.com/Kitware/vtk-js/master/Documentation/content/docs/vtk-js-demo.html) file example that demonstrates how to use vtk.js with import maps to create a visualization.

```html vtk-js-demo.html
<!DOCTYPE html>
<html>
  <body>
    <script type="importmap">
      {
        "imports": {
          "@kitware/vtk.js/": "https://cdn.skypack.dev/@kitware/vtk.js/"
        }
      }
    </script>
    <script type="module">
      import '@kitware/vtk.js/Rendering/Profiles/Geometry';
      import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
      import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
      import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
      import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
      // --------------------------------------------------------------------------
      // Example code
      // --------------------------------------------------------------------------
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
      const actor = vtkActor.newInstance();
      const mapper = vtkMapper.newInstance();
      const cone = vtkConeSource.newInstance();
      actor.setMapper(mapper);
      mapper.setInputConnection(cone.getOutputPort());
      const renderer = fullScreenRenderer.getRenderer();
      renderer.addActor(actor);
      renderer.resetCamera();
      const renderWindow = fullScreenRenderer.getRenderWindow();
      renderWindow.render();
    </script>
  </body>
</html>
```
