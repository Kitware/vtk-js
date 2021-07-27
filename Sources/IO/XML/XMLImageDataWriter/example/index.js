import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Volume';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';

import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';
import vtkXMLImageDataWriter from 'vtk.js/Sources/IO/XML/XMLImageDataWriter';
import vtkXMLWriter from 'vtk.js/Sources/IO/XML/XMLWriter';

// use full HttpDataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const writer = vtkXMLImageDataWriter.newInstance();
writer.setFormat(vtkXMLWriter.FormatTypes.BINARY);
writer.setInputConnection(reader.getOutputPort());

const writerReader = vtkXMLImageDataReader.newInstance();

reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const fileContents = writer.write(reader.getOutputData());

    // Try to read it back.
    const textEncoder = new TextEncoder();
    writerReader.parseAsArrayBuffer(textEncoder.encode(fileContents));
    renderer.resetCamera();
    renderWindow.render();

    const blob = new Blob([fileContents], { type: 'text/plain' });
    const a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(blob, { type: 'text/plain' });
    a.download = 'headsq.vti';
    a.text = 'Download';
    a.style.position = 'absolute';
    a.style.left = '50%';
    a.style.bottom = '10px';
    document.body.appendChild(a);
    a.style.background = 'white';
    a.style.padding = '5px';
  });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.1);
actor.setMapper(mapper);

mapper.setInputConnection(writerReader.getOutputPort());

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(200.0, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(2000.0, 0.0, 0.0, 0.0);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(200.0, 0.0);
ofun.addPoint(1200.0, 0.2);
ofun.addPoint(4000.0, 0.4);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
// actor.getProperty().setInterpolationTypeToNearest();
// actor.getProperty().setInterpolationTypeToFastLinear();
actor.getProperty().setInterpolationTypeToLinear();

renderer.addActor(actor);

global.writer = writer;
global.writerReader = writerReader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
