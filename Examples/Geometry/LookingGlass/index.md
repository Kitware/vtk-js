## Holographic Scenes with Looking Glass

vtk.js supports rendering 3D holograms to [Looking Glass](https://lookingglassfactory.com/) holographic displays. The following are required for getting started:
- A physical Looking Glass display with an HDMI and USB connection to the computer running the vtk.js scene;
- The [Looking Glass Bridge](https://lookingglassfactory.com/software/looking-glass-bridge) native application; and
- The [Looking Glass WebXR Polyfill](https://github.com/Looking-Glass/looking-glass-webxr) (already fetched in this example).

Clicking "Send to Looking Glass" in the example above will open a new popup window on the connected Looking Glass display. Double-clicking the window will maximize the hologram view to display properly.

If the Looking Glass display is disconnected or the Looking Glass Bridge application is not running then a non-composited, "swizzled" view will be shown in a popup window.

The Looking Glass display composites a "quilt" of multiple scene renderings into a hologram with "depth" when viewed from multiple angles. vtk.js generates multiple scene renderings for each frame in order to generate new "quilt".

More information on holograms and Looking Glass displays is available in the [Looking Glass documentation](https://docs.lookingglassfactory.com/).
