
### WebXR Volume Viewer

vtk.js supports volume rendering in virtual and augmented reality environments for WebXR compatible systems.

This example loads and renders a .VTI volume file found [here](https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download). Press the "Enter VR" or "Enter AR" button to launch an XR rendering on a WebXR-compatible system. To specify other .vti files, provide the `?fileURL=<link>` URL parameter.

Volume rendering can be processor-intensive. Smaller volumes may give better performance on mobile devices such as phones or standalone XR headsets.

You can specify remote VTI links to visualize with WebXR Volume Viewer as extra arguments to the URL such as in the links below.
- [Kitware_CTA_Head_and_Neck.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180) 5.025 MB
- [binary-head.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?fileURL=https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download&rotateX=-90) 15.6 MB
- [binary-head-2.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?fileURL=https://data.kitware.com/api/v1/file/629921a64acac99f429a45a7/download&rotateX=-90) 361 kB
- [tiny-image.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?fileURL=https://data.kitware.com/api/v1/file/624320e74acac99f42254a25/download) 1.6 kB

WebXR Volume Viewer by default attempts to select the appropriate XR session type based on detected device capabilities. The examples below demonstrate how to target a specific XR session type with the `xrSessionType=` URL parameter.

### Virtual Reality

For head-mounted devices such as Meta Quest 2, HP Reverb G2, or Microsoft HoloLens 2.
- [Kitware_CTA_Head_and_Neck.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=0&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180) 5.025 MB
- [3DUS-fetus.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=0&fileURL=https://data.kitware.com/api/v1/file/63fe43217b0dfcc98f66a85a/download&rotateX=180&rotateZ=-90) 30.22 MB
- [binary-head.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=0&fileURL=https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download&rotateX=-90) 15.6 MB

### Handheld Augmented Reality

For handheld devices such as Android devices or iPhones (see [iPhone requirements](../docs/develop_webxr.html#How-do-I-run-vtk-js-examples-on-my-iPhone)).

- [Kitware_CTA_Head_and_Neck.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=1&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180) 5.025 MB
- [3DUS-fetus.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=1&fileURL=https://data.kitware.com/api/v1/file/63fe43217b0dfcc98f66a85a/download&rotateX=180&rotateZ=-90) 30.22 MB
- [binary-head.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=1&fileURL=https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download&rotateX=-90) 15.6 MB

### Augmented Reality Passthrough Headset

For head-mounted devices (HMDs) with augmented reality passthrough support such as Meta Quest 2.

- [Kitware_CTA_Head_and_Neck.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=3&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180) 5.025 MB
- [3DUS-fetus.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=3&fileURL=https://data.kitware.com/api/v1/file/63fe43217b0dfcc98f66a85a/download&rotateX=180&rotateZ=-90) 30.22 MB
- [binary-head.vti](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=3&fileURL=https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download&rotateX=-90) 15.6 MB


### Holographic

For Looking Glass Factory holographic displays.

- [Kitware_CTA_Head_and_Neck.vti (holographic)](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180) 5.025 MB
- [3DUS-fetus.vti (holographic)](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/file/63fe43217b0dfcc98f66a85a/download&rotateX=180&rotateZ=-90) 30.22 MB
- [binary-head.vti (holographic)](https://kitware.github.io/vtk-js/examples/WebXRVolume/WebXRVolume.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download&rotateX=-90) 15.6 MB

### See Also

[Full list of WebXR Examples](https://kitware.github.io/vtk-js/docs/develop_webxr.html)
[VolumeViewer Example](https://kitware.github.io/vtk-js/examples/VolumeViewer.html)
