import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import vtkCubeHandleRepresentation from '@kitware/vtk.js/Widgets/Representations/CubeHandleRepresentation';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkSphereHandleRepresentation from '@kitware/vtk.js/Widgets/Representations/SphereHandleRepresentation';
import vtkStateBuilder from '@kitware/vtk.js/Widgets/Core/StateBuilder';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// -----------------------------------------------------------
// State
// -----------------------------------------------------------

const compositeState = vtkStateBuilder
  .createBuilder()
  .addStateFromMixin({
    labels: ['all', 'a', 'ab', 'ac'],
    mixins: ['origin', 'color', 'scale1'],
    name: 'a',
    initialValues: {
      scale1: 0.5,
      origin: [-1, 0, 0],
    },
  })
  .addStateFromMixin({
    labels: ['all', 'b', 'ab', 'bc'],
    mixins: ['origin', 'color', 'scale1'],
    name: 'b',
    initialValues: {
      scale1: 0.5,
      origin: [0, 0, 0],
    },
  })
  .addStateFromMixin({
    labels: ['all', 'c', 'bc', 'ac'],
    mixins: ['origin', 'color', 'scale1'],
    name: 'c',
    initialValues: {
      scale1: 0.5,
      origin: [1, 0, 0],
    },
  })
  .addStateFromMixin({
    labels: ['all', 'd'],
    mixins: ['origin', 'color', 'scale3'],
    name: 'd',
    initialValues: {
      scale3: [0.5, 1, 2],
      origin: [0, 0, 2],
    },
  })
  .build();

// -----------------------------------------------------------
// Representation
// -----------------------------------------------------------

const widgetSphereRep = vtkSphereHandleRepresentation.newInstance();
widgetSphereRep.setInputData(compositeState);
widgetSphereRep.setLabels(['all']);
widgetSphereRep.getActors().forEach(renderer.addActor);

const widgetCubeRep = vtkCubeHandleRepresentation.newInstance();
widgetCubeRep.setInputData(compositeState);
widgetCubeRep.setLabels('all');
widgetCubeRep.getActors().forEach(renderer.addActor);

const reps = { sphere: widgetSphereRep, cube: widgetCubeRep };

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();

const groupParams = {
  SphereGroups: 'all',
  CubeGroups: 'all',
};

gui
  .add(groupParams, 'SphereGroups', [
    'all',
    'none',
    'a',
    'b',
    'c',
    'd',
    'ab',
    'ac',
    'bc',
    'b,c',
    'a,b,c',
    'b,c,d',
    'a,b,c,d',
  ])
  .name('Sphere groups')
  .onChange((value) => {
    reps.sphere.set({ labels: value });
    renderWindow.render();
  });

gui
  .add(groupParams, 'CubeGroups', [
    'all',
    'none',
    'a',
    'b',
    'c',
    'd',
    'ab',
    'ac',
    'bc',
    'b,c',
    'a,b,c',
    'b,c,d',
    'a,b,c,d',
  ])
  .name('Cube groups')
  .onChange((value) => {
    reps.cube.set({ labels: value });
    renderWindow.render();
  });

const glyphParams = {
  GlyphResolution: 8,
  ActiveScale: 1.2,
  ActiveColor: 0,
};

gui
  .add(glyphParams, 'GlyphResolution', 3, 60, 1)
  .name('Glyph resolution')
  .onChange((value) => {
    reps.sphere.set({ glyphResolution: value });
    reps.cube.set({ glyphResolution: value });
    renderWindow.render();
  });

gui
  .add(glyphParams, 'ActiveScale', 0.5, 2, 0.1)
  .name('Active scale')
  .onChange((value) => {
    reps.sphere.set({ activeScaleFactor: value });
    reps.cube.set({ activeScaleFactor: value });
    renderWindow.render();
  });

gui
  .add(glyphParams, 'ActiveColor', 0, 1, 0.1)
  .name('Active color')
  .onChange((value) => {
    reps.sphere.set({ activeColor: value });
    reps.cube.set({ activeColor: value });
    renderWindow.render();
  });

const stateParams = {
  AActive: true,
  ARadius: 0.5,
  AColor: 0.5,
  AOriginX: -1,
  AOriginY: 0,
  AOriginZ: 0,

  BActive: true,
  BRadius: 0.5,
  BColor: 0.5,
  BOriginX: 0,
  BOriginY: 0,
  BOriginZ: 0,

  CActive: true,
  CRadius: 0.5,
  CColor: 0.5,
  COriginX: 1,
  COriginY: 0,
  COriginZ: 0,
};

function applyStateField(field, paramsPrefix) {
  const stateObj = compositeState.get(field)[field];
  const active = stateParams[`${paramsPrefix}Active`];
  const radius = stateParams[`${paramsPrefix}Radius`];
  const color = stateParams[`${paramsPrefix}Color`];
  const origin = [
    stateParams[`${paramsPrefix}OriginX`],
    stateParams[`${paramsPrefix}OriginY`],
    stateParams[`${paramsPrefix}OriginZ`],
  ];

  stateObj.set({
    active,
    scale1: radius,
    color,
  });
  stateObj.setOrigin(origin);
  renderWindow.render();
}

const groupA = gui.addFolder('State A');
groupA
  .add(stateParams, 'AActive')
  .name('Active')
  .onChange(() => applyStateField('a', 'A'));
groupA
  .add(stateParams, 'ARadius', 0.1, 1, 0.1)
  .name('Radius')
  .onChange(() => applyStateField('a', 'A'));
groupA
  .add(stateParams, 'AColor', 0, 1, 0.1)
  .name('Color')
  .onChange(() => applyStateField('a', 'A'));
groupA
  .add(stateParams, 'AOriginX', -1, 1, 0.1)
  .name('Origin X')
  .onChange(() => applyStateField('a', 'A'));
groupA
  .add(stateParams, 'AOriginY', -1, 1, 0.1)
  .name('Origin Y')
  .onChange(() => applyStateField('a', 'A'));
groupA
  .add(stateParams, 'AOriginZ', -1, 1, 0.1)
  .name('Origin Z')
  .onChange(() => applyStateField('a', 'A'));

const groupB = gui.addFolder('State B');
groupB
  .add(stateParams, 'BActive')
  .name('Active')
  .onChange(() => applyStateField('b', 'B'));
groupB
  .add(stateParams, 'BRadius', 0.1, 1, 0.1)
  .name('Radius')
  .onChange(() => applyStateField('b', 'B'));
groupB
  .add(stateParams, 'BColor', 0, 1, 0.1)
  .name('Color')
  .onChange(() => applyStateField('b', 'B'));
groupB
  .add(stateParams, 'BOriginX', -1, 1, 0.1)
  .name('Origin X')
  .onChange(() => applyStateField('b', 'B'));
groupB
  .add(stateParams, 'BOriginY', -1, 1, 0.1)
  .name('Origin Y')
  .onChange(() => applyStateField('b', 'B'));
groupB
  .add(stateParams, 'BOriginZ', -1, 1, 0.1)
  .name('Origin Z')
  .onChange(() => applyStateField('b', 'B'));

const groupC = gui.addFolder('State C');
groupC
  .add(stateParams, 'CActive')
  .name('Active')
  .onChange(() => applyStateField('c', 'C'));
groupC
  .add(stateParams, 'CRadius', 0.1, 1, 0.1)
  .name('Radius')
  .onChange(() => applyStateField('c', 'C'));
groupC
  .add(stateParams, 'CColor', 0, 1, 0.1)
  .name('Color')
  .onChange(() => applyStateField('c', 'C'));
groupC
  .add(stateParams, 'COriginX', -1, 1, 0.1)
  .name('Origin X')
  .onChange(() => applyStateField('c', 'C'));
groupC
  .add(stateParams, 'COriginY', -1, 1, 0.1)
  .name('Origin Y')
  .onChange(() => applyStateField('c', 'C'));
groupC
  .add(stateParams, 'COriginZ', -1, 1, 0.1)
  .name('Origin Z')
  .onChange(() => applyStateField('c', 'C'));
