
### WebXR Volume Viewer

vtk.js supports volume rendering in virtual and augmented reality environments for WebXR compatible systems.

This example loads and renders a .vti volume file found [here](https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download). Press the "Enter VR" or "Enter AR" button to launch an XR rendering on a WebXR-compatible system. To specify other .vti files, provide the `?fileURL=<link>` URL parameter.

Volume rendering can be processor-intensive. Smaller volumes may give better performance on mobile devices.

- [binary-head.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?fileURL=https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download) 15.6 MB
- [binary-head-2.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?fileURL=https://data.kitware.com/api/v1/file/629921a64acac99f429a45a7/download) 361 kB
- [Kitware_CTA_Head_and_Neck.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-Cardiac2&resliceVolume=true) 5.025 MB
- [tiny-image.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?fileURL=https://data.kitware.com/api/v1/file/624320e74acac99f42254a25/download) 1.6 kB

### Looking Glass Holographic Support

Holographic scenes can be rendered to a Looking Glass display by specifying `xrSessionType=2` in the example URL.

- [binary-head.vti (holographic)](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download) 15.6 MB
- [3DUS-fetus.vti (holographic)](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/file/63fe43217b0dfcc98f66a85a/download) 30.22 MB
- [Kitware_CTA_Head_and_Neck.vti (holographic)](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-Cardiac2&resliceVolume=false) 5.025 MB

### Augmented Reality Head-Mounted Displays

Augmented reality scenes can be rendered to a dedicated head-mounted display by specifying `xrSessionType=3` in the example URL.

- [binary-head.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=3&fileURL=https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download) 15.6 MB
- [Kitware_CTA_Head_and_Neck.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=3&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-Cardiac2&resliceVolume=true) 5.025 MB
- [3DUS-fetus.vti (holographic)](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=3&fileURL=https://data.kitware.com/api/v1/file/63fe43217b0dfcc98f66a85a/download) 30.22 MB

### See Also

[Full list of WebXR Examples](https://kitware.github.io/vtk-js/docs/develop_webxr.html)
[VolumeViewer Example](https://kitware.github.io/vtk-js/examples/VolumeViewer.html)
