import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkSTLWriter from 'vtk.js/Sources/IO/Geometry/STLWriter';
import vtkSTLReader from 'vtk.js/Sources/IO/Geometry/STLReader';
import vtkPolyDataReader from 'vtk.js/Sources/IO/Legacy/PolyDataReader';
// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const reader = vtkPolyDataReader.newInstance();
const writerReader = vtkSTLReader.newInstance();

const writer = vtkSTLWriter.newInstance();

reader
  .setUrl(`${__BASE_PATH__}/data/legacy/sphere.vtk`, { loadData: true })
  .then(() => {
    writer.setInputData(reader.getOutputData());
    const fileContents = writer.getOutputData();
    // Can also use a static function to write to STL:
    // const fileContents = vtkSTLWriter.writeSTL(reader.getOutputData());

    // Display the resulting STL
    writerReader.parseAsArrayBuffer(fileContents.buffer);
    renderer.resetCamera();
    renderWindow.render();

    // Add a download link for it
    const blob = new Blob([fileContents], { type: 'application/octet-steam' });
    const a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(blob, {
      type: 'application/octet-steam',
    });
    a.download = 'sphere.stl';
    a.text = 'Download';
    a.style.position = 'absolute';
    a.style.left = '50%';
    a.style.bottom = '10px';
    document.body.appendChild(a);
    a.style.background = 'white';
    a.style.padding = '5px';
  });

const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

mapper.setInputConnection(writerReader.getOutputPort());

renderer.addActor(actor);

global.writer = writer;
global.writerReader = writerReader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
