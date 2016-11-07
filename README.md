## [VTK-JS - The Visualization Toolkit for JavaScript](http://kitware.github.io/vtk-js/)

[![Build Status](https://travis-ci.org/Kitware/vtk-js.svg)](https://travis-ci.org/Kitware/vtk.js)
[![Dependency Status](https://david-dm.org/kitware/vtk-js.svg)](https://david-dm.org/kitware/vtk-js)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![npm-download](https://img.shields.io/npm/dm/vtk.js.svg)
![npm-version-requirement](https://img.shields.io/badge/npm->=3.0.0-brightgreen.svg)
![node-version-requirement](https://img.shields.io/badge/node->=5.0.0-brightgreen.svg)

Introduction
============

VTK is an open-source software system for image processing, 3D
graphics, volume rendering and visualization. VTK includes many
advanced algorithms (e.g., surface reconstruction, implicit modelling,
decimation) and rendering techniques (e.g., hardware-accelerated
volume rendering, LOD control).

VTK is used by academicians for teaching and research; by government
research institutions such as Los Alamos National Lab in the US or
CINECA in Italy; and by many commercial firms who use VTK to build or
extend products.

The origin of VTK is with the textbook "The Visualization Toolkit, an
Object-Oriented Approach to 3D Graphics" originally published by
Prentice Hall and now published by Kitware, Inc. (Third Edition ISBN
1-930934-07-6). VTK has grown (since its initial release in 1994) to a
world-wide user base in the commercial, academic, and research
communities.

VTK-JS aims to be a subset of VTK and provide 3D rendering using WebGL.

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
[VTK Mailing Lists]: http://www.vtk.org/mailing-lists/
[VTK Issue Tracker]: https://github.com/Kitware/vtk-js/issues

Requirements
============

In general VTK tries to be as portable as possible; the specific configurations below are known to work and tested.

VTK-JS supports the following development environments:

1. Node 5+
2. NPM 3+

VTK supports the following browsers:

1. Firefox 45+
2. Chrome 50+
3. Safari 9.1+

Documentation
=============

See the [documentation](https://kitware.github.io/vtk-js) for a
getting started guide, advanced documentation, and API descriptions.

Contributing
============

See [CONTRIBUTING.md][] for instructions to contribute.

[CONTRIBUTING.md]: CONTRIBUTING.md

License
=======

VTK is distributed under the OSI-approved BSD 3-clause License.
See [Copyright.txt][] for details.

[Copyright.txt]: Copyright.txt
