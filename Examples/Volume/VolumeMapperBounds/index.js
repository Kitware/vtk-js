import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/Volume';

import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';

import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance();
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(0.1);
actor.setMapper(mapper);

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});

mapper.setInputConnection(reader.getOutputPort());

// Sphere sources
const sphereSource1 = vtkSphereSource.newInstance();
const sphereActor1 = vtkActor.newInstance();
const sphereMapper1 = vtkMapper.newInstance();
const sphereSource2 = vtkSphereSource.newInstance();
const sphereActor2 = vtkActor.newInstance();
const sphereMapper2 = vtkMapper.newInstance();

sphereMapper1.setInputConnection(sphereSource1.getOutputPort());
sphereActor1.setMapper(sphereMapper1);
sphereMapper2.setInputConnection(sphereSource2.getOutputPort());
sphereActor2.setMapper(sphereMapper2);

reader
  .setUrl(
    'https://sedghi.github.io/dicom-test/src/data/synthetic_dicom_11Slices_1mm.vti'
  )
  .then(() => {
    reader.loadData().then(() => {
      renderer.addVolume(actor);
      actor.getProperty().setInterpolationTypeToNearest();

      renderer.resetCamera();

      const activeCamera = renderer.getActiveCamera();
      activeCamera.setParallelProjection(true);

      sphereSource1.setCenter(0, 0, 0);
      sphereSource1.setRadius(0.2);

      sphereSource2.setCenter(10, 10, 10);
      sphereSource2.setRadius(0.2);

      renderer.addVolume(sphereActor1);
      renderer.addVolume(sphereActor2);

      renderer.resetCamera();

      renderWindow.render();
    });
  });
