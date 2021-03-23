## WebGPU Module


Introduction
============

Provide a WebGPU based view for vtk.js. The idea is to provide an
API based on WebGPU that can coexist and eventually replace the WebGL
backend with a minimum or no user code changes.

Status
============

WebGPU is still being finalized and implemented on majpr browsers so
everything is subject to change. This implementation has been tested on
Chrome Canary when WebGPU is enabled. You have to set --enable-unsafe-webgpu
there is a test target named test:webgpu that will specificly try to run
tests using chrome canary.

Lots of capabilities are currently not implemented.

From an application point of view replacing your OpenGLRenderWindow with
instead calling renderWindow.newAPISpecificView('WebGPU') should be all that
is needed.

ToDo
============
- 3d textures
- PBR lighting to replace the simple model currently coded
- image display
- volume rendering
- transparency
- actor matrix support
- sphere/stick mappers
- post render operations/framebuffers
- hardware selector

Developer Notes
============
There is a buffer cache and a texture cache so that these large GPU objects
can be shared betwen mappers. Both of them take a request and return something from
the cache. In both cases the source property of the request indicates what object is holding onto the buffer/texture.
