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
[![XR Volume Example][WebXRVolume]](../examples/WebXRVolume.html)

</div>

### Augmented Reality Examples

<div class="gallery">

[![AR Cone Example][ArCone]](../examples/AR.html)
[![GeometryViewer Example][GeometryViewer]](../examples/GeometryViewer.html?fileURL=https://data.kitware.com/api/v1/item/59de9de58d777f31ac641dc5/download)
[![GeometryViewer Brain Blood Vessels][GeometryViewerBrainBloodVessels]](../examples/GeometryViewer/GeometryViewer.html?fileURL=[https://data.kitware.com/api/v1/file/61f041f14acac99f42c2ff9a/download,https://data.kitware.com/api/v1/file/61f042024acac99f42c2ffa6/download,https://data.kitware.com/api/v1/file/61f042b74acac99f42c30079/download])
[![GeometryViewer Chest CT][GeometryViewerchestCT]](../examples/GeometryViewer/GeometryViewer.html?fileURL=[https://data.kitware.com/api/v1/file/61f044354acac99f42c30276/download,https://data.kitware.com/api/v1/file/61f0440f4acac99f42c30191/download,https://data.kitware.com/api/v1/file/61f044204acac99f42c30267/download])
[![XR Volume Example][WebXRVolume]](../examples/WebXRVolume.html)

</div>

### For Developers

Developers without access to XR hardware may find it convenient to install and use the [Mozilla WebXR emulator](https://github.com/MozillaReality/WebXR-emulator-extension) in their browser.

- Install the WebXR extension on either Chrome or Firefox.
- Close and reopen the browser.
- Press F12 to access the browser console.
- Select the "WebXR" tab to selected XR emulated hardware and view controls.

While WebXR has broad industry support, it is not yet implemented in all browsers. Developers may include the [WebXR polyfill](https://github.com/immersive-web/webxr-polyfill) in their projects for backwards compatibility with the deprecated WebVR API.


[ArCone]: ../docs/gallery/ArCone.jpg
[GeometryViewer]: ../docs/gallery/GeometryViewer.jpg
[GeometryViewerBrainBloodVessels]: ../docs/gallery/GeometryViewerBrainBloodVessels.jpg
[GeometryViewerChestCT]: ../docs/gallery/GeometryViewerChestCT.jpg
[SkyboxViewerVR]: ../docs/gallery/SkyboxViewerVR.jpg
[VrCone]: ../docs/gallery/VrCone.jpg
