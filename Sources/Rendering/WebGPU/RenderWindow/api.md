# WebGPU RenderWindow

vtkWebGPURenderWindow is designed to view/render a vtkRenderWindow
using the WebGPU API.

## Multi-Sample Anti-Aliasing (MSAA)

MSAA can be enabled to improve image quality by reducing aliasing
artifacts on geometry edges. When active, both opaque and translucent
rendering passes use multisampled textures and resolve them before
compositing.

### multiSample (set/get)

Controls the number of MSAA samples per pixel.

- **Default:** `1` (no anti-aliasing)
- **Valid values:** `1` or `4`
- Setting any other value is ignored and logs an error.
- Changing `multiSample` at runtime automatically recreates the
  internal render encoders and textures on the next frame.

**Usage:**

```js
const renderWindow = vtkWebGPURenderWindow.newInstance();
renderWindow.setMultiSample(4); // enable 4× MSAA
renderWindow.setMultiSample(1); // disable MSAA
```
