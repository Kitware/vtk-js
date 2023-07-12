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

vtk.js supports virtual and augmented reality rendering via the [WebXR device API](https://www.w3.org/TR/webxr/) for most standalone and PC-based mixed reality (XR) devices.

## General Examples

The examples below are suitable for any [supported XR device](#Supported-Devices). Use the `xrSessionType` URL parameter
to select the desired VR, AR, or holographic session type.

<div class="gallery">

[![GeometryViewer Brain Blood Vessels][GeometryViewerBrainBloodVessels]](../examples/GeometryViewer.html)
[![GeometryViewer Chest CT][GeometryViewerChestCT]](../examples/GeometryViewer/GeometryViewer.html?fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download])
[![XR Volume Example][WebXRVolume]](../examples/WebXRVolume.html)
[![XR Volume Example][WebXRVolumeHeadAndNeck]](../examples/WebXRVolume/WebXRVolume.html?fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180)

</div>

## Cinematic Examples

The following examples demonstrate cinematic rendering in mixed reality with vtk.js. We recommend running these examples on an XR device connected to a PC with a dedicated GPU.

<div class="gallery">

[![XR Volumetric Example][HeadFullVolume]](../examples/WebXRHeadFullVolumeCVR.html)
[![XR Hybrid Example][ChestCTHybrid]](../examples/WebXRChestCTBlendedCVR.html)

</div>

## Dedicated examples

WebXR rendering with vtk.js can be tailored for a specific XR target platform. The following examples are intended to run on a subset of supported XR devices.

### Virtual Reality Examples (`immersive-vr`)

The following examples target a head-mounted virtual reality device, such as the Meta Quest 2 or HP Reverb G2 headset. The Microsoft HoloLens 2 augmented reality device may also run the examples below.

<div class="gallery">

[![VR Cone Example][VrCone]](../examples/VR.html)
[![SkyboxViewer Example][SkyboxViewerVR]](../examples/SkyboxViewer.html?fileURL=https://data.kitware.com/api/v1/file/5ae8a89c8d777f0685796bae/download)
[![GeometryViewer Brain Blood Vessels][GeometryViewerBrainBloodVessels]](../examples/GeometryViewer/GeometryViewer.html?xrSessionType=0&fileURL=[https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=0&fileURL=%5Bhttps://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download%5D])
[![XR Volume Example][WebXRVolumeHeadAndNeck]](../examples/WebXRVolume/WebXRVolume.html?xrSessionType=0&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180)

</div>

### Handheld Augmented Reality Examples (`immersive-ar`)

The following examples target a handheld or head-mounted mobile augmented reality device, such as most Samsung Galaxy phones, the Meta Quest 2 headset in AR passthrough mode, or the upcoming Apple Vision Pro. Apple iPhone devices may run augmented reality examples in the Mozilla Reality application.

<div class="gallery">

[![AR Cone Example][ArCone]](../examples/AR.html)
[![GeometryViewer Brain Blood Vessels][GeometryViewerBrainBloodVessels]](../examples/GeometryViewer/GeometryViewer.html?xrSessionType=1&fileURL=[https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=0&fileURL=%5Bhttps://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download%5D])
[![XR Volume Example][WebXRVolumeHeadAndNeck]](../examples/WebXRVolume/WebXRVolume.html?xrSessionType=1&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180)

</div>

### Head-mounted Augmented Reality Examples (`immersive-ar`)

The following examples target a head-mounted mobile augmented reality device, such as the Meta Quest 2 headset in AR passthrough mode or the upcoming Apple Vision Pro headset.

Microsoft HoloLens 2 users should run the [virtual reality examples](#Virtual-Reality-Examples-immersive-vr) above.

<div class="gallery">

[![AR Cone Example][ArCone]](../examples/AR/index.html?xrSessionType=3)
[![GeometryViewer Brain Blood Vessels][GeometryViewerBrainBloodVessels]](../examples/GeometryViewer/GeometryViewer.html?xrSessionType=3&fileURL=[https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=0&fileURL=%5Bhttps://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download%5D])
[![XR Volume Example][WebXRVolumeHeadAndNeck]](../examples/WebXRVolume/WebXRVolume.html?xrSessionType=3&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180)

</div>

### Holographic Examples

The following examples target holographic displays from Looking Glass Factory. More information on requirements for holographic rendering with vtk.js may be found [here](https://kitware.github.io/vtk-js/examples/LookingGlass.html).

<div class="gallery">

[![Looking Glass Cone Example][LookingGlassCone]](../examples/LookingGlass.html)
[![GeometryViewer Brain Blood Vessels][GeometryViewerBrainBloodVessels]](../examples/GeometryViewer/GeometryViewer.html?xrSessionType=2&fileURL=[https://kitware.github.io/vtk-js/examples/GeometryViewer/GeometryViewer.html?xrSessionType=0&fileURL=%5Bhttps://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download%5D])
[![XR Volume Example][WebXRVolumeHeadAndNeck]](../examples/WebXRVolume/WebXRVolume.html?xrSessionType=2&fileURL=https://data.kitware.com/api/v1/file/63fe3f237b0dfcc98f66a857/download&colorPreset=CT-AAA&rotateX=90&rotateY=180)

</div>

## For Developers

### Supported Devices

VTK.js supports rendering to most devices that support the WebXR API. Rendering with VTK.js has been tested on the following devices:

- Meta Quest 2 (VR, AR)
- HP Reverb G2 (VR)
- Samsung Galaxy mobile device (AR)
- Apple iPhone devices, with Mozille Reality browser app (AR)
- Microsoft HoloLens 2 (AR, but considered as a VR device by the WebXR API)
- Looking Glass Factory displays (holographic)

### Building and Running Examples

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

### Emulating XR Hardware

Developers without access to XR hardware may find it convenient to install and use the [Mozilla WebXR emulator](https://github.com/MozillaReality/WebXR-emulator-extension) in their browser.

- Install the WebXR extension on either Chrome or Firefox.
- Close and reopen the browser.
- Press F12 to access the browser console.
- Select the "WebXR" tab to selected XR emulated hardware and view controls.

While WebXR has broad industry support, it is not yet implemented in all browsers. Developers may include the [WebXR polyfill](https://github.com/immersive-web/webxr-polyfill) in their projects for backwards compatibility with the deprecated WebVR API.

### Selecting the XR Session Type

A WebXR device may be compatible with more than one type of session. For instance, the Meta Quest 2 headset supports fully immersive virtual reality sessions as well as augmented reality sessions with passthrough.

Several vtk.js XR-capable examples support more than one type of XR session. For these examples, the desired session type may be requested by adding the parameter `&xrSessionType=<value>` to the end of the example URL. Session type values are defined in the [OpenGL RenderWindow](https://github.com/Kitware/vtk-js/blob/master/Sources/Rendering/OpenGL/RenderWindow/Constants.js).

## Frequently Asked Questions

### How do I run vtk.js examples on a standalone headset?

1. Verify that your web browser supports the WebXR API. Consult resources such as [CanIUse.com](https://caniuse.com/webxr) to find this information.
1. Navigate to one of the vtk.js examples listed above in your standalone headset.
1. Click the "Enter XR" button that appears overlaid on the scene. You may be prompted to give the website permission to launch XR experiences.
1. The immersive XR experience should launch.

If you encounter difficulty running examples after attempting the steps above, please enter an issue in the [VTK.js GitHub repository](https://github.com/Kitware/vtk-js/issues).

### How do I run vtk.js examples on my iPhone?

As of 2023 the Safari for iOS browser does not support WebXR experiences. The Mozilla Reality browser application does support WebXR on iOS. Follow these steps to run vtk.js WebXR examples on your iPhone:

1. Download Mozilla Reality from the App Store
2. Open Mozilla Reality
3. Navigate to any vtk.js handheld augmented reality example
4. Launch the augmented reality scene

### Does vtk.js support rendering with WebGPU for WebXR experiences?

vtk.js currently relies on WebGL to support WebXR rendering. See [GitHub discussion](https://github.com/gpuweb/gpuweb/issues/2778) for more information on WebGPU support for WebXR. More details on vtk.js support for WebGPU can be found [here](../develop_webgpu.html).

### Where can I find more information about planned VTK.js WebXR development?

The roadmap for VTK.js WebXR feature development and support is maintained in the [VTK.js GitHub issue tracker](https://github.com/Kitware/vtk-js/issues/2571).


[ArCone]: ../docs/gallery/ArCone.jpg
[GeometryViewer]: ../docs/gallery/GeometryViewer.jpg
[GeometryViewerBrainBloodVessels]: ../docs/gallery/GeometryViewerBrainBloodVessels.jpg
[GeometryViewerChestCT]: ../docs/gallery/GeometryViewerChestCT.jpg
[SkyboxViewerVR]: ../docs/gallery/SkyboxViewerVR.jpg
[VrCone]: ../docs/gallery/VrCone.jpg
[WebXRVolume]: ../docs/gallery/WebXRVolume.png
[WebXRVolumeHeadAndNeck]: ../docs/gallery/WebXRVolumeHeadAndNeck.png
[HeadFullVolume]: ../docs/gallery/HeadFullVolume.png
[ChestCTHybrid]: ../docs/gallery/ChestCTHybrid.png
[HeadGradient]: ../docs/gallery/HeadGradient.png
[LookingGlassCone]: ../docs/gallery/LookingGlassCone.png
