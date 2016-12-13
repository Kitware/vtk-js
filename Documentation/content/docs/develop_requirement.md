title: Requirements
---

Installing or developing vtk.js is quite easy. However, you do need to have a couple of other things installed first:

- [Node.js](http://nodejs.org/)
- [Git](http://git-scm.com/)

If your computer already has these, congratulations! Just install vtk.js with npm within your project:

```sh
$ npm install vtk.js --save
```

or if that's for developing vtk.js, then clone the repository using git:

```sh
$ git clone https://github.com/kitware/vtk-js.git
$ cd vtk-js
$ npm install
```

If not, please follow the following instructions to install all the requirements.

{% note warn For Mac users %}
You may encounter some problems when compiling. Please install Xcode from App Store first. After Xcode is installed, open Xcode and go to **Preferences -> Download -> Command Line Tools -> Install** to install command line tools.
{% endnote %}

### Git

- Windows: Download & install [git](https://git-scm.com/download/win).
- Mac: Install it with [Homebrew](http://mxcl.github.com/homebrew/), [MacPorts](http://www.macports.org/) or [installer](http://sourceforge.net/projects/git-osx-installer/).
- Linux (Ubuntu, Debian): `sudo apt-get install git-core`
- Linux (Fedora, Red Hat, CentOS): `sudo yum install git-core`

### Node.js

The best way to install Node.js is with [nvm](https://github.com/creationix/nvm).

