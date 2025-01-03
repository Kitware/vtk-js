import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import vtkOBJWriter from '@kitware/vtk.js/IO/Misc/OBJWriter';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.5, 0.5, 0.5],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const resetCamera = renderer.resetCamera;
const render = renderWindow.render;

const reader = vtkPolyDataReader.newInstance();
const writerReader = vtkOBJReader.newInstance();
const writer = vtkOBJWriter.newInstance();

reader
  .setUrl(`${__BASE_PATH__}/data/legacy/sphere.vtk`, { loadData: true })
  .then(() => {
    writer.setInputData(reader.getOutputData());
    const fileContents = writer.getOutputData();
    // Can also use a static function to write to OBJ:
    // const fileContents = vtkOBJWriter.writeOBJ(reader.getOutputData());

    // Display the resulting OBJ
    writerReader.parseAsText(fileContents);

    const polydata = reader.getOutputData(0);
    const mapper = vtkMapper.newInstance();
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    mapper.setInputData(polydata);

    renderer.addActor(actor);
    resetCamera();
    render();

    // Add a download link for it
    const blob = new Blob([fileContents], { type: 'application/octet-steam' });
    const a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(blob, {
      type: 'application/octet-steam',
    });
    a.download = 'sphere.obj';
    a.text = 'Download';
    a.style.position = 'absolute';
    a.style.left = '50%';
    a.style.bottom = '10px';
    document.body.appendChild(a);
    a.style.background = 'white';
    a.style.padding = '5px';
  });

global.writer = writer;
global.writerReader = writerReader;
global.fullScreenRenderer = fullScreenRenderer;
