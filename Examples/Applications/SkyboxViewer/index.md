## Skybox Viewer

The Skybox Viewer allow to explore a surrounding environment based on one or many predefined locations which have been captured using 6 textures.
The skybox data format is bascially a zip file capturing all those locations with 6 images and some meta json description file that perform the mapping between the image file names and the target face of the skybox cube with possible image transformation such as rotation and flip.

### Usage

The Skybox Viewer can be used as a link that encode both the Viewer path, the data url and some rendering configurations. The list below list every possible parameter that can be provided in the URL for tunning the user experience.

| Argument  | Comment                                     | Default           |
| --------- | ------------------------------------------- | ----------------- |
| fileURL   | URL to use to download the skybox file      | Expect local file |
| position  | Name of the position to pre-select          | first in the list |
| direction | Direction the camera should look at         | [1,0,0]           |
| up        | Camera view up                              | [0,1,0]           |
| vr        | Enable split screen mode                    | false             |
| eye       | Only for VR                                 | -0.05 (iPhone 6s) |
| viewAngle | Adjust view angle of the camera             | 60                |
| debug     | Show grid for eye separation                | false             |
| timer     | automatically increment position in seconds | 0                 |

### Examples

- [Basic viewer](https://kitware.github.io/vtk-js/examples/SkyboxViewer/SkyboxViewer.html?fileURL=https://data.kitware.com/api/v1/file/5aaa9ef58d777f068578d4e7/download&position=6)
- [VR Viewer](https://kitware.github.io/vtk-js/examples/SkyboxViewer/SkyboxViewer.html?fileURL=https://data.kitware.com/api/v1/file/5aaaa4d68d777f068578d4ed/download&vr)

### VR Mode

In VR mode, a `tap` can be used to move to the next position while a `tab with 2 fingers` can be use to toggle the full screen mode. 
