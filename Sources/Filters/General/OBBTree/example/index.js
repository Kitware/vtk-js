import 'vtk.js/Sources/favicon';
// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
// import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';
import vtkOBBTree from 'vtk.js/Sources/Filters/General/OBBTree';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import { loadOBJ } from 'vtk.js/Sources/Filters/General/OBBTree/helper';
import vtkTriangleFilter from 'vtk.js/Sources/Filters/General/TriangleFilter';
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

function render(mesh, userMatrix = null) {
  const mapper = vtkMapper.newInstance();
  mapper.setInputData(mesh);
  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  renderer.addActor(actor);
  if (userMatrix) {
    actor.setUserMatrix(userMatrix);
  }

  return actor;
}

function addMesh(mesh, userMatrix, triangulate = false) {
  const obbTree = vtkOBBTree.newInstance();
  if (triangulate) {
    const triangleFilter = vtkTriangleFilter.newInstance();
    triangleFilter.setInputData(mesh);
    triangleFilter.update();
    obbTree.setDataset(triangleFilter.getOutputData());
  } else {
    obbTree.setDataset(mesh);
  }
  // obbTree.setMaxLevel(2);
  obbTree.buildLocator();

  render(mesh, userMatrix);

  const obb = obbTree.generateRepresentation(0);
  const obbActor = render(obb, userMatrix);
  obbActor.getProperty().setOpacity(0.3);
  obbActor.getProperty().setEdgeVisibility(1);

  return obbTree;
}

function showAndIntersect(mesh1, mesh2, triangulate = false) {
  const obbTree1 = addMesh(mesh1, null, triangulate);
  // const m = vtkMatrixBuilder
  //   .buildFromRadian()
  //   .translate(0.1, 0.1, 0)
  //   .getMatrix();
  const obbTree2 = addMesh(mesh2, null, triangulate);
  const intersection = {
    obbTree1: obbTree2,
    intersectionLines: vtkPolyData.newInstance(),
  };
  const intersect = obbTree1.intersectWithOBBTree(
    obbTree2,
    null, // m,
    obbTree1.findTriangleIntersections.bind(null, intersection)
  );
  console.log('obbs are intersected : ', intersect);
  const tubeFilter = vtkTubeFilter.newInstance();
  tubeFilter.setInputData(intersection.intersectionLines);
  tubeFilter.setRadius(0.01);
  tubeFilter.update();
  const intesectionActor = render(tubeFilter.getOutputData());
  intesectionActor.getProperty().setColor(1, 0, 0);
  intesectionActor.getMapper().setResolveCoincidentTopologyToPolygonOffset();
  intesectionActor
    .getMapper()
    .setResolveCoincidentTopologyLineOffsetParameters(-1, -1);

  renderer.resetCamera();
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

// eslint-disable-next-line no-constant-condition
if (false) {
  const obj1 = loadOBJ(`${__BASE_PATH__}/Data/obj/obj1.obj`);
  const obj2 = loadOBJ(`${__BASE_PATH__}/Data/obj/obj2.obj`);

  Promise.all([obj1, obj2]).then((out) => {
    showAndIntersect(out[0], out[1]);
  });
} else {
  const source1 = vtkArrowSource.newInstance({ direction: [1, 0, 0] });
  source1.update();
  const source2 = vtkArrowSource.newInstance({ direction: [0, 1, 1] });
  source2.update();
  showAndIntersect(source1.getOutputData(), source2.getOutputData(), true);
}
