import 'vtk.js/Sources/favicon';

import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkXMLImageDataWriter from 'vtk.js/Sources/IO/XML/XMLImageDataWriter';

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const writer = vtkXMLImageDataWriter.newInstance();
writer.setInputConnection(reader.getOutputPort());

reader
  .setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`, { loadData: true })
  .then(() => {
    const fileContents = writer.write(reader.getOutputData());
    const blob = new Blob([fileContents], { type: 'text/plain' });
    const a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(blob, { type: 'text/plain' });
    a.download = `headsq.vti`;
    document.body.appendChild(a);
    a.click(); // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
    document.body.removeChild(a);
  });

global.writer = writer;
