## [VTK.js - The Visualization Toolkit for JavaScript](http://kitware.github.io/vtk-js/)

[![Build Status](https://travis-ci.org/Kitware/vtk-js.svg)](https://travis-ci.org/Kitware/vtk-js)
[![Dependency Status](https://david-dm.org/kitware/vtk-js.svg)](https://david-dm.org/kitware/vtk-js)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![npm-download](https://img.shields.io/npm/dm/vtk.js.svg)
![npm-version-requirement](https://img.shields.io/badge/npm->=5.0.0-brightgreen.svg)
![node-version-requirement](https://img.shields.io/badge/node->=8.0.0-brightgreen.svg)

Introduction
============

VTK is an open-source software system for image processing, 3D
graphics, volume rendering and visualization. VTK includes many
advanced algorithms (e.g., surface reconstruction, implicit modelling,
decimation) and rendering techniques (e.g., hardware-accelerated
volume rendering, LOD control). The JavaScript implementation remain
a subset of the actual C++ library but efforts will be made to easily
port or compile native VTK code into WebAssembly to better blend
both world.

The origin of VTK is with the textbook "The Visualization Toolkit, an
Object-Oriented Approach to 3D Graphics" originally published by
Prentice Hall and now published by Kitware, Inc. (Third Edition ISBN
1-930934-07-6). VTK has grown (since its initial release in 1994) to a
world-wide user base in the commercial, academic, and research
communities.

vtk.js aims to be a subset of VTK and provide 3D rendering using WebGL
for both geometry and volume rendering.

Reporting Bugs
==============

If you have found a bug:

1. If you have a patch, please read the [CONTRIBUTING.md][] document.

2. Otherwise, please join the one of the [VTK Mailing Lists][] and ask
   about the expected and observed behaviors to determine if it is
   really a bug.

3. Finally, if the issue is not resolved by the above steps, open
   an entry in the [VTK Issue Tracker][].

[CONTRIBUTING.md]: CONTRIBUTING.md
[VTK Mailing Lists]: https://www.vtk.org/mailing-lists/
[VTK Issue Tracker]: https://github.com/Kitware/vtk-js/issues

Requirements
============

In general VTK tries to be as portable as possible; the specific configurations below are known to work and tested.

vtk.js supports the following development environments:

- Node 8+
- NPM 6+

and we use [@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env) with the [defaults](https://github.com/Kitware/vtk-js/blob/master/.browserslistrc) set of [browsers target](https://browserl.ist/?q=defaults).
But when built from source this could be adjusted to support any browser as long they provide WebGL.

Documentation
=============

See the [documentation](https://kitware.github.io/vtk-js) for a
getting started guide, advanced documentation, and API descriptions.

Contributing
============

See [CONTRIBUTING.md](CONTRIBUTING.md) for instructions to contribute.

License
=======

VTK is distributed under the OSI-approved BSD 3-clause License.
See [Copyright.txt][] for details.

[Copyright.txt]: Copyright.txt
