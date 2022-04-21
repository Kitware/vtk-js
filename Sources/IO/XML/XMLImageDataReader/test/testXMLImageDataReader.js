import test from 'tape-catch';
import vtkXMLImageDataReader from '../index';

test('Test XML data is read correctly', (t) => {
  const expectedOrigin = [10, 20, 30];
  const expectedSpacing = [0.5, 1.5, 2.0];
  const expectedDirection = [-1, 0, 0, 0, 1, 0, 0, 0, -1];

  const fileContent = `
  <?xml version="1.0"?>
  <VTKFile type="ImageData" version="0.1" byte_order="LittleEndian" header_type="UInt32" compressor="vtkZLibDataCompressor">
    <ImageData WholeExtent="0 -1 0 -1 0 -1" Origin="10 20 30" Spacing="0.5 1.5 2.0" Direction="-1 0 0 0 1 0 0 0 -1">
      <Piece Extent="0 -1 0 -1 0 -1"                                                    >
        <PointData>
        </PointData>
        <CellData>
        </CellData>
    </Piece>
  </ImageData>
  <AppendedData encoding="base64">
   _
  </AppendedData>
  </VTKFile>
  `;

  const enc = new TextEncoder();
  const arrayBuffer = enc.encode(fileContent);

  const reader = vtkXMLImageDataReader.newInstance();

  reader.parseAsArrayBuffer(arrayBuffer);
  const imageData = reader.getOutputData();

  t.ok(
    imageData.getOrigin().join('') === expectedOrigin.join(''),
    'Make sure the origin is correct.'
  );

  t.ok(
    imageData.getSpacing().join('') === expectedSpacing.join(''),
    'Make sure the spacing is correct.'
  );

  t.ok(
    imageData.getDirection().join('') === expectedDirection.join(''),
    'Make sure the direction is correct.'
  );

  t.end();
});
