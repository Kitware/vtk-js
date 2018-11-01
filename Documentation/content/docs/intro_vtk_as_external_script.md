title: Importing vtk.js as an external script
---

This guide illustrates how to build an application using vtk.js as a pre-built script file. This is not the recommended way of building vtk.js applications but enables quick prototyping and easy access without any tools or infrastructure needed.

Below you can find an [html](https://raw.githubusercontent.com/Kitware/vtk-js/master/Documentation/content/docs/vtk-js-demo.html) file example that leverages vtk.js and builds a visualization with it. You can see its ES6 example counter part [here](https://kitware.github.io/vtk-js/examples/ConeSource.html).

```html vtk-js-demo.html
<!DOCTYPE html>
<html>
<body>
<script type="text/javascript" src="https://unpkg.com/@babel/polyfill@7.0.0/dist/polyfill.js"></script>
<script type="text/javascript" src="https://unpkg.com/vtk.js"></script>
<script type="text/javascript">
  // --------------------------------------------------------------------------
  // Example code
  // --------------------------------------------------------------------------
  var fullScreenRenderer = vtk.Rendering.Misc.vtkFullScreenRenderWindow.newInstance();
  var actor              = vtk.Rendering.Core.vtkActor.newInstance();
  var mapper             = vtk.Rendering.Core.vtkMapper.newInstance();
  var cone               = vtk.Filters.Sources.vtkConeSource.newInstance();

  actor.setMapper(mapper);
  mapper.setInputConnection(cone.getOutputPort());

  var renderer = fullScreenRenderer.getRenderer();
  renderer.addActor(actor);
  renderer.resetCamera();

  var renderWindow = fullScreenRenderer.getRenderWindow();
  renderWindow.render();
</script>
</body>
</html>
```
