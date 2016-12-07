title: Documentation
---

The Visualization Toolkit (VTK) is an open-source, freely available software system for 3D computer graphics, image processing, and visualization. Its JS implementation consists of a ES6 JavaScript class library which can be integrated into any Web application. VTK supports a wide variety of visualization algorithms including scalar, vector, tensor, texture, and volumetric methods. The toolkit leverage WebGL and WebGL2 for volume rendering. VTK is part of Kitware’s collection of commercially supported open-source platforms for software development.

Welcome to the vtk.js documentation. If you encounter any problems when using vtk.js, have a look at the  [troubleshooting guide](troubleshooting.html), raise an issue on [GitHub](https://github.com/kitware/vtk-js/issues) or start a topic on the [Mailing list](http://www.vtk.org/mailman/listinfo/vtk).

## What is vtk.js?

vtk.js is a rendering library made for Scientific Visualization on the Web. It leverages VTK structure and expertise to bring high performance rendering into your browser.

## Installation

It only takes few minutes to set up vtk.js. If you encounter a problem and can't find the solution here, please [submit a GitHub issue](https://github.com/kitware/vtk-js/issues) and I'll try to solve it.

### Requirements

Installing vtk.js as a dependency inside your Web project is quite easy. However, you do need to have a couple of other things installed first:

- [Node.js](http://nodejs.org/)
- [Git](http://git-scm.com/)

If your computer already has these, congratulations! Just install vtk.js with npm:

``` bash
$ npm install kitware/vtk-js --save
```

If not, please follow the following instructions to install all the requirements.

{% note warn For Mac users %}
You may encounter some problems when compiling. Please install Xcode from App Store first. After Xcode is installed, open Xcode and go to **Preferences -> Download -> Command Line Tools -> Install** to install command line tools.
{% endnote %}

### Install Git

- Windows: Download & install [git](https://git-scm.com/download/win).
- Mac: Install it with [Homebrew](http://mxcl.github.com/homebrew/), [MacPorts](http://www.macports.org/) or [installer](http://sourceforge.net/projects/git-osx-installer/).
- Linux (Ubuntu, Debian): `sudo apt-get install git-core`
- Linux (Fedora, Red Hat, CentOS): `sudo yum install git-core`

### Install Node.js

The best way to install Node.js is with [nvm](https://github.com/creationix/nvm).

cURL:

``` bash
$ curl https://raw.github.com/creationix/nvm/master/install.sh | sh
```

Wget:

``` bash
$ wget -qO- https://raw.github.com/creationix/nvm/master/install.sh | sh
```

Once nvm is installed, restart the terminal and run the following command to install Node.js.

``` bash
$ nvm install 4
```

Alternatively, download and run [the installer](http://nodejs.org/).

### Install vtk.js

``` bash
$ npm install kitware/vtk-js --save
```

### Getting vtk.js source code for contributing

``` bash
$ git clone https://github.com/kitware/vtk-js.git
$ cd vtk-js
$ npm install
```
