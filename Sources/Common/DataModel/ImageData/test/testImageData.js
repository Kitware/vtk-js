import test from 'tape-catch';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';

test('Test vtkImageData instance', (t) => {
  t.ok(vtkImageData, 'Make sure the class definition exists');
  const instance = vtkImageData.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkImageData histogram', (t) => {
  const spacing = 0.7;
  const size = 50;
  const compareFloat = (a, b) => Math.abs(a - b) < Number.EPSILON;

  const source = vtkRTAnalyticSource.newInstance();
  source.setWholeExtent([0, size, 0, size, 0, size]);
  source.update();

  const image = source.getOutputData();
  image.setSpacing([spacing, spacing, spacing]);

  const bounds = image.getBounds();
  const hist = image.computeHistogram(bounds);

  const baseline1 = {
    minimum: 9,
    maximum: 185,
    average: 64.65,
    variance: 782.87,
    sigma: 27.98,
    count: 132651,
  };

  t.ok(
    hist.minimum === baseline1.minimum,
    'computeHistogram return value test: minimum'
  );
  t.ok(
    hist.maximum === baseline1.maximum,
    'computeHistogram return value test: maximum'
  );
  t.ok(
    compareFloat(hist.average.toFixed(2), baseline1.average),
    'computeHistogram return value test: average'
  );
  t.ok(
    compareFloat(hist.variance.toFixed(2), baseline1.variance),
    'computeHistogram return value test: variance'
  );
  t.ok(
    compareFloat(hist.sigma.toFixed(2), baseline1.sigma),
    'computeHistogram return value test: sigma'
  );
  t.ok(
    hist.count === baseline1.count,
    'computeHistogram return value test: count'
  );

  // masking function that ignores the bottom 10 and top 10 rows of voxels.
  const voxelFunc = (idx) => idx[0] > 9 && idx[0] < 40;

  const baseline2 = {
    minimum: 9,
    maximum: 173,
    average: 65.29,
    variance: 676.51,
    sigma: 26.01,
    count: 78030,
  };

  const histWithMask = image.computeHistogram(bounds, voxelFunc);

  t.ok(
    histWithMask.minimum === baseline2.minimum &&
      histWithMask.maximum === baseline2.maximum &&
      compareFloat(histWithMask.average.toFixed(2), baseline2.average) &&
      compareFloat(histWithMask.variance.toFixed(2), baseline2.variance) &&
      compareFloat(histWithMask.sigma.toFixed(2), baseline2.sigma) &&
      histWithMask.count === baseline2.count,
    'computeHistogram test with masking function'
  );

  const voxelFuncNone = (idx) => false;
  const baseline3 = {
    minimum: Infinity,
    maximum: -Infinity,
    average: 0,
    variance: 0,
    sigma: 0,
    count: 0,
  };
  const histNone = image.computeHistogram(bounds, voxelFuncNone);

  t.ok(
    histNone.minimum === baseline3.minimum &&
      histNone.maximum === baseline3.maximum &&
      compareFloat(histNone.average.toFixed(2), baseline3.average) &&
      compareFloat(histNone.variance.toFixed(2), baseline3.variance) &&
      compareFloat(histNone.sigma.toFixed(2), baseline3.sigma) &&
      histNone.count === baseline3.count,
    'computeHistogram test with zero number of voxels that qualify'
  );

  t.end();
});
