title: WebGPU Examples
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

WebGPU is the upcoming high performance rendering API coming soon to browsers across all major platforms. vtk.js has preliminary support for WebGPU and you can explore some of its features in the examples below. Note that both WebGPU and our support for it are still under development so these example may break as the API changes. Most of these examples have been tested with Chrome Canary on Windows and MacOS.

<div class="gallery">

[![PDBReader Example][PDBReader]](../examples/PDBReader.html)
[![ElevationReader Example][ElevationReader]](../examples/ElevationReader.html)
[![VolumeContour Example][VolumeContour]](../examples/VolumeContour.html)
[![PiecewiseGaussianWidget Example][PiecewiseGaussianWidget]](../examples/PiecewiseGaussianWidget.html)
[![HttpSceneLoader Example][HttpSceneLoader]](../examples/HttpSceneLoader.html)
[![CubeAxes Example][CubeAxes]](../examples/CubeAxes.html)
[![OBJReader Example][OBJReader]](../examples/OBJReader.html)


</div>

[ElevationReader]: ../docs/gallery/ElevationReader.jpg
[PDBReader]: ../docs/gallery/PDBReader.jpg
[PiecewiseGaussianWidget]: ../docs/gallery/PiecewiseGaussianWidget.jpg
[VolumeContour]: ../docs/gallery/VolumeContour.jpg
[CubeAxes]: ../docs/gallery/CubeAxes.jpg
[OBJReader]: ../docs/gallery/OBJReader.jpg
[HttpSceneLoader]: ../docs/gallery/HttpSceneLoader.jpg
