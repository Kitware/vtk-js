from __future__ import print_function
import sys, json, os, math, gzip, shutil, argparse, hashlib

from paraview import simple
from paraview.vtk import *
import sys

if sys.version_info[0] == 3:
    buffer = memoryview

# -----------------------------------------------------------------------------

arrayTypesMapping = '  bBhHiIlLfdL' # last one is idtype

jsMapping = {
    'b': 'Int8Array',
    'B': 'Uint8Array',
    'h': 'Int16Array',
    'H': 'Uint16Array',
    'i': 'Int32Array',
    'I': 'Uint32Array',
    'l': 'Int32Array',
    'L': 'Uint32Array',
    'f': 'Float32Array',
    'd': 'Float64Array'
}

writerMapping = {}

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
  ref['encode'] = 'BigEndian' if sys.byteorder == 'big' else 'LittleEndian'
  ref['basepath'] = destDirectory
  return ref

# -----------------------------------------------------------------------------

def dumpStringArray(datasetDir, dataDir, array, root = {}, compress = True):
  if not array:
    return None

  stringArray = []
  arraySize = array.GetNumberOfTuples()
  for i in range(arraySize):
    stringArray.append(array.GetValue(i))

  strData = json.dumps(stringArray)

  pMd5 = hashlib.md5(strData).hexdigest()
  pPath = os.path.join(dataDir, pMd5)
  with open(pPath, 'wb') as f:
    f.write(strData)

  if compress:
    with open(pPath, 'rb') as f_in, gzip.open(os.path.join(dataDir, pMd5 + '.gz'), 'wb') as f_out:
      shutil.copyfileobj(f_in, f_out)
      f_in.close()
      os.remove(pPath)

  root['ref'] = getRef(os.path.relpath(dataDir, datasetDir), pMd5)
  root['vtkClass'] = 'vtkStringArray'
  root['name'] = array.GetName()
  root['dataType'] = 'JSON'
  root['numberOfComponents'] = array.GetNumberOfComponents()
  root['size'] = array.GetNumberOfComponents() * array.GetNumberOfTuples()

  return root

# -----------------------------------------------------------------------------

def dumpDataArray(datasetDir, dataDir, array, root = {}, compress = True):
  if not array:
    return None

  if array.GetDataType() == 12:
    # IdType need to be converted to Uint32
    arraySize = array.GetNumberOfTuples() * array.GetNumberOfComponents()
    newArray = vtkTypeUInt32Array()
    newArray.SetNumberOfTuples(arraySize)
    for i in range(arraySize):
      newArray.SetValue(i, -1 if array.GetValue(i) < 0 else array.GetValue(i))
    pBuffer = buffer(newArray)
  else:
    pBuffer = buffer(array)

  pMd5 = hashlib.md5(pBuffer).hexdigest()
  pPath = os.path.join(dataDir, pMd5)
  with open(pPath, 'wb') as f:
    f.write(pBuffer)

  if compress:
    with open(pPath, 'rb') as f_in, gzip.open(os.path.join(dataDir, pMd5 + '.gz'), 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)
        f_in.close()
        os.remove(pPath)

  # print array
  # print array.GetName(), '=>', jsMapping[arrayTypesMapping[array.GetDataType()]]

  root['ref'] = getRef(os.path.relpath(dataDir, datasetDir), pMd5)
  root['vtkClass'] = 'vtkDataArray'
  root['name'] = array.GetName()
  root['dataType'] = jsMapping[arrayTypesMapping[array.GetDataType()]]
  root['numberOfComponents'] = array.GetNumberOfComponents()
  root['size'] = array.GetNumberOfComponents() * array.GetNumberOfTuples()
  root['ranges'] = []
  if root['numberOfComponents'] > 1:
    for i in range(root['numberOfComponents']):
      root['ranges'].append(getRangeInfo(array, i))
    root['ranges'].append(getRangeInfo(array, -1))
  else:
    root['ranges'].append(getRangeInfo(array, 0))

  return root

# -----------------------------------------------------------------------------

def dumpAttributes(datasetDir, dataDir, dataset, root = {}, compress = True):
  # PointData
  _pointData = root['pointData'] = { "vtkClass": "vtkDataSetAttributes", "arrays": [] }
  _nbFields = dataset.GetPointData().GetNumberOfArrays()
  for i in range(_nbFields):
    array = dataset.GetPointData().GetArray(i)
    abstractArray = dataset.GetPointData().GetAbstractArray(i)
    if array:
      _array = dumpDataArray(datasetDir, dataDir, array, {}, compress)
      if _array:
        if (root['vtkClass'] == 'vtkImageData'):
          _array['ref']['registration']="setScalars"

        _pointData['arrays'].append({ "data": _array })
    elif abstractArray:
      _array = dumpStringArray(datasetDir, dataDir, abstractArray, {}, compress)
      if _array:
        _pointData['arrays'].append({ "data": _array })

  # CellData
  _cellData = root['cellData'] = { "vtkClass": "vtkDataSetAttributes", "arrays": [] }
  _nbFields = dataset.GetCellData().GetNumberOfArrays()
  for i in range(_nbFields):
    array = dataset.GetCellData().GetArray(i)
    abstractArray = dataset.GetCellData().GetAbstractArray(i)
    if array:
      _array = dumpDataArray(datasetDir, dataDir, array, {}, compress)
      if _array:
        _cellData['arrays'].append({ "data": _array })
    elif abstractArray:
      _array = dumpStringArray(datasetDir, dataDir, abstractArray, {}, compress)
      if _array:
        _cellData['arrays'].append({ "data": _array })

  # FieldData
  _fieldData = root['FieldData'] = { "vtkClass": "vtkDataSetAttributes", "arrays": [] }
  _nbFields = dataset.GetFieldData().GetNumberOfArrays()
  for i in range(_nbFields):
    array = dataset.GetFieldData().GetArray(i)
    abstractArray = dataset.GetFieldData().GetAbstractArray(i)
    if array:
      _array = dumpDataArray(datasetDir, dataDir, array, {}, compress)
      if _array:
        _fieldData['arrays'].append({ "data": _array })
    elif abstractArray:
      _array = dumpStringArray(datasetDir, dataDir, abstractArray, {}, compress)
      if _array:
        _fieldData['arrays'].append({ "data": _array })
  return root

# -----------------------------------------------------------------------------

def dumpPolyData(datasetDir, dataDir, dataset, container = {}, compress = True):
  container['vtkClass'] = 'vtkPolyData'

  # Points
  points = dumpDataArray(datasetDir, dataDir, dataset.GetPoints().GetData(), {}, compress)
  container['points'] = points
  container['points']['vtkClass'] = 'vtkPoints'
  container['points']['numberOfComponents'] = 3

  # Cells
  _cells = container

  ## Verts
  if dataset.GetVerts() and dataset.GetVerts().GetData().GetNumberOfTuples() > 0:
    _verts = dumpDataArray(datasetDir, dataDir, dataset.GetVerts().GetData(), {}, compress)
    _verts['name'] = '_verts'
    _cells['verts'] = _verts
    _cells['verts']['vtkClass'] = 'vtkCellArray'

  ## Lines
  if dataset.GetLines() and dataset.GetLines().GetData().GetNumberOfTuples() > 0:
    _lines = dumpDataArray(datasetDir, dataDir, dataset.GetLines().GetData(), {}, compress)
    _lines['name'] = '_lines'
    _cells['lines'] = _lines
    _cells['lines']['vtkClass'] = 'vtkCellArray'

  ## Polys
  if dataset.GetPolys() and dataset.GetPolys().GetData().GetNumberOfTuples() > 0:
    _polys = dumpDataArray(datasetDir, dataDir, dataset.GetPolys().GetData(), {}, compress)
    _polys['name'] = '_polys'
    _cells['polys'] = _polys
    _cells['polys']['vtkClass'] = 'vtkCellArray'

  ## Strips
  if dataset.GetStrips() and dataset.GetStrips().GetData().GetNumberOfTuples() > 0:
    _strips = dumpDataArray(datasetDir, dataDir, dataset.GetStrips().GetData(), {}, compress)
    _strips['name'] = '_strips'
    _cells['strips'] = _strips
    _cells['strips']['vtkClass'] = 'vtkCellArray'

  # Attributes (PointData, CellData, FieldData)
  dumpAttributes(datasetDir, dataDir, dataset, container, compress)

  return container

# -----------------------------------------------------------------------------
writerMapping['vtkPolyData'] = dumpPolyData
# -----------------------------------------------------------------------------

def dumpUnstructuredGrid(datasetDir, dataDir, dataset, container = {}, compress = True):
  container['vtkClass'] = 'vtkUnstructuredGrid'

  # Points
  points = dumpDataArray(datasetDir, dataDir, dataset.GetPoints().GetData(), {}, compress)
  points['name'] = '_points'
  container['points'] = points
  container['points']['vtkClass'] = 'vtkPoints'

  # Cells
  container['cells'] = dumpDataArray(datasetDir, dataDir, dataset.GetCells().GetData(), {}, compress)
  container['cells']['vtkClass'] = 'vtkCellArray'

  # CellTypes
  container['cellTypes'] = dumpDataArray(datasetDir, dataDir, dataset.GetCellTypesArray(), {}, compress)

  # Attributes (PointData, CellData, FieldData)
  dumpAttributes(datasetDir, dataDir, dataset, container, compress)

  return container

# -----------------------------------------------------------------------------
writerMapping['vtkUnstructuredGrid'] = dumpUnstructuredGrid
# -----------------------------------------------------------------------------

def dumpImageData(datasetDir, dataDir, dataset, container = {}, compress = True):
  container['vtkClass'] = 'vtkImageData'

  # Origin / Spacing / Dimension
  container['origin'] = tuple(dataset.GetOrigin())
  container['spacing'] = tuple(dataset.GetSpacing())
  container['extent'] = tuple(dataset.GetExtent())

  # Attributes (PointData, CellData, FieldData)
  dumpAttributes(datasetDir, dataDir, dataset, container, compress)

  return container

# -----------------------------------------------------------------------------
writerMapping['vtkImageData'] = dumpImageData
# -----------------------------------------------------------------------------

def dumpRectilinearGrid(datasetDir, dataDir, dataset, container = {}, compress = True):
  container['vtkClass'] = 'vtkRectilinearGrid'

  # Dimensions
  container['dimensions'] = tuple(dataset.GetDimensions())

  # X, Y, Z
  container['xCoordinates'] = dumpDataArray(datasetDir, dataDir, dataset.GetXCoordinates(), {}, compress)
  container['yCoordinates'] = dumpDataArray(datasetDir, dataDir, dataset.GetYCoordinates(), {}, compress)
  container['zCoordinates'] = dumpDataArray(datasetDir, dataDir, dataset.GetZCoordinates(), {}, compress)

  # Attributes (PointData, CellData, FieldData)
  dumpAttributes(datasetDir, dataDir, dataset, container, compress)

  return container

# -----------------------------------------------------------------------------
writerMapping['vtkRectilinearGrid'] = dumpRectilinearGrid
# -----------------------------------------------------------------------------

def dumpTable(datasetDir, dataDir, dataset, container = {}, compress = True):
  container['vtkClass'] = 'vtkTable'

  # Columns
  _columns = container['Columns'] = {}
  _nbFields = dataset.GetNumberOfColumns()
  for i in range(_nbFields):
    array = dumpDataArray(datasetDir, dataDir, dataset.GetColumn(i), {}, compress)
    if array:
      _columns[array['name']] = array

  return container

# -----------------------------------------------------------------------------
writerMapping['vtkTable'] = dumpTable
# -----------------------------------------------------------------------------

def dumpMultiBlock(datasetDir, dataDir, dataset, container = {}, compress = True):
  container['vtkClass'] = 'vtkMultiBlock'

  _blocks = container['Blocks'] = {}
  _nbBlocks = dataset.GetNumberOfBlocks()
  for i in range(_nbBlocks):
    name = dataset.GetMetaData(i).Get(vtkCompositeDataSet.NAME())
    blockDataset = dataset.GetBlock(i)
    if blockDataset:
      writer = writerMapping[blockDataset.GetClassName()]
      if writer:
        _blocks[name] = writer(datasetDir, dataDir, blockDataset, {}, compress)
      else:
        _blocks[name] = blockDataset.GetClassName()

  return container

# -----------------------------------------------------------------------------
writerMapping['vtkMultiBlockDataSet'] = dumpMultiBlock
# -----------------------------------------------------------------------------

def writeDataSet(filePath, dataset, outputDir, newDSName = None, compress = True):
  fileName = newDSName if newDSName else os.path.basename(filePath)
  datasetDir = os.path.join(outputDir, fileName)
  dataDir = os.path.join(datasetDir, 'data')

  if not os.path.exists(dataDir):
    os.makedirs(dataDir)

  root = {}
  root['metadata'] = {}
  root['metadata']['name'] = fileName

  writer = writerMapping[dataset.GetClassName()]
  if writer:
    writer(datasetDir, dataDir, dataset, root, compress)
  else:
    print (dataObject.GetClassName(), 'is not supported')

  with open(os.path.join(datasetDir, "index.json"), 'w') as f:
    f.write(json.dumps(root, indent=2))

# -----------------------------------------------------------------------------

def writeTimeDataSource(filePath, datasource, sourceToExport, outputDir, newDSName = None, compress = True):
  fileName = newDSName if newDSName else os.path.basename(filePath)
  datasetDir = os.path.join(outputDir, fileName)
  dataDir = os.path.join(datasetDir, 'data')

  if not os.path.exists(dataDir):
    os.makedirs(dataDir)

  root = {}
  root['metadata'] = {}
  root['metadata']['name'] = fileName
  root['type'] = 'Parametric'
  container = root['Parametric'] = {}
  _params = container['parameters'] = { 'time': [ '%02d' % idx for idx in range(len(datasource.TimestepValues))] }
  _refs = container['refs'] = { 'dataset': { 'id': '{time}/index.json', 'pattern': True, 'basepath': '', 'encode': 'JSON' } }


  for idx in range(len(datasource.TimestepValues)):
    t = datasource.TimestepValues[idx]
    sourceToExport.UpdatePipeline(t)
    ds = sourceToExport.GetClientSideObject().GetOutputDataObject(0)
    writer = writerMapping[ds.GetClassName()]
    if writer:
      dsDir = os.path.join(datasetDir, "%02d" % idx)
      dsFileName = os.path.join(dsDir, "index.json")
      if not os.path.exists(dsDir):
        os.makedirs(dsDir)
      with open(dsFileName, 'w') as f:
        f.write(json.dumps(writer(dsDir, dataDir, ds, {}, compress), indent=2))
    else:
      print (dataObject.GetClassName(), 'is not supported')


  with open(os.path.join(datasetDir, "index.json"), 'w') as f:
    f.write(json.dumps(root, indent=2))

# -----------------------------------------------------------------------------

def convert(inputFile, outputDir, merge = False, extract = False, newName = None):
  print (inputFile, outputDir)
  reader = simple.OpenDataFile(inputFile)
  activeSource = reader

  if merge:
    activeSource = simple.MergeBlocks(activeSource)

  if extract:
    activeSource = simple.ExtractSurface(activeSource)

  activeSource.UpdatePipeline()
  dataObject = activeSource.GetClientSideObject().GetOutputDataObject(0)

  if 'TimestepValues' in reader.ListProperties():
    if len(reader.TimestepValues) == 0:
      writeDataSet(inputFile, dataObject, outputDir, newName)
    else:
      writeTimeDataSource(inputFile, reader, activeSource, outputDir, newName)
  else:
    writeDataSet(inputFile, dataObject, outputDir, newName)


# -----------------------------------------------------------------------------

def sample(dataDir, outputDir):
  convert(os.path.join(dataDir, 'Data/bot2.wrl'), outputDir, True, True)
  convert(os.path.join(dataDir, 'Data/can.ex2'), outputDir)
  convert(os.path.join(dataDir, 'Data/can.ex2'), outputDir, True, True, 'can_MS.ex2')
  convert(os.path.join(dataDir, 'Data/can.ex2'), outputDir, True, False, 'can_M.ex2')
  convert(os.path.join(dataDir, 'Data/can.ex2'), outputDir, False, True, 'can_S.ex2')
  convert(os.path.join(dataDir, 'Data/disk_out_ref.ex2'), outputDir, True, False, 'disk_out_ref_M.ex2')
  convert(os.path.join(dataDir, 'Data/disk_out_ref.ex2'), outputDir)
  convert(os.path.join(dataDir, 'Data/RectGrid2.vtk'), outputDir)

  # Create image data based on the Wavelet source
  wavelet = simple.Wavelet()
  wavelet.UpdatePipeline()
  imageData = wavelet.GetClientSideObject().GetOutputDataObject(0)
  writeDataSet('Wavelet.vti', imageData, outputDir)

  # Create a table based on the disk_out_ref
  diskout = simple.ExtractSurface(simple.MergeBlocks(simple.OpenDataFile(os.path.join(dataDir, 'Data/disk_out_ref.ex2'))))
  diskout.UpdatePipeline()
  unstructuredGrid = diskout.GetClientSideObject().GetOutputDataObject(0)
  table = vtkTable()
  _nbFields = unstructuredGrid.GetPointData().GetNumberOfArrays()
  for i in range(_nbFields):
    table.AddColumn(unstructuredGrid.GetPointData().GetArray(i))
  writeDataSet('table', table, outputDir)

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
