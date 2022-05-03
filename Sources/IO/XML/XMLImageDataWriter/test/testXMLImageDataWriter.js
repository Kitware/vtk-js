import test from 'tape-catch';
import vtkImageDataWriter from '../index';
import vtkImageData from '../../../../Common/DataModel/ImageData';

test('Test XML writer file content', (t) => {
  const expectedSubstring =
    '<ImageData WholeExtent="0 -1 0 -1 0 -1" Origin="10 20 30" Spacing="1 2 3" Direction="-1 0 0 0 1 0 0 0 -1">';

  const imageData = vtkImageData.newInstance();
  imageData.setOrigin([10, 20, 30]);
  imageData.setSpacing([1, 2, 3]);
  imageData.setDirection([-1, 0, 0, 0, 1, 0, 0, 0, -1]);

  const writer = vtkImageDataWriter.newInstance();
  const fileContents = writer.write(imageData);

  t.ok(
    fileContents.includes(expectedSubstring),
    'Make sure the XML file generated is correct.'
  );

  t.end();
});
