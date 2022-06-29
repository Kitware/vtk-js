## [VTK.js - The Visualization Toolkit for JavaScript](http://kitware.github.io/vtk-js/)

[![Build Status](https://github.com/Kitware/vtk-js/workflows/Build%20and%20Test/badge.svg)](https://github.com/Kitware/vtk-js/workflows/Build%20and%20Test/badge.svg)
[![Build Status](https://travis-ci.org/Kitware/vtk-js.svg)](https://travis-ci.org/Kitware/vtk-js)
[![Dependency Status](https://david-dm.org/kitware/vtk-js.svg)](https://david-dm.org/kitware/vtk-js)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![npm-download](https://img.shields.io/npm/dm/vtk.js.svg)
![npm-version-requirement](https://img.shields.io/badge/npm->=5.0.0-brightgreen.svg)
![node-version-requirement](https://img.shields.io/badge/node->=8.0.0-brightgreen.svg)
[![DOI](https://zenodo.org/badge/57900965.svg)](https://zenodo.org/badge/latestdoi/57900965)

### Introduction

VTK is an open-source software system for image processing, 3D
graphics, volume rendering and visualization. VTK includes many
advanced algorithms (e.g., surface reconstruction, implicit modelling,
decimation) and rendering techniques (e.g., hardware-accelerated
volume rendering, LOD control). The JavaScript implementation remains
a subset of the actual C++ library but efforts will be made to easily
port or compile native VTK code into WebAssembly to better blend
both worlds. vtk.js is a true rewrite of VTK in plain JavaScript (ES6).
Therefore not everything has been rewritten.

The origin of VTK is with the textbook "The Visualization Toolkit, an
Object-Oriented Approach to 3D Graphics" originally published by
Prentice Hall and now published by Kitware, Inc. (Third Edition ISBN
1-930934-07-6). VTK has grown (since its initial release in 1994) to a
world-wide user base in the commercial, academic, and research
communities.

vtk.js aims to be a subset of VTK and provide 3D rendering using WebGL (+WebGPU) for both geometry and volume rendering.

### What is the difference with VTK/C++?

VTK.js is a complete rewrite of VTK/C++ using plain JavaScript (ES6).
The focus of the rewrite, so far, has been the rendering pipeline for ImageData and PolyData, the pipeline infrastructure, and frequently used readers (obj, stl, vtp, vti). Some filters are also provided as demonstrations. We are not aiming for vtk.js to provide the same set of filters that is available in VTK/C++, but vtk.js does provide the infrastructure needed to define pipelines and filters.

We have also started to explore a path where you can compile some bits of VTK/C++ into WebAssembly and to enable them to interact with vtk.js. With such interaction, you can pick and choose what you need to extract from VTK and enable it inside your web application. VTK/C++ WebAssembly can even be used for rendering, and examples can be found in [VTK repository](https://github.com/Kitware/VTK/tree/master/Examples/Emscripten/Cxx). Additionally [itk.js](https://insightsoftwareconsortium.github.io/itk-js/index.html) (which is ITK via WebAssembly) also provides proven implementations for several image filters and data readers.  There are, however, some additional costs in terms of the size of the WebAssembly file that will have to be downloaded when visiting a VTK or ITK WebAssembly webpage; and we still have some work to do to streamline the vtk.js + VTK WebAssembly integrations.

In general if you want to stay in the pure JavaScript land, then vtk.js is perhaps the ideal solution for you. We welcome your feedback, including your contributions for new visualization filters, bug fixes, and examples.

On top of the rendering capabilities of vtk.js, the library provides helper classes to connect to a remote VTK/ParaView server to enable remote-rendering and/or synchronized C++/RenderWindow content with a local vtk.js RenderWindow by pushing the geometry from the server to the client and only involve rendering on the client side.

## Using vtk.js
### Requirements

In general VTK tries to be as portable as possible; the specific configurations below are known to work and tested.

vtk.js supports the following development environments:

- Node 14+
- NPM 7+

and we use [@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env) with the [defaults](https://github.com/Kitware/vtk-js/blob/master/.browserslistrc) set of [browsers target](https://browserl.ist/?q=defaults).
But when built from source this could be adjusted to support any browser as long they provide WebGL.

### Documentation

- [High-level documentation](https://kitware.github.io/vtk-js/docs/)
- [API descriptions](https://kitware.github.io/vtk-js/api/)
- [Examples](https://kitware.github.io/vtk-js/examples/)

### Feature requests and Bug reports

Submit an issue to report bugs or missing features in vtk.js.
### Help and Support

* [VTK/Web discourse forum](https://discourse.vtk.org/c/web/9) is here to help you find existing questions or ask your own.
* [Kitware](https://www.kitware.com/) offers advanced software R&D solutions and services. Find out how we can help with your next project.

### License

VTK is distributed under the OSI-approved BSD 3-clause License.
See [Copyright.txt][] for details.

[Copyright.txt]: Copyright.txt

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for instructions on how to contribute.

