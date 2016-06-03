import * as macro                 from '../../../../macro';
import vtkActor                   from '../../../../Rendering/Core/Actor';
import vtkCamera                  from '../../../../Rendering/Core/Camera';
import vtkDataArray               from '../../../../Common/Core/DataArray';
import vtkMapper                  from '../../../../Rendering/Core/Mapper';
import vtkOpenGLRenderWindow      from '../../../../Rendering/OpenGL/RenderWindow';
import vtkRenderer                from '../../../../Rendering/Core/Renderer';
import vtkRenderWindow            from '../../../../Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from '../../../../Rendering/Core/RenderWindowInteractor';
import vtkSphereSource            from '../../../../Filters/Sources/SphereSource';
import vtkWarpScalar              from '../../../../Filters/General/WarpScalar';

import controlPanel from './controller.html';

// Create some control UI
const rootContainer = document.querySelector('body');
rootContainer.innerHTML = controlPanel;
const renderWindowContainer = document.querySelector('.renderwidow');

const renWin = vtkRenderWindow.newInstance();
const ren = vtkRenderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.32, 0.34, 0.43);

const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setSize(500, 500);
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

const actor = vtkActor.newInstance();
ren.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
ren.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 10);
cam.setClippingRange(0.1, 50.0);

// Build pipeline
const sphereSource = vtkSphereSource.newInstance({ thetaResolution: 40, phiResolution: 41 });
const filter = vtkWarpScalar.newInstance({ scaleFactor: 0, useNormal: false });

// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
const randFilter = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 1, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      const newArray = new Float32Array(inData[0].getPoints().getNumberOfTuples());
      for (let i = 0; i < newArray.length; i++) {
        newArray[i] = i % 2 ? 1 : 0;
      }

      const da = vtkDataArray.newInstance({ values: newArray });
      da.setName('spike');

      const outDS = inData[0].shallowCopy();
      outDS.getPointData().addArray(da);
      outDS.getPointData().setActiveScalars(da.getName());

      outData[0] = outDS;
    }
  };
})();

randFilter.setInputConnection(sphereSource.getOutputPort());
filter.setInputConnection(randFilter.getOutputPort());
mapper.setInputConnection(filter.getOutputPort());

// Select array to process
filter.setInputArrayToProcess(0, 'spike', 'PointData', 'Scalars');

// Initialize interactor and start
iren.initialize();
iren.bindEvents(renderWindowContainer, document);
iren.start();

// ----------------

// Warp setup
['scaleFactor'].forEach(propertyName => {
  document.querySelector(`.${propertyName}`).addEventListener('input', e => {
    const value = Number(e.target.value);
    filter.set({ [propertyName]: value });
    renWin.render();
  });
});

document.querySelector('.useNormal').addEventListener('change', e => {
  const useNormal = !!(e.target.checked);
  filter.set({ useNormal });
  renWin.render();
});

// Sphere setup
['radius', 'thetaResolution', 'phiResolution'].forEach(propertyName => {
  document.querySelector(`.${propertyName}`).addEventListener('input', e => {
    const value = Number(e.target.value);
    sphereSource.set({ [propertyName]: value });
    renWin.render();
  });
});

global.source = sphereSource;
global.filter = filter;
global.mapper = mapper;
global.actor = actor;
