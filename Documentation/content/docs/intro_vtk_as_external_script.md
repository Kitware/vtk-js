title: Importing vtk.js as an external script
---

This guide illustrates how to build an application using vtk.js as a pre-built script file. This is not the recommended way of building vtk.js applications but enables quick prototyping and easy access without any tools or infrastructure needed.

Below you can find an [html](https://raw.githubusercontent.com/Kitware/vtk-js/master/Documentation/content/docs/vtk-js-demo.html) file example that leverages vtk.js and builds a visualization with it. You can see its ES6 example counter part [here](https://kitware.github.io/vtk-js/examples/ConeSource.html).

```html vtk-js-demo.html
<!DOCTYPE html>
<html>
<body>
<script type="text/javascript" src="https://unpkg.com/vtk.js"></script>
<script type="text/javascript">
  var vtkFullScreenRenderWindow = vtk.Rendering.Misc.vtkFullScreenRenderWindow;
  var vtkConeSource             = vtk.Filters.Sources.vtkConeSource;
  var vtkMapper                 = vtk.Rendering.Core.vtkMapper;
  var vtkActor                  = vtk.Rendering.Core.vtkActor;
  
  // --------------------------------------------------------------------------
  // Standard rendering code setup
  // --------------------------------------------------------------------------
  var fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
  var renderer = fullScreenRenderer.getRenderer();
  var renderWindow = fullScreenRenderer.getRenderWindow();

  // --------------------------------------------------------------------------
  // Example code
  // --------------------------------------------------------------------------
  var cone = vtkConeSource.newInstance();
  var actor = vtkActor.newInstance();
  var mapper = vtkMapper.newInstance();

  actor.setMapper(mapper);
  mapper.setInputConnection(cone.getOutputPort());
  renderer.addActor(actor);

  renderer.resetCamera();
  renderWindow.render();
</script>
</body>
</html>
```

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-90338862-1', 'auto');
  ga('send', 'pageview');

</script>
