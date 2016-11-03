
### ----------------------------------------------------------------------- ###
###                       Configure output location                         ###
###
### A top-level export directory will be created (if necessary) and used to
### store all exported scenes.  Use the EXPORT_DIRECTORY pattern below to
### customize where this directory should be.  Automatic replacement will
### be done on the following variables if they appear in the pattern:
###
###   ${USER_HOME} : Will be replaced by the current user's home directory
### ----------------------------------------------------------------------- ###

EXPORT_DIRECTORY = '${USER_HOME}/vtkJsExport'
FILENAME_EXTENSION = '.vtkjs'

### ----------------------------------------------------------------------- ###
###                   Convenience methods and definitions                   ###
### ----------------------------------------------------------------------- ###

import sys, os, re, time, errno, json, math, gzip, shutil, argparse, hashlib

import zipfile

from paraview import simple
from paraview.vtk import *

try:
  from vtk.vtkFiltersGeometryPython import vtkCompositeDataGeometryFilter
  from vtk.vtkCommonCorePython import vtkUnsignedCharArray
except:
  from vtkFiltersGeometryPython import vtkCompositeDataGeometryFilter
  from vtkCommonCorePython import vtkUnsignedCharArray

USER_HOME = os.path.expanduser('~')
ROOT_OUTPUT_DIRECTORY = EXPORT_DIRECTORY.replace('${USER_HOME}', USER_HOME)
ROOT_OUTPUT_DIRECTORY = os.path.normpath(ROOT_OUTPUT_DIRECTORY)

arrayTypesMapping = '  bBhHiIlLfdL' # last one is idtype

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
        os.remove(pPath)

  root['ref'] = getRef(os.path.relpath(dataDir, datasetDir), pMd5)
  root['type'] = 'vtkDataArray'
  root['name'] = array.GetName()
  root['dataType'] = jsMapping[arrayTypesMapping[array.GetDataType()]]
  root['tuple'] = array.GetNumberOfComponents()
  root['size'] = array.GetNumberOfComponents() * array.GetNumberOfTuples()
  root['ranges'] = []
  if root['tuple'] > 1:
    for i in range(root['tuple']):
      root['ranges'].append(getRangeInfo(array, i))
    root['ranges'].append(getRangeInfo(array, -1))
  else:
    root['ranges'].append(getRangeInfo(array, 0))

  return root

# -----------------------------------------------------------------------------

def dumpColorArray(datasetDir, dataDir, colorArrayInfo, root = {}, compress = True):
  root['PointData'] = {}
  root['CellData'] = {}
  root['FieldData'] = {}

  colorArray = colorArrayInfo['colorArray']
  location = colorArrayInfo['location']

  dumpedArray = dumpDataArray(datasetDir, dataDir, colorArray, {}, compress)

  if dumpedArray:
    root[location][dumpedArray['name']] = dumpedArray

  return root

# -----------------------------------------------------------------------------

def dumpPolyData(datasetDir, dataDir, dataset, colorArrayInfo, root = {}, compress = True):
  root['type'] = 'vtkPolyData'
  container = root['vtkPolyData'] = {}

  # Points
  points = dumpDataArray(datasetDir, dataDir, dataset.GetPoints().GetData(), {}, compress)
  points['name'] = '_points'
  points['bounds'] = dataset.GetPoints().GetBounds()
  container['Points'] = points
  # FIXME range...

  # Cells
  _cells = container

  ## Verts
  if dataset.GetVerts() and dataset.GetVerts().GetData().GetNumberOfTuples() > 0:
    _verts = dumpDataArray(datasetDir, dataDir, dataset.GetVerts().GetData(), {}, compress)
    _verts['name'] = '_verts'
    _cells['Verts'] = _verts

  ## Lines
  if dataset.GetLines() and dataset.GetLines().GetData().GetNumberOfTuples() > 0:
    _lines = dumpDataArray(datasetDir, dataDir, dataset.GetLines().GetData(), {}, compress)
    _lines['name'] = '_lines'
    _cells['Lines'] = _lines

  ## Polys
  if dataset.GetPolys() and dataset.GetPolys().GetData().GetNumberOfTuples() > 0:
    _polys = dumpDataArray(datasetDir, dataDir, dataset.GetPolys().GetData(), {}, compress)
    _polys['name'] = '_polys'
    _cells['Polys'] = _polys

  ## Strips
  if dataset.GetStrips() and dataset.GetStrips().GetData().GetNumberOfTuples() > 0:
    _strips = dumpDataArray(datasetDir, dataDir, dataset.GetStrips().GetData(), {}, compress)
    _strips['name'] = '_strips'
    _cells['Strips'] = _strips

  dumpColorArray(datasetDir, dataDir, colorArrayInfo, container, compress)

  return root

# -----------------------------------------------------------------------------
writerMapping['vtkPolyData'] = dumpPolyData
# -----------------------------------------------------------------------------

def writeDataSet(filePath, dataset, outputDir, colorArrayInfo, newDSName = None, compress = True):
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
    writer(datasetDir, dataDir, dataset, colorArrayInfo, root, compress)
  else:
    print dataObject.GetClassName(), 'is not supported'

  with open(os.path.join(datasetDir, "index.json"), 'w') as f:
    f.write(json.dumps(root, indent=2))

  return datasetDir

# -----------------------------------------------------------------------------

def generateSceneName():
  srcs = simple.GetSources()

  nameParts = []
  for key, val in srcs.items():
    proxyGroup = val.SMProxy.GetXMLGroup()
    if 'sources' in proxyGroup:
      nameParts.append(key[0])
  fileName = '-'.join(nameParts)

  sceneName = '%s' % fileName
  counter = 0
  while os.path.isfile(os.path.join(ROOT_OUTPUT_DIRECTORY, '%s%s' % (sceneName, FILENAME_EXTENSION))):
    counter += 1
    sceneName = '%s (%d)' % (fileName, counter)

  return sceneName

### ----------------------------------------------------------------------- ###
###                          Main script contents                           ###
### ----------------------------------------------------------------------- ###

def mkdir_p(path):
  try:
    os.makedirs(path)
  except OSError as exc:  # Python >2.5
    if exc.errno == errno.EEXIST and os.path.isdir(path):
      pass
    else:
      raise

# Generate timestamp and use it to make subdirectory within the top level output dir
timeStamp = time.strftime("%a-%d-%b-%Y-%H-%M-%S")
outputDir = os.path.join(ROOT_OUTPUT_DIRECTORY, timeStamp)
mkdir_p(outputDir)

doCompressArrays = False

# Get the active view and render window, use it to iterate over renderers
activeView = simple.GetActiveView()
renderWindow = activeView.GetRenderWindow()
renderers = renderWindow.GetRenderers()

scDirs = []
sceneComponents = []
componentIndex = 0

for rIdx in xrange(renderers.GetNumberOfItems()):
  renderer = renderers.GetItemAsObject(rIdx)
  renProps = renderer.GetViewProps()
  for rpIdx in xrange(renProps.GetNumberOfItems()):
    renProp = renProps.GetItemAsObject(rpIdx)
    if not renProp.GetVisibility():
      continue
    if hasattr(renProp, 'GetMapper'):
      mapper = renProp.GetMapper()
      dataObject = mapper.GetInputDataObject(0, 0);
      dataset = None

      if dataObject.IsA('vtkCompositeDataSet'):
        dataMTime = dataObject.GetMTime()
        gf = vtkCompositeDataGeometryFilter()
        gf.SetInputData(dataObject)
        gf.Update()
        tempDS = gf.GetOutput()
        dataset = tempDS
      else:
        dataset = mapper.GetInput()

      if dataset and dataset.GetPoints():
        componentName = '%d' % componentIndex
        scalarVisibility = mapper.GetScalarVisibility()
        arrayAccessMode = mapper.GetArrayAccessMode()
        colorArrayName = mapper.GetArrayName() if arrayAccessMode == 1 else mapper.GetArrayId()
        colorMode = mapper.GetColorMode()
        scalarMode = mapper.GetScalarMode()
        lookupTable = mapper.GetLookupTable()

        dsAttrs = None
        arrayLocation = ''

        if scalarVisibility:
          if scalarMode == 3 or scalarMode == 1: # VTK_SCALAR_MODE_USE_POINT_FIELD_DATA or VTK_SCALAR_MODE_USE_POINT_DATA
            dsAttrs = dataset.GetPointData()
            arrayLocation = 'PointData'
          elif scalarMode == 4 or scalarMode == 2: # VTK_SCALAR_MODE_USE_CELL_FIELD_DATA or VTK_SCALAR_MODE_USE_CELL_DATA
            dsAttrs = dataset.GetCellData()
            arrayLocation = 'CellData'

        colorArray = None
        dataArray = None

        if dsAttrs:
            dataArray = dsAttrs.GetArray(colorArrayName)

        if dataArray:
          # component = -1 => let specific instance get scalar from vector before mapping
          colorArray = lookupTable.MapScalars(dataArray, colorMode, -1);
          colorArrayName = '__CustomRGBColorArray__'
          colorArray.SetName(colorArrayName)
          colorMode = 0
        else:
          colorArrayName = ''

        colorArrayInfo = {
          'colorArray': colorArray,
          'location': arrayLocation
        }

        scDirs.append(writeDataSet('', dataset, outputDir, colorArrayInfo, newDSName=componentName, compress=doCompressArrays))
        componentIndex += 1

        representation = renProp.GetProperty().GetRepresentation() if hasattr(renProp, 'GetProperty') else 2
        colorToUse = renProp.GetProperty().GetDiffuseColor() if hasattr(renProp, 'GetProperty') else [1, 1, 1]
        if representation == 1:
            colorToUse = renProp.GetProperty().GetColor() if hasattr(renProp, 'GetProperty') else [1, 1, 1]
        pointSize = renProp.GetProperty().GetPointSize() if hasattr(renProp, 'GetProperty') else 1.0

        sceneComponents.append({
          "type": "httpDataSetReader",
          "httpDataSetReader": {
            "url": componentName
          },
          "mapper": {
            "colorByArrayName": colorArrayName,
            "colorMode": colorMode,
            "scalarMode": scalarMode
          },
          "property": {
            "representation": representation,
            "diffuseColor": colorToUse,
            "pointSize": pointSize
          },
          "lookupTable": {
            "tableRange": lookupTable.GetRange(),
            "hueRange": lookupTable.GetHueRange() if hasattr(lookupTable, 'GetHueRange') else [0.5, 0]
          }
        })

cameraClippingRange = activeView.GetActiveCamera().GetClippingRange()

sceneDescription = {
  "fetchGzip": doCompressArrays,
  "background": activeView.Background.GetData(),
  "camera": {
    "focalPoint": activeView.CameraFocalPoint.GetData(),
    "position": activeView.CameraPosition.GetData(),
    "viewUp": activeView.CameraViewUp.GetData(),
    "clippingRange": [ elt for elt in cameraClippingRange ]
  },
  "centerOfRotation": activeView.CenterOfRotation.GetData(),
  "scene": sceneComponents
}

indexFilePath = os.path.join(outputDir, 'index.json')
with open(indexFilePath, 'w') as outfile:
  json.dump(sceneDescription, outfile, indent=4)

# -----------------------------------------------------------------------------

# Now zip up the results and get rid of the temp directory

sceneName = generateSceneName()
sceneFileName = os.path.join(ROOT_OUTPUT_DIRECTORY, '%s%s' % (sceneName, FILENAME_EXTENSION))

try:
  import zlib
  compression = zipfile.ZIP_DEFLATED
except:
  compression = zipfile.ZIP_STORED

zf = zipfile.ZipFile(sceneFileName, mode='w')

try:
  for dirName, subdirList, fileList in os.walk(outputDir):
    for fname in fileList:
      fullPath = os.path.join(dirName, fname)
      relPath = '%s/%s' % (sceneName, os.path.relpath(fullPath, outputDir))
      zf.write(fullPath, arcname=relPath, compress_type=compression)
finally:
    zf.close()

shutil.rmtree(outputDir)

print 'Finished exporting dataset to: ',sceneFileName
