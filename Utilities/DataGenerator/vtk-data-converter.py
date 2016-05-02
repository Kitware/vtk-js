import json, os, math, gzip, shutil, argparse, hashlib

from paraview import simple

# -----------------------------------------------------------------------------

arrayTypesMapping = '  bBhHiIlLfdl' # last one is idtype (32/64 bit signed int)

jsMapping = {
    'b': 'Int8Array',
    'B': 'Uint8Array',
    'h': 'Int16Array',
    'H': 'Int16Array',
    'i': 'Int32Array',
    'I': 'Uint32Array',
    'l': 'Int32Array',
    'L': 'Uint32Array',
    'f': 'Float32Array',
    'd': 'Float64Array'
}

# -----------------------------------------------------------------------------

def getRangeInfo(array, component):
  r = array.GetRange(component)
  compRange = {}
  compRange['min'] = r[0]
  compRange['max'] = r[1]
  compRange['component'] = array.GetComponentName(component)
  return compRange

# -----------------------------------------------------------------------------

def getRef(destDirectory, md5):
  ref = {}
  ref['id'] = md5
  ref['encode'] = 'LittleEndian' # FIXME properly figure it out
  ref['basepath'] = destDirectory # FIXME extract just the subset
  return ref

# -----------------------------------------------------------------------------

def writeDataArray(destDirectory, array, basepath = None, compress = True):
  if not array:
    return None

  if array.GetClassName() == 'vtkCharArray':
    return None

  pBuffer = buffer(array)
  pMd5 = hashlib.md5(pBuffer).hexdigest()
  pPath = os.path.join(destDirectory, pMd5)
  with open(pPath, 'wb') as f:
    f.write(pBuffer)

  if compress:
    with open(pPath, 'rb') as f_in, gzip.open(os.path.join(destDirectory, pMd5 + '.gz'), 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)
        os.remove(pPath)

  # print array
  # print array.GetName(), '=>', jsMapping[arrayTypesMapping[array.GetDataType()]]

  metadata = {}
  metadata['ref'] = getRef(os.path.relpath(destDirectory, basepath), pMd5)
  metadata['type'] = 'DataArray'
  metadata['name'] = array.GetName()
  metadata['dataType'] = jsMapping[arrayTypesMapping[array.GetDataType()]]
  metadata['tuple'] = array.GetNumberOfComponents()
  metadata['size'] = array.GetNumberOfComponents() * array.GetNumberOfTuples()
  metadata['ranges'] = []
  if metadata['tuple'] > 1:
    for i in range(metadata['tuple']):
      metadata['ranges'].append(getRangeInfo(array, i))
    metadata['ranges'].append(getRangeInfo(array, -1))
  else:
    metadata['ranges'].append(getRangeInfo(array, 0))

  return metadata

# -----------------------------------------------------------------------------

def writePolyData(input, data, outputDir):
  datasetDir = os.path.join(outputDir, os.path.basename(input));
  dataDir = os.path.join(datasetDir, 'data');
  if not os.path.exists(dataDir):
    os.makedirs(dataDir)

  polyData = {}
  polyData['type'] = 'PolyData'
  polyData['PolyData'] = {}
  polyData['metadata'] = {}
  polyData['metadata']['name'] = os.path.basename(input)

  # Points
  points = writeDataArray(dataDir, data.GetPoints().GetData(), datasetDir)
  points['name'] = '_points'
  polyData['PolyData']['Points'] = points
  # FIXME range...

  # Cells
  _cells = polyData['PolyData']['Cells'] = {}

  ## Verts
  if data.GetVerts():
    _verts = writeDataArray(dataDir, data.GetVerts().GetData(), datasetDir)
    _verts['name'] = '_verts'
    _cells['Verts'] = _verts

  ## Lines
  if data.GetLines():
    _lines = writeDataArray(dataDir, data.GetLines().GetData(), datasetDir)
    _lines['name'] = '_lines'
    _cells['Lines'] = _lines

  ## Polys
  if data.GetPolys():
    _polys = writeDataArray(dataDir, data.GetPolys().GetData(), datasetDir)
    _polys['name'] = '_polys'
    _cells['Polys'] = _polys

  ## Strips
  if data.GetStrips():
    _strips = writeDataArray(dataDir, data.GetStrips().GetData(), datasetDir)
    _strips['name'] = '_strips'
    _cells['Strips'] = _strips

  # PointData
  _pointData = polyData['PolyData']['PointData'] = {}
  _nbFields = data.GetPointData().GetNumberOfArrays()
  for i in range(_nbFields):
    array = writeDataArray(dataDir, data.GetPointData().GetArray(i), datasetDir)
    if array:
      _pointData[array['name']] = array

  # CellData
  _cellData = polyData['PolyData']['CellData'] = {}
  _nbFields = data.GetCellData().GetNumberOfArrays()
  for i in range(_nbFields):
    array = writeDataArray(dataDir, data.GetCellData().GetArray(i), datasetDir)
    if array:
      _cellData[array['name']] = array

  # FieldData
  _fieldData = polyData['PolyData']['FieldData'] = {}
  _nbFields = data.GetFieldData().GetNumberOfArrays()
  for i in range(_nbFields):
    array = writeDataArray(dataDir, data.GetFieldData().GetArray(i), datasetDir)
    if array:
      _fieldData[array['name']] = array

  # Write polydata
  with open(os.path.join(datasetDir, "index.json"), 'w') as f:
    f.write(json.dumps(polyData, indent=2))

def writeImageData(input, data, outputDir):
  datasetDir = os.path.join(outputDir, os.path.basename(input));
  dataDir = os.path.join(datasetDir, 'data');
  if not os.path.exists(dataDir):
    os.makedirs(dataDir)

  imageData = {}
  imageData['type'] = 'ImageData'
  imageData['ImageData'] = {}
  imageData['metadata'] = {}
  imageData['metadata']['name'] = os.path.basename(input)

  # Origin / Spacing / Dimension
  imageData['ImageData']['Origin'] = tuple(data.GetOrigin())
  imageData['ImageData']['Spacing'] = tuple(data.GetSpacing())
  imageData['ImageData']['Dimensions'] = tuple(data.GetDimensions())

  # PointData
  _pointData = imageData['ImageData']['PointData'] = {}
  _nbFields = data.GetPointData().GetNumberOfArrays()
  for i in range(_nbFields):
    array = writeDataArray(dataDir, data.GetPointData().GetArray(i), datasetDir)
    if array:
      _pointData[array['name']] = array

  # CellData
  _cellData = imageData['ImageData']['CellData'] = {}
  _nbFields = data.GetCellData().GetNumberOfArrays()
  for i in range(_nbFields):
    array = writeDataArray(dataDir, data.GetCellData().GetArray(i), datasetDir)
    if array:
      _cellData[array['name']] = array

  # FieldData
  _fieldData = imageData['ImageData']['FieldData'] = {}
  _nbFields = data.GetFieldData().GetNumberOfArrays()
  for i in range(_nbFields):
    array = writeDataArray(dataDir, data.GetFieldData().GetArray(i), datasetDir)
    if array:
      _fieldData[array['name']] = array

  # Write polydata
  with open(os.path.join(datasetDir, "index.json"), 'w') as f:
    f.write(json.dumps(imageData, indent=2))

# -----------------------------------------------------------------------------

def convert(inputFile, outputDir, merge = False, extract = False):
  print inputFile, outputDir
  reader = simple.OpenDataFile(inputFile)
  activeSource = reader

  if merge:
    activeSource = simple.MergeBlocks(activeSource)

  if extract:
    activeSource = simple.ExtractSurface(activeSource)

  activeSource.UpdatePipeline()
  dataObject = activeSource.GetClientSideObject().GetOutputDataObject(0)

  if dataObject.GetClassName() == 'vtkPolyData':
    writePolyData(inputFile, dataObject, outputDir);
  else:
    print dataObject.GetClassName(), 'is not supported'

# -----------------------------------------------------------------------------

def sample(dataDir, outputDir):
  convert(os.path.join(dataDir, 'Data/bot2.wrl'), outputDir, True, True)
  convert(os.path.join(dataDir, 'Data/can.ex2'), outputDir, True, True)
  convert(os.path.join(dataDir, 'Data/disk_out_ref.ex2'), outputDir, True, True)

  # Create image data based on the Wavelet source
  wavelet = simple.Wavelet()
  wavelet.UpdatePipeline()
  imageData = wavelet.GetClientSideObject().GetOutputDataObject(0)
  writeImageData('Wavelet.vti', imageData, outputDir)

# =============================================================================
# Main: Parse args and start data conversion
# =============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Data conversion")
    parser.add_argument("--input", help="path to the file to convert", dest="input")
    parser.add_argument("--output", help="path to the directory where to write the output", dest="output")
    parser.add_argument("--merge", help="Merge multiblock into single dataset", default=False, action='store_true', dest="merge")
    parser.add_argument("--extract-surface", help="Extract surface mesh", default=False, action='store_true', dest="extract")
    parser.add_argument("--sample-data", help="Generate sample data from ParaView Data", dest="sample")

    args = parser.parse_args()

    if args.sample:
      sample(args.sample, args.output)
    else:
      convert(args.input, args.output, args.merge, args.extract)

