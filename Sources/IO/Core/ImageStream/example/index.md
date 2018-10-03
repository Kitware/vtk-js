This example aims to provide an example on how to configure a vtk.js RenderWindow to support remote rendering via a ParaView over WebSocket using WSLink while still having local 3D overlay.

In order to run the server, you will need a ParaView (5.6+) binary and run the following command line where the Python file provided as argument is available [here](https://github.com/Kitware/vtk-js/blob/master/Sources/IO/Core/ImageStream/example/pvw-server.py)

```
/.../pvpython ./pvw-server.py --port 1234
```

The important part on the client code is the following section:

```
const imageStream = vtkImageStream.newInstance();
const config = { sessionURL: 'ws://localhost:1234/ws' };
const smartConnect = SmartConnect.newInstance({ config });
smartConnect.onConnectionReady((connection) => {
  // Network
  const session = connection.getSession();

  // Image
  imageStream.connect(session);
  const viewStream = imageStream.createViewStream('-1');
  fullScreenRenderer.getOpenGLRenderWindow().setViewStream(viewStream);

  // Configure image quality
  viewStream.setInteractiveQuality(75);
  viewStream.setInteractiveRatio(0.5);
  viewStream.setCamera(renderer.getActiveCamera());
  viewStream.pushCamera();

  // Bind user input
  renderWindow.getInteractor().onStartAnimation(viewStream.startInteraction);
  renderWindow.getInteractor().onEndAnimation(viewStream.endInteraction);
});

smartConnect.onConnectionError(console.error);
smartConnect.onConnectionClose(console.error);
smartConnect.connect();
```
