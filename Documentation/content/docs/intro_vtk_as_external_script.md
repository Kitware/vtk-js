title: Importing vtk.js as external script
---

This guide illustrate how to build an application using vtk.js as a pre-build script file. This is not the recommended way but that enable quick prototyping and easy access without any tools or infrastructure needed.

Below you can find an html file example that leverage the vtk.js library and build a visualization with it. You can see the similitude to that [exemple](https://kitware.github.io/vtk-js/examples/ConeSource.html).

```html vtk-js-demo.html
<!DOCTYPE html>
<html>
<body>
<script type="text/javascript" src="https://unpkg.com/vtk.js"></script>
<script type="text/javascript">
  var vtkFullScreenRenderWindow  = vtk.Rendering.Misc.vtkFullScreenRenderWindow;
  var vtkConeSource              = vtk.Filters.Sources.vtkConeSource;
  var vtkMapper                  = vtk.Rendering.Core.vtkMapper;
  var vtkActor                   = vtk.Rendering.Core.vtkActor;
  
  // ----------------------------------------------------------------------------
  // Standard rendering code setup
  // ----------------------------------------------------------------------------
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [0, 0, 0] });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();

  // ----------------------------------------------------------------------------
  // Example code
  // ----------------------------------------------------------------------------
  const cone = vtkConeSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  actor.setMapper(mapper);
  mapper.setInputConnection(coneSource.getOutputPort());
  renderer.addActor(actor);
  
  renderer.resetCamera();
  renderWindow.render();
</script>
</body>
</html>

```
