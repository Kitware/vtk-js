import { it, expect } from 'vitest';
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkContourLoopExtraction from 'vtk.js/Sources/Filters/General/ContourLoopExtraction';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

it('ContourLoopExtraction loops count', async () => {
  const plane = vtkPlane.newInstance();
  const cutter = vtkCutter.newInstance();

  // 1. Fetch the .vtkjs archive as binary.
  const zipContent = await HttpDataAccessHelper.fetchBinary(
    `${__BASE_PATH__}/data/StanfordDragon.vtkjs`,
    {}
  );

  // 2. Unpack it and get a zip-backed DataAccessHelper once it's ready.
  const dataAccessHelper = await new Promise((resolve) => {
    const helper = DataAccessHelper.get('zip', {
      zipContent,
      callback: () => resolve(helper),
    });
  });

  // 3. The root index.json is the *scene* manifest (one entry per actor),
  // not a dataset itself — find the item's own index.json inside the zip.
  const sceneDescription = await dataAccessHelper.fetchJSON({}, 'index.json');
  const item = sceneDescription.scene[0];
  const itemUrl = `${item[item.type].url}/index.json`;

  // 4. Read that item's index.json as an actual polydata dataset.
  const reader = vtkHttpDataSetReader.newInstance({ dataAccessHelper });
  await reader.setUrl(itemUrl, { loadData: true });

  const polydata = reader.getOutputData();
  cutter.setInputData(polydata);
  cutter.setCutFunction(plane);

  const normals = [
    [1.0, 0.0, 0.0],
    [1.0, 0.0, 0.0],
    [1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0],
    [1.0, 1.0, 1.0],
  ];
  const origins = [
    [0.0, 0.0, 0.0],
    [-100.0, 0.0, 0.0],
    [1.2, 0.0, 0.0],
    [0.0, 0.0, -0.7],
    [0.0, 5.0, 0.0],
  ];
  const expectedNbLoops = [2, 0, 3, 1, 3];

  for (let i = 0; i < expectedNbLoops.length; i++) {
    plane.setNormal(...normals[i]);
    plane.setOrigin(...origins[i]);
    const cutterOutput = cutter.getOutputData();
    cutterOutput.buildLinks();
    const loopExtractor = vtkContourLoopExtraction.newInstance();
    loopExtractor.setInputData(cutterOutput);
    const outputData = loopExtractor.getOutputData();
    expect(outputData.getLines().getNumberOfCells(), 'number of loops').toBe(
      expectedNbLoops[i]
    );
  }
});
