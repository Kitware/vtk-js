## Volume Viewer

The Volume Viewer is a standalone single page web application that can be used to visualize and explore VTI files. The only requirement is the single [HTML] file without any web server. This application can be use to load vti file and use volume rendering to render them.
The current vti supported format is __ascii__, __binary__ and __binary+zlib__ compression.

Some sample files can be found [here](https://data.kitware.com/#collection/586fef9f8d777f05f44a5c86/folder/59de9cf48d777f31ac641dbc)

Also using extra argument to the URL allow to view remote VTI like the links below:
- [head-ascii.vti](https://kitware.github.io/vtk-js/examples/VolumeViewer/VolumeViewer.html?fileURL=https://data.kitware.com/api/v1/item/59de9d418d777f31ac641dbe/download) 30.31 MB
- [head-binary.vti](https://kitware.github.io/vtk-js/examples/VolumeViewer/VolumeViewer.html?fileURL=https://data.kitware.com/api/v1/item/59de9dc98d777f31ac641dc1/download) 15.67 MB
- [head-binary-zlib.vti](https://kitware.github.io/vtk-js/examples/VolumeViewer/VolumeViewer.html?fileURL=https://data.kitware.com/api/v1/item/59e12e988d777f31ac6455c5/download) 8.439 MB

[HTML]: https://kitware.github.io/vtk-js/examples/VolumeViewer/VolumeViewer.html

### Editing the opacity transfer function

__With a mouse:__

- Double click: 
  - create a gaussian at that given position and height with no bias.
- Right click
  - delete the gaussian underneath.
- Drag: 
  - Bottom of a gaussian will adjust the width. From left to right will increase the width. 
  - Middle of the gaussian will adjust the biais (x and y).
  - Top of the gaussian will adjust height.
  - Anywhere else will adjust its position.

__With touch:__

- Double Tap:
  - One finger: create a gaussian at that given position and height with no bias.
  - Two fingers: delete the gaussian underneath.
- Drag: 
  - Bottom of a gaussian will adjust the width. From left to right will increase the width. 
  - Middle of the gaussian will adjust the biais (x and y).
  - Top of the gaussian will adjust height.
  - Anywhere else will adjust its position.
