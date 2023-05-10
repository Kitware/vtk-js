title: WebXR Examples
---

<style>
.categories {
    columns: 2 200px;
    column-gap: 1rem;
  }

  .category {
    break-inside: avoid;
    display: inline-block;
    width: 100%;
  }

  .categories br {
    display: none;
  }

  .category ul {
    margin-top: 0;
  }

  .gallery img {
    width: 49%;
    display: inline-block;
    padding: 2px;
  }

  .gallery br {
    display: none;
  }
</style>

vtk.js supports virtual and augmented reality rendering via the [WebXR device API](https://www.w3.org/TR/webxr/) for most standalone and PC headsets.

### Virtual Reality Examples

<div class="gallery">

[![VR Cone Example][VrCone]](../examples/VR.html)
[![SkyboxViewer Example][SkyboxViewerVR]](../examples/SkyboxViewer.html?fileURL=https://data.kitware.com/api/v1/file/5ae8a89c8d777f0685796bae/download)
[![GeometryViewer Brain Blood Vessels][GeometryViewerBrainBloodVessels]](../examples/GeometryViewer/GeometryViewer.html?fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download])
[![GeometryViewer Chest CT][GeometryViewerchestCT]](../examples/GeometryViewer/GeometryViewer.html?fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download])
[![XR Volume Example][WebXRVolume]](../examples/WebXRVolume.html)
[![XR Volumetric Example][HeadFullVolume]](../examples/WebXRHeadFullVolumeCVR.html)
[![XR Hybrid Example][ChestCTHybrid]](../examples/WebXRChestCTBlendedCVR.html)

</div>

### Augmented Reality Examples

<div class="gallery">

[![AR Cone Example][ArCone]](../examples/AR.html)
[![GeometryViewer Example][GeometryViewer]](../examples/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59de9de58d777f31ac641dc5/download)
[![GeometryViewer Brain Blood Vessels][GeometryViewerBrainBloodVessels]](../examples/GeometryViewer/GeometryViewer.html?fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download])
[![GeometryViewer Chest CT][GeometryViewerchestCT]](../examples/GeometryViewer/GeometryViewer.html?fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download])
[![XR Volume Example][WebXRVolume]](../examples/WebXRVolume.html)
[![XR Gradient Example][HeadGradient]](../examples/WebXRHeadGradientCVR.html)

</div>

### Holographic Examples

<div class="gallery">

[![Looking Glass Cone Example][LookingGlassCone]](../examples/LookingGlass.html)
[![GeometryViewer Example][GeometryViewer]](../examples/GeometryViewer.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/item/59de9de58d777f31ac641dc5/download)
[![GeometryViewer Brain Blood Vessels][GeometryViewerBrainBloodVessels]](../examples/GeometryViewer/GeometryViewer.html?xrSessionType=2&fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download])
[![GeometryViewer Chest CT][GeometryViewerchestCT]](../examples/GeometryViewer/GeometryViewer.html?xrSessionType=2&fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download])
[![XR Volume Example][WebXRVolume]](../examples/WebXRVolume.html?xrSessionType=2)
[![XR Gradient Example][HeadGradient]](../examples/WebXRHeadGradientCVR.html?xrSessionType=2)

</div>

### For Developers

#### Building and Running Examples

Webpack can be used to run examples on local XR hardware. The following command will
serve the "AR" example over a self-signed HTTPS connection:

```
path/to/vtk-js> npm run example:https -- AR
...
<i> [webpack-dev-server] Project is running at:
<i> [webpack-dev-server] Loopback: https://localhost:9999/
<i> [webpack-dev-server] On Your Network (IPv4): https://xxx.xxx.xxx.xxx:9999/
```

The example can then be launched on the WebXR device by navigating in a compatible browser to the
address given at `https://xxx.xxx.xxx.xxx:9999` in the output.

#### Emulating XR Hardware

Developers without access to XR hardware may find it convenient to install and use the [Mozilla WebXR emulator](https://github.com/MozillaReality/WebXR-emulator-extension) in their browser.

- Install the WebXR extension on either Chrome or Firefox.
- Close and reopen the browser.
- Press F12 to access the browser console.
- Select the "WebXR" tab to selected XR emulated hardware and view controls.

While WebXR has broad industry support, it is not yet implemented in all browsers. Developers may include the [WebXR polyfill](https://github.com/immersive-web/webxr-polyfill) in their projects for backwards compatibility with the deprecated WebVR API.

#### Selecting the XR Session Type

A WebXR device may be compatible with more than one type of session. For instance, the Meta Quest 2 headset supports fully immersive virtual reality sessions as well as augmented reality sessions with passthrough.

Several vtk.js XR-capable examples support more than one type of XR session. For these examples, the desired session type may be requested by adding the parameter `&xrSessionType=<value>` to the end of the example URL. Session type values are defined in the [OpenGL RenderWindow](https://github.com/Kitware/vtk-js/blob/master/Sources/Rendering/OpenGL/RenderWindow/Constants.js).

### Frequently Asked Questions

#### What mixed reality devices are supported by VTK.js?

VTK.js supports rendering to most devices that support the WebXR API. Rendering with VTK.js has been tested on the following devices:

- Meta Quest 2 (VR, AR)
- HP Reverb G2 (VR)
- Samsung Galaxy mobile device (AR)
- Apple iPhone devices, with Mozille Reality browser app (AR)
- Microsoft HoloLens 2 (AR, but considered as a VR device)
- Looking Glass Factory displays (holographic)

#### Where can I find more information about planned VTK.js WebXR development?

The roadmap for VTK.js WebXR feature development and support is maintained in the [VTK.js GitHub issue tracker](https://github.com/Kitware/vtk-js/issues/2571).


[ArCone]: ../docs/gallery/ArCone.jpg
[GeometryViewer]: ../docs/gallery/GeometryViewer.jpg
[GeometryViewerBrainBloodVessels]: ../docs/gallery/GeometryViewerBrainBloodVessels.jpg
[GeometryViewerChestCT]: ../docs/gallery/GeometryViewerChestCT.jpg
[SkyboxViewerVR]: ../docs/gallery/SkyboxViewerVR.jpg
[VrCone]: ../docs/gallery/VrCone.jpg
[WebXRVolume]: ../docs/gallery/WebXRVolume.png
[HeadFullVolume]: ../docs/gallery/HeadFullVolume.png
[ChestCTHybrid]: ../docs/gallery/ChestCTHybrid.png
[HeadGradient]: ../docs/gallery/HeadGradient.png
[LookingGlassCone]: ../docs/gallery/LookingGlassCone.png
