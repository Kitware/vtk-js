# Geometry Viewer

The Geometry Viewer is a standalone single page web application to visualize and explore VTP files. The only requirement is the single [HTML] file without any web server. This application can be use to load vtp files and use geometry rendering to render them.
The current vtp supported format is __ascii__, __binary__ and __binary+zlib__ compression.

Several sample .VTP files can be found [here](https://data.kitware.com/#collection/586fef9f8d777f05f44a5c86/folder/59de9dd58d777f31ac641dc3).

You can specify remote VTP links to visualize with Geometry Viewer as extra arguments to the URL such as in the links below:
- [diskout.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59de9de58d777f31ac641dc5/download) 471.9 kB
- [diskout-stream-ascii.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59e12daa8d777f31ac645568/download) 1.13 MB
- [diskout-stream-binary.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59e12d848d777f31ac645553/download) 844.4 kB
- [diskout-stream-binary-zlib.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59e12d948d777f31ac64555c/download) 501.3 kB
- [Earth.vtp](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59ee68d98d777f31ac64784b/download) 1.17 MB
- [Brain Blood Vessels](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download]) 57.71 MB
- [Chest CT](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download]) 63.75 MB

## WebXR Examples

Virtual reality, augmented reality, and holographic viewing is supported for WebXR devices using the `xrSessionType` URL parameter.

### Virtual Reality

For head-mounted devices such as Meta Quest 2, HP Reverb G2, or Microsoft HoloLens 2.

- [Earth.vtp (VR headset)](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=0&fileURL=https://data.kitware.com/api/v1/item/59ee68d98d777f31ac64784b/download) 1.17 MB
- [Brain Blood Vessels (VR headset)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=0&fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download]) 57.71 MB
- [Chest CT (VR headset)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=0&fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download]) 63.75 MB

### Handheld Augmented Reality

For handheld devices such as Android devices or iPhones (see [iPhone requirements](../docs/develop_webxr.html)).

- [diskout.vtp (handheld AR)](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=1&fileURL=https://data.kitware.com/api/v1/item/59de9de58d777f31ac641dc5/download) 471.9 kB
- [Brain Blood Vessels (handheld AR)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=1&fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download]) 57.71 MB
- [Chest CT (handheld AR)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=1&fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download]) 63.75 MB

### Augmented Reality Passthrough Headset

For head-mounted devices (HMDs) with augmented reality passthrough support such as Meta Quest 2.

- [Earth.vtp (AR headset)](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=3&fileURL=https://data.kitware.com/api/v1/item/59ee68d98d777f31ac64784b/download) 1.17 MB
- [Brain Blood Vessels (AR headset)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=3&fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download]) 57.71 MB
- [Chest CT (AR headset)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=3&fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download]) 63.75 MB

### Holographic

For Looking Glass Factory holographic displays.

- [diskout.vtp (holographic)](https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/item/59de9de58d777f31ac641dc5/download) 471.9 kB
- [Brain Blood Vessels (holographic)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=2&fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download]) 57.71 MB
- [Chest CT (holographic)](https://kitware.github.io/vtk-js/examples/GeometryViewer/index.html?xrSessionType=2&fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download]) 63.75 MB

[HTML]: https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html
