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

Note that as of APril 2021 WebGPU is changing daily, so this code may
break daily as they change and interate on the API.

Lots of capabilities are currently not implemented.

From an application point of view replacing your OpenGLRenderWindow with
instead calling renderWindow.newAPISpecificView('WebGPU') should be all that
is needed.

ToDo
============
- add glyphmapper
- hook up testing
- PBR lighting to replace the simple model currently coded
- actor matrix support with auto shift
- eventually switch to using IBOs and flat interpolation
- cropping planes for polydata mapper
- update widgets to use the new async hardware selector API

Waiting on fixes/dev in WebGPU spec
- 3d textures (as of April 21 2021 Dawn lacks support for 1d and 3d)
- image display
- volume rendering
- create new volume renderer built for multivolume rendering

Developer Notes
============

Here are some quick notes on the WebGPU classes and how they work together. Classes that typically have one instance are described as such even though you can have multiple instances of them.

Device - one instance, represents a GPU, holds objects that can be shared including the buffer manager, texture manager, shader cache, and pipelines

BufferManager - one instance, manages and caches buffers (chunks of memeory), owned by the Device

Buffer - many instances, represents a chunk of memory, often a vtkDataArray, managed by the buffer manager so that multiple mappers can share a common buffer. Textures can also be buffer backed. Owned by the buffermanager.

TextureManager - one instance, manages and caches many textures each which may have a buffer, owned by the Device

Texture - many instances, a structured chunk of memory typically 1 to 3 dimensions with optional support for mipmapping, etc. Can be created from a buffer or a JS image. Often created by mappers or render passes.

Sampler - many instances - something that can be used to sample a texture, typically linear or nearest, etc. Requested often by mappers using textures.

ShaderCache - one instance, caches many shader modules, owned by the Device. Requested typically by mappers.

ShaderModule - many instances, e.g. a vertex or fragment shader program

VertexInput - many instances, holds the structure and buffers of a Vertex buffer, owned by mappers

Pipeline - many instances, combines shader modules, vertex input, and fragment destinations. Requested by mappers but owned by the Device so they can be shared by multiple mappers

RenderEncoder - also known as a RenderPassEncoder or RenderPass in WebGPU but
  named RenderEncoder to disambiguate with vtk.js RenderPass. Holds the fragment
  destinations a bit like an opengl framebuffer but it is a command encoder that
  can be used to run a pipeline on those fragment destinations.

SwapChain - a specific fragment destination tied to a canvas/RenderWindow (as opposed to a generic texture fragment destination) A RenderEncoder can be setup to write to generic textures or the textures from a swapchain

RenderWindow - tied to a canvas - has a swapchain

Renderer - a viewport or layer into a render window

Mapper - maps vtkDataSet to graphics primitives (draws them) Creates many objects to get
the job done including VertexInputs, Pipelines, Buffers, Textures, Samplers. Typically sets up everything and then registers pipelines to call it back when they render. For example, a single mapper when it renders with lines and triangles would request two pipelines and set up their vertex input etc, and then register a reuqest for those pipelines to call it back when the pipelines render. Later on after all mappers have "rendered" the resulting pipelines would be executed by the renderer and for each pipeline all mappers using that pipeline would get a callback so they can bind and draw their primitives. This is different from OpenGL where each mapper would draw during its render pass lines then triangles. With WebGPU (essentially) all lines are drawn together for all mappers, then all triangles for all mappers.


The buffer and texture managers also cache their objects so that these large GPU objects
can be shared betwen mappers. Both of them take a request and return something from
the cache. In both cases the source property of the request indicates what object is holding onto the buffer/texture.

Note that vtk.js already had a notion of a render pass which is a bit different from
what WebGPU uses. So to avoid confusion we call WebGPU render passes "render encoders".
This matches WebGPU terminology as they are encoders and sometimes called render pass
encoders in the WebGPU spec.
