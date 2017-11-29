title: Overview
---

The Visualization Toolkit (VTK) is an open-source, freely available software system for 3D computer graphics, image processing, and visualization. Its implementation consists of an ES6 JavaScript class library which can be integrated into any web application. The toolkit leverages WebGL and supports a wide variety of visualization algorithms including scalar, vector, tensor, texture, and volumetric methods. VTK is part of Kitware’s collection of commercially supported open-source platforms for software development.

Welcome to the vtk.js documentation. If you encounter any problems when using vtk.js, have a look at the  [troubleshooting guide](misc_troubleshooting.html), raise an issue on [GitHub](https://github.com/kitware/vtk-js/issues) or start a topic on the [Mailing list](http://www.vtk.org/mailman/listinfo/vtk).

## What is vtk.js?

vtk.js is a rendering library made for Scientific Visualization on the Web. It adapts the VTK structure and expertise to bring high performance rendering into your browser.

You can learn more about what vtk.js can do for you via the [examples](../examples/).

## Examples

<style>
  .gallery img {
    width: 50%;
    display: inline-block;
    padding: 2px;
  }
  .gallery br {
    display: none;
  }
</style>

<div class="gallery">
[![Calculator Example][Calculator]](../examples/Calculator.html)
[![WarpScalar Example][WarpScalar]](../examples/WarpScalar.html)
[![PlaneSource Example][PlaneSource]](../examples/PlaneSource.html)
[![HttpSceneLoader Example][HttpSceneLoader]](../examples/HttpSceneLoader.html)
</div>

## Standalone dataset viewer

<div class="gallery">
![BloodCell][BloodCell]
![Lidar][lidar]
![Earth][earth]
![Reactor][Reactor]
![Molecule][molecule]
![OpenFoam bike][bike]
</div>

[Calculator]: ./gallery/Calculator.jpg
[WarpScalar]: ./gallery/WarpScalar.jpg
[PlaneSource]: ./gallery/PlaneSource.jpg
[HttpSceneLoader]: ./gallery/HttpSceneLoader.jpg
[bike]: ./gallery/bike.jpg
[BloodCell]: ./gallery/BloodCell.jpg
[lidar]: ./gallery/lidar.jpg
[Reactor]: ./gallery/Reactor.jpg
[molecule]: ./gallery/molecule.jpg
[earth]: ./gallery/earth.jpg
