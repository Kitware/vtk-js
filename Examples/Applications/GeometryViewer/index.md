## Geometry Viewer

The Geometry Viewer is a standalone single page web application that can be user to visualizer and explore VTP files. The only requirement is the single [HTML] file without any web server. This application can be use to load vtp file and use geometry rendering to render them.
The current vtp supported format is __ascii__, __binary__ and __binary+zlib__ compression.

Some sample files can be found [here](https://data.kitware.com/#collection/586fef9f8d777f05f44a5c86/folder/59de9dd58d777f31ac641dc3)

Also using extra argument to the URL allow to view remote VTP like the links below:
- [diskout.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59de9de58d777f31ac641dc5/download) 471.9 kB
- [diskout-stream-ascii.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59e12daa8d777f31ac645568/download) 1.13 MB
- [diskout-stream-binary.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59e12d848d777f31ac645553/download) 844.4 kB
- [diskout-stream-binary-zlib.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59e12d948d777f31ac64555c/download) 501.3 kB
- [Earth.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59ee68d98d777f31ac64784b/download) 1.17 MB
- [Brain Blood Vessels](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download]) 57.71 MB
- [Chest CT](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download]) 63.75 MB

Virtual reality, augmented reality, and holographic viewing is supported for WebXR devices using the `xrSessionType` URL parameter. The following links provide holographic examples for a Looking Glass display:
- [diskout.vtp (holographic)](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/item/59de9de58d777f31ac641dc5/download) 471.9 kB
- [Brain Blood Vessels (holographic)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=2&fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download]) 57.71 MB
- [Chest CT (holographic)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=2&fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download]) 63.75 MB

The following links provide augmented reality examples for head-mounted displays:
- [Earth.vtp (AR headset)](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=3fileURL=https://data.kitware.com/api/v1/item/59ee68d98d777f31ac64784b/download) 1.17 MB
- [Brain Blood Vessels (AR headset)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=3&fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download]) 57.71 MB
- [Chest CT (AR headset)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=3&fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download]) 63.75 MB

[HTML]: https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html
