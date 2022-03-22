## WebGPU Module

# Introduction

Provide a WebGPU based view for vtk.js. The idea is to provide an
API based on WebGPU that can coexist and eventually replace the WebGL
backend with a minimum or no user code changes.

# Status

WebGPU is still being finalized and implemented on majpr browsers so
everything is subject to change. This implementation has been tested on
Chrome Canary when WebGPU is enabled. You have to set --enable-unsafe-webgpu
there is a test target named test:webgpu that will specificly try to run
tests using chrome canary.

Note that as of October 2021 WebGPU is changing daily, so this code may
break daily as they change and interate on the API.

Lots of capabilities are currently not implemented.

From an application point of view replacing your OpenGLRenderWindow with
instead calling renderWindow.newAPISpecificView('WebGPU') should be all that
is needed.

# ToDo
- add device.lost handler
- create background class to encapsulate, background clear,
  gradient background, texture background, skybox etc
- PBR lighting to replace the simple model currently coded
- eventually switch to using IBOs and flat interpolation
- cropping planes for polydata, image, volume mappers
- add rgb texture support to volume renderer
- add lighting to volume rendering
- add line zbuffer offset to handle coincident

Waiting on fixes/dev in WebGPU spec
- more cross platform testing and bug fixing, firefox and safari

# Recently ToDone
- possibly change the zbuffer equation to be linear float32
- update widgets to use the new async hardware selector API
- image display (use 3d texture)
- create new volume renderer built for multivolume rendering
  - traverse all volumes and register with volume pass - done
  - render all volumes hexahedra to get depth buffer near and far
    merged with opaque pass depth buffer - done
  - render all volumes in single mapper using prior near/far depth textures - in progress
- 3d textures
- added bind groups
- actor matrix support with auto shift (handle in renderer?)
- add an example of customizing WebGPU
- make all shader replacements programatic, generate
  publicAPI.replaceShader\* invocations from shader code
- add glyphmapper
- hook up testing

# Developer Notes

If you want to extend WebGPU most of the work is done in the mapper classes. The simplest mapper is WebGPUMapperHelper which is the base for all mappers (either directly as a superclass or as a member variable) so probably that is where you should start. It has some subclasses that extend it or use it such as Sphere/Stick/Glyph3d mapper. There is also an example of user code creating a new mapper in the CustomWebGPUCone example. If you are interested in render passes then ForwardPass is the main entry point and makes use of other passes by default.

Here are some quick notes on the WebGPU classes and how they work together. Classes that typically have one instance are described as such even though you can have multiple instances of them.

- Device - one instance, represents a GPU, holds objects that can be shared including the buffer manager, texture manager, shader cache, and pipelines

- BufferManager - one instance, manages and caches buffers (chunks of memeory), owned by the Device

- Buffer - many instances, represents a chunk of memory, often a vtkDataArray, managed by the buffer manager so that multiple mappers can share a common buffer. Textures can also be buffer backed. Owned by the buffermanager.

- TextureManager - one instance, manages and caches many textures each which may have a buffer, owned by the Device

- Texture - many instances, a structured chunk of memory typically 1 to 3 dimensions with optional support for mipmapping, etc. Can be created from a buffer or a JS image. Often created by mappers or render passes.

- TextureView - many instances, a view of a texture, lightweight and a bindable

- Sampler - many instances - something that can be used to sample a texture, typically linear or nearest, etc. Requested often by mappers using textures. a bindable

- ShaderCache - one instance, caches many shader modules, owned by the Device. Requested typically by mappers.

- ShaderModule - many instances, e.g. a vertex or fragment shader program

- VertexInput - many instances, holds the structure and buffers of a Vertex buffer, owned by mappers

- Pipeline - many instances, combines shader modules, vertex input, and fragment destinations. Requested by mappers but owned by the Device so they can be shared by multiple mappers

- RenderEncoder - also known as a RenderPassEncoder or RenderPass in WebGPU but
named RenderEncoder to disambiguate with vtk.js RenderPass. Holds the fragment
destinations a bit like an opengl framebuffer but it is a command encoder that
can be used to run a pipeline on those fragment destinations.

- SwapChain - a specific fragment destination tied to a canvas/RenderWindow (as opposed to a generic texture fragment destination) A RenderEncoder can be setup to write to generic textures or the textures from a swapchain

- RenderWindow - tied to a canvas - has a swapchain

- Renderer - a viewport or layer into a render window

- Mapper - maps vtkDataSet to graphics primitives (draws them) Creates many objects to get the job done including VertexInputs, Pipelines, Buffers, Textures, Samplers. Typically sets up everything and then registers pipelines to call it back when they render. For example, a single mapper when it renders with lines and triangles would request two pipelines and set up their vertex input etc, and then register a reuqest for those pipelines to call it back when the pipelines render. Later on after all mappers have "rendered" the resulting pipelines would be executed by the renderer and for each pipeline all mappers using that pipeline would get a callback so they can bind and draw their primitives. This is different from OpenGL where each mapper would draw during its render pass lines then triangles. With WebGPU (essentially) all lines are drawn together for all mappers, then all triangles for all mappers.

- Bind Group - hold bindables (textures samplers, UBOs SSBOs) and organizes them
so they can be bound as needed. Typically one for each renderer and one for each mapper.

- UniformBuffer - a UBO in a class, mappers and renderers have them by default, a bindable

- StorageBuffer - a SSBO that can be used when you need a SSBO, a bindable

The buffer and texture managers also cache their objects so that these large GPU objects can be shared betwen mappers. Both of them take a request and return something from the cache. In both cases the source property of the request indicates what object is holding onto the buffer/texture.

Note that vtk.js already had a notion of a render pass which is a bit different from
what WebGPU uses. So to avoid confusion we call WebGPU render passes "render encoders".
This matches WebGPU terminology as they are encoders and sometimes called render pass
encoders in the WebGPU spec.

There is a notion of bindable things in this implementation. BingGroups keep an array of
bindable things that it uses/manages. Right now these unclude UBOs, SSBOs, and TextureViews and Smaplers. A bindable thing must answer to the following interface
```
set/getName
getBindGroupLayoutEntry()
getBindGroupEntry()
getBindGroupTime()
getShaderCode(group, binding)
```

## Simple Mapper

The Simple Mapper is the most basic class to get geometry onto the screen and many other mappers subclass from it. The basic process of invoking a mapper is two steps. First we prepareToDraw which gets everything ready, but doesn't actually draw the primitives. Then we register a draw callback that the encoder will invoke later once the mappers pipeline is bound. We do it this way so that mappers that share a pipeline will all get invoked when that pipeline is bound. Then the next pipeline is bound and all mappers sharing that pipeline get drawn. It batches up pipeline draw calls together for better performance.

The prepareToDraw method is implemented as follows.

```
prepareToDraw()
- updateInput() // any preprocessing you need
- updateBuffers() // updates UBOs, VBOs SSBOs, Textures
- updateBindables() // textureViews, samplers
  - model.bindGroup.setBindables(publicAPI.getBindables())
- updatePipeline() // update/create pipeline
  - computePipelineHash() // compute a unique hash for the required pipeline
  - device.getPipeline(hash) // return null if it doesn't already exist
  - if that hash already exists just use it, otherwise create it
```

And the encoder's execution typically looks like this:

```
encoder.attachTextureViews()
encoder.begin(renderWindow.getCommandEncoder())
encoder.end()
- binds pipelines and invokes draw callbacks
    - mapper.draw(encoder) // bind the bindables then draw the primitives
```

updatePipeline does something like:

updatePipeline()
  - computePipelineHash()
  - pipeline = device.getPipeline(model.pipelineHash)
  - if (!pipeline)
    - pipeline = vtkWebGPUPipeline.newInstance()
    - add bindGroupLayouts to it
    - generate shader descriptions for it
    - set topology, renderEncoder, vertexState on the pipeline
    - create the webgpu pipeline device.createPipeline(pipelineHash, pipeline)

We set the render encoder on the pipeline because the renderEncoder used may add shader code to the fragment shader to direct the computed fragment data to specific outputs/textureViews.

The simple mapper is a viewnode subclass so it can handle render passes. The FullScreenQuad is a small subclass of SimpleMapper designed to render a quad. CellArrayMapper is a large subclass of SimpleMapper designed to render a CellArray from a PolyData suchs as verts, lines, polys, strips. PolyDataMapper is a simple class that instantiates CellArrayMappers as needed to do the actual work.
## Private API
Note that none of the classes in the WebGPU directory are meant to be accessed directly by application code. These classes implement one view of the data (WebGPU as opposed to WebGL). Typical applicaiton code will interface with the RenderWindowViewNode superclass (in the SceneGraph) directory as the main entry point for a view such as WebGL or WebGPU. As such, changes to the API of the WebGPU classes are considered private changes, internal to the implementation of this view.

## Volume Rendering Approach

The volume renderer in WebGPU starts in the ForwardPass, which if it detects volumes invokes a volume pass. The volume pass requests bounding boxes from all volumes and renders them, along with the opaque polygonal depth buffer to create min and max ray depth textures. These textures are bounds for each fragment's ray casting. Then the VolumePassFSQ gets invoked with these two bounding textures to actually perfom the ray casting of the voxels between the min and max.

The ray casting is done for all volumes at once and the VolumePassFSQ class is where all the complexity and work is done.


## Zbuffer implementation and calculations

The depth buffer is stored as a 32bit float and ranges from 1.0 to 0.0. The distance to the near clipping plane is by far the largest factor determining the accuracy of the zbuffer. The farther out you can place the near plane the better. See https://zero-radiance.github.io/post/z-buffer/ for a more detailed analysis of why we use this approach.

### Orthographic

For orthographic projections the zbuffer ranges from 1.0 at the near plane to 0.0 at the far plane. The depth value in both the vertex and fragment shader is given as

```position.z = (zVC + f)/(f - n)```

within the fragment shader you can get the z value (in view coordinates)

```zVC = position.z * (far - near) - far```

The depth valus are linear in depth.

### Perspective

For perspective we use a reverse infinite far clip projection which ranges from 1.0 at the near plane to 0.0 at infinity. The depth value in the vertex shader is

```
position.z = near
position.w = -zVC
```

and in the fragment after division by w as

```position.z = -near / zVC```

within the shader you can get the z value (in view coordinates)

```zVC = -near / position.z```

The depth values are not linear in depth.

You can offset geometry by a factor cF ranging from 0.0 to 1.0 using the following forumla

```z' = 1.0 - (1.0 - cF)*(1.0 - z)```
```z' = z + cF - cF*z```
```z' = (1.0 - cF)*z + cF```
