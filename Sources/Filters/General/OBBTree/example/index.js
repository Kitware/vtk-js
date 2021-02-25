import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
// import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
// import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkOBBTree from 'vtk.js/Sources/Filters/General/OBBTree';
import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';
import { mat4 } from 'gl-matrix';

import { loadOBJ } from 'vtk.js/Sources/Filters/General/OBBTree/helper';
// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

function createArrowPipeline(mesh) {
  const obbTree = vtkOBBTree.newInstance();
  obbTree.setDataset(mesh);
  obbTree.setMaxLevel(2);
  console.time('buildLocator');
  obbTree.buildLocator();
  console.timeEnd('buildLocator');

  // const obb = obbTree.generateRepresentation(0);

  // const mapperArrow = vtkMapper.newInstance();
  // mapperArrow.setInputData(mesh);
  // const actorArrow = vtkActor.newInstance();
  // actorArrow.setMapper(mapperArrow);
  // renderer.addActor(actorArrow);

  // const mapper = vtkMapper.newInstance();
  // mapper.setInputData(obb);
  // const actor = vtkActor.newInstance();
  // actor.setMapper(mapper);
  // actor.getProperty().setOpacity(0.5);
  // actor.getProperty().setEdgeVisibility(1);

  // renderer.addActor(actor);

  return obbTree;
}

function createAndCompare(mesh1, mesh2) {
  const obbTree1 = createArrowPipeline(mesh1);
  const obbTree2 = createArrowPipeline(mesh2);
  const intersect = obbTree1.intersectWithOBBTree(
    obbTree2,
    mat4.create(),
    null,
    null
  );
  console.log('obbs are intersected : ', intersect);
  renderer.resetCamera();
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

if (false) {
  const readVertebraePromise = loadOBJ(`${__BASE_PATH__}/Data/obj/L04.obj`);
  const readScrewPromise = loadOBJ(`${__BASE_PATH__}/Data/obj/screw.obj`);

  Promise.all([readVertebraePromise, readScrewPromise]).then((out) => {
    createAndCompare(out[0], out[1]);
  });
} else {
  const arrowSource1 = vtkArrowSource.newInstance({ direction: [1, 0, 0] });
  arrowSource1.update();
  const arrowSource2 = vtkArrowSource.newInstance({ direction: [0, 1, 1] });
  arrowSource2.update();
  createAndCompare(arrowSource1.getOutputData(), arrowSource2.getOutputData());
}
