title: Overview
---


[![Build Status](https://github.com/Kitware/vtk-js/workflows/Build%20and%20Test/badge.svg)](https://github.com/Kitware/vtk-js/workflows/Build%20and%20Test/badge.svg) [![Build Status](https://travis-ci.org/Kitware/vtk-js.svg)](https://travis-ci.org/Kitware/vtk-js) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) ![npm-download](https://img.shields.io/npm/dm/vtk.js.svg) [![DOI](https://zenodo.org/badge/57900965.svg)](https://zenodo.org/badge/latestdoi/57900965)

The Visualization Toolkit (VTK) is an open-source, freely available software system for 3D computer graphics, image processing, and visualization. Its implementation consists of an ES6 JavaScript class library which can be integrated into any web application. The toolkit leverages WebGL (+WebGPU soon) and supports a wide variety of visualization algorithms including scalar, vector, tensor, texture, and volumetric methods. VTK is part of Kitware’s collection of commercially supported open-source platforms for software development.

Welcome to the vtk.js documentation. If you encounter any problems when using vtk.js, have a look at the  [troubleshooting guide](misc_troubleshooting.html), raise an issue on [GitHub](https://github.com/kitware/vtk-js/issues) or start a topic on the [Mailing list](http://www.vtk.org/mailman/listinfo/vtk).

## What is vtk.js?

vtk.js is a rendering library made for Scientific Visualization on the Web. It adapts the VTK structure and expertise to bring high performance rendering into your browser.

You can learn more about what vtk.js can do for you via the [examples](../examples/).

## What is the difference with VTK/C++?

VTK.js is a complete rewrite of VTK/C++ using plain JavaScript (ES6).
The focus of the rewrite, so far, has been the rendering pipeline for ImageData and PolyData, the pipeline infrastructure, and frequently used readers (obj, stl, vtp, vti). Some filters are also provided as demonstrations. We are not aiming for vtk.js to provide the same set of filters that is available in VTK/C++, but vtk.js does provide the infrastructure needed to define pipelines and filters.

We have also started to explore a path where you can compile some bits of VTK/C++ into WebAssembly and to enable them to interact with vtk.js. With such interaction, you can pick and choose what you need to extract from VTK and enable it inside your web application. VTK/C++ WebAssembly can even be used for rendering, and examples can be found in [VTK repository](https://github.com/Kitware/VTK/tree/master/Examples/Emscripten/Cxx). Additionally [itk.js](https://insightsoftwareconsortium.github.io/itk-js/index.html) (which is ITK via WebAssembly) also provides proven implementations for several image filters and data readers.  There are, however, some additional costs in terms of the size of the WebAssembly file that will have to be downloaded when visiting a VTK or ITK WebAssembly webpage; and we still have some work to do to streamline the vtk.js + VTK WebAssembly integrations.

In general if you want to stay in the pure JavaScript land, then vtk.js is perhaps the ideal solution for you. We welcome your feedback, including your contributions for new visualization filters, bug fixes, and examples.

On top of the rendering capabilities of vtk.js, the library provides helper classes to connect to a remote VTK/ParaView server to enable remote-rendering and/or synchronized C++/RenderWindow content with a local vtk.js RenderWindow by pushing the geometry from the server to the client and only involve rendering on the client side.

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
