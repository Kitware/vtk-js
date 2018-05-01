# -----------------------------------------------------------------------------
# Provide custom camera positions
# -----------------------------------------------------------------------------

# viewForward = [1, 0, 0]
# viewUp = [0, 0, 1]
# positions = [
#     [91407.9, 5353.29, 9403.84],
#     [59956.2, 8877.66, 2108.12],
#     [59939.2, 9829.46, 1094.44],
#     [59822.9, 9504.44, 910.874],
#     [60882.7, 9179.76, 106.537],
#     [60798.3, 9176.3, 104.305],
#     [60668.4, 9145.44, 353.473],
#     [59574.5, 8689.16, 994.554],
#     [60944.5, 8277.07, 266.129],
#     [62056.1, 8983.65, 232.801]
# ]

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

EXPORT_DIRECTORY = '${USER_HOME}/pv-skybox'
FILENAME_EXTENSION = '.skybox'

### ----------------------------------------------------------------------- ###
###                   Convenience methods and definitions                   ###
### ----------------------------------------------------------------------- ###

import sys, os, re, gzip, shutil, zipfile, time

from paraview import simple
from paraview.web.dataset_builder import ImageDataSetBuilder
from vtk.vtkRenderingCore import vtkLight

# -----------------------------------------------------------------------------
# Configure view
# -----------------------------------------------------------------------------

view = simple.GetRenderView()
view.ViewSize = [1024, 1024]
view.OrientationAxesVisibility = 0

try:
    viewForward
except NameError:
    p = tuple(view.CameraPosition)
    fp = tuple(view.CameraFocalPoint)
    viewForward = [fp[i] - p[i] for i in range(3)]

try:
    viewUp
except NameError:
    viewUp = tuple(view.CameraViewUp)

try:
    positions
except NameError:
    positions = [tuple(view.CameraPosition)]

# -----------------------------------------------------------------------------
# Light settings
# -----------------------------------------------------------------------------


if view.UseLight:
  view.UseLight = 0
  renderer = view.GetClientSideObject().GetRenderer()
  lightA = vtkLight()
  lightA.SetPosition(0.0, 1.0, 0.0)
  lightA.SetIntensity(1.0)
  lightA.SetLightTypeToSceneLight()
  renderer.AddLight(lightA)

  lightB = vtkLight()
  lightB.SetPosition(0.8, -0.2, 0.0)
  lightB.SetIntensity(0.8)
  lightB.SetLightTypeToSceneLight()
  renderer.AddLight(lightB)

  lightC = vtkLight()
  lightC.SetPosition(-0.3, -0.2, 0.7)
  lightC.SetIntensity(0.6)
  lightC.SetLightTypeToSceneLight()
  renderer.AddLight(lightC)

  lightD = vtkLight()
  lightD.SetPosition(-0.3, -0.2, -0.7)
  lightD.SetIntensity(0.4)
  lightD.SetLightTypeToSceneLight()
  renderer.AddLight(lightD)

# -----------------------------------------------------------------------------
# Prepare rendering
# -----------------------------------------------------------------------------

# First render use to consume (ResetCamera + ResetCameraAngle)
simple.Render()

# Ensure correct Camera Angle
view.CameraViewAngle = 90
simple.Render()

# -----------------------------------------------------------------------------
# Camera positions computations
# -----------------------------------------------------------------------------

# Generate camera positions
cameraPositions = []
poseIndex = 1
for pos in positions:
    cameraPositions.append({
        'position': pos,
        'args': {
            'poseIndex': '%s' % poseIndex,
        }
    })
    poseIndex += 1

camera = {
    'type': 'cube',
    'viewForward': viewForward,
    'viewUp': viewUp,
    'positions': cameraPositions
}

METADATA = {
  'skybox': {
    'faceMapping': [
      { 'fileName': 'f.jpg', 'transform': { 'flipX': False } },
      { 'fileName': 'b.jpg', 'transform': { 'flipX': False } },
      { 'fileName': 'd.jpg', 'transform': { 'flipX': False, 'rotate': 90 } },
      { 'fileName': 'u.jpg', 'transform': { 'flipX': False, 'rotate': -90 } },
      { 'fileName': 'r.jpg', 'transform': { 'flipX': False } },
      { 'fileName': 'l.jpg', 'transform': { 'flipX': False } },
    ]
  }
}

# -----------------------------------------------------------------------------
# Destination handling
# -----------------------------------------------------------------------------

USER_HOME = os.path.expanduser('~')
ROOT_OUTPUT_DIRECTORY = EXPORT_DIRECTORY.replace('${USER_HOME}', USER_HOME)
ROOT_OUTPUT_DIRECTORY = os.path.normpath(ROOT_OUTPUT_DIRECTORY)

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

print ('Creating data into directory: ', outputDir)

# -----------------------------------------------------------------------------

def generateSceneName():
  srcs = simple.GetSources()

  nameParts = []
  for key, val in srcs.items():
    proxyGroup = val.SMProxy.GetXMLGroup()
    if 'sources' in proxyGroup:
      nameParts.append(key[0])
  fileName = '-'.join(nameParts)

  # limit to a reasonable length characters
  fileName = fileName[:12] if len(fileName) > 15 else fileName
  if len(fileName) == 0:
    fileName = 'SkyBoxExport'
  sceneName = '%s' % fileName
  counter = 0
  while os.path.isfile(os.path.join(ROOT_OUTPUT_DIRECTORY, '%s%s' % (sceneName, FILENAME_EXTENSION))):
    counter += 1
    sceneName = '%s (%d)' % (fileName, counter)

  return sceneName


# -----------------------------------------------------------------------------
# Generate Export
# -----------------------------------------------------------------------------

dsb = ImageDataSetBuilder(outputDir, 'image/jpg', camera, METADATA)
dsb.start(view)
dsb.writeImages()
dsb.stop()

# -----------------------------------------------------------------------------
# Now zip up the results and get rid of the temp directory
# -----------------------------------------------------------------------------

try:
    sceneName
except NameError:
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

print ('=' * 80)
print ('Finished exporting dataset to: ', sceneFileName)
print ('=' * 80)
