import '@kitware/vtk.js/favicon';

import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkArrowSource from '@kitware/vtk.js/Filters/Sources/ArrowSource';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkReverseSense from '@kitware/vtk.js/Filters/Core/ReverseSense';

import GUI from 'lil-gui';

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const COLORS = {
  source: [0.2, 0.55, 0.86],
  reversed: [0.94, 0.52, 0.25],
};

function rgb(color) {
  return `rgb(${color.map((value) => Math.round(value * 255)).join(', ')})`;
}

function styleCube(actor, color) {
  actor.getProperty().setColor(...color);
  actor.getProperty().setDiffuse(0.75);
  actor.getProperty().setAmbient(0.2);
  actor.getProperty().setSpecular(0.18);
  actor.getProperty().setSpecularPower(22);
}

function addLegend() {
  const gui = new GUI({ title: 'Controls' });
  const details = {
    source: rgb(COLORS.source),
    reversed: rgb(COLORS.reversed),
  };

  gui.addColor(details, 'source').name('Source').disable();
  gui.addColor(details, 'reversed').name('Reversed').disable();
}

const cubeSource1 = vtkCubeSource.newInstance();
const cubeActor1 = vtkActor.newInstance();
const cubeMapper1 = vtkMapper.newInstance();
cubeActor1.setMapper(cubeMapper1);
cubeMapper1.setInputConnection(cubeSource1.getOutputPort());
styleCube(cubeActor1, COLORS.source);
renderer.addActor(cubeActor1);

const arrowSource1 = vtkArrowSource.newInstance();
const glyphMapper1 = vtkGlyph3DMapper.newInstance();
glyphMapper1.setInputConnection(cubeSource1.getOutputPort());
glyphMapper1.setSourceConnection(arrowSource1.getOutputPort());
glyphMapper1.setOrientationModeToDirection();
glyphMapper1.setOrientationArray('Normals');
glyphMapper1.setScaleModeToScaleByMagnitude();
glyphMapper1.setScaleArray('Normals');
glyphMapper1.setScaleFactor(0.1);

const glyphActor1 = vtkActor.newInstance();
glyphActor1.setMapper(glyphMapper1);
renderer.addActor(glyphActor1);

const cubeSource2 = vtkCubeSource.newInstance();
const cubeActor2 = vtkActor.newInstance();
const cubeMapper2 = vtkMapper.newInstance();
cubeActor2.setMapper(cubeMapper2);
cubeMapper2.setInputConnection(cubeSource2.getOutputPort());
cubeActor2.setPosition(2, 0, 0);
styleCube(cubeActor2, COLORS.reversed);
renderer.addActor(cubeActor2);

const reverseSense = vtkReverseSense.newInstance({ reverseNormals: true });
reverseSense.setInputConnection(cubeSource2.getOutputPort());

const arrowSource2 = vtkArrowSource.newInstance();
const glyphMapper2 = vtkGlyph3DMapper.newInstance();
glyphMapper2.setInputConnection(reverseSense.getOutputPort());
glyphMapper2.setSourceConnection(arrowSource2.getOutputPort());
glyphMapper2.setOrientationModeToDirection();
glyphMapper2.setOrientationArray('Normals');
glyphMapper2.setScaleModeToScaleByMagnitude();
glyphMapper2.setScaleArray('Normals');
glyphMapper2.setScaleFactor(0.1);

const glyphActor2 = vtkActor.newInstance();
glyphActor2.setMapper(glyphMapper2);
glyphActor2.setPosition(2, 0, 0);
renderer.addActor(glyphActor2);

addLegend();

renderer.resetCamera();
renderWindow.render();
