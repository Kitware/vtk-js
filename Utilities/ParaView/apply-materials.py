# -----------------------------------------------------------------------------
# Load script in ParaView then run
# > applyMaterialToRepresentation('.../path/to/representations.json')
# -----------------------------------------------------------------------------

from paraview import simple
import json
import os

proxyMapping = {}
materialPaths = []


def updateSourceMapping():
  for source in simple.GetSources():
    name = source[0]
    if '.vtp' in name:
      name = name[:-4]
    name = str(name)

    if name not in proxyMapping:
      proxyMapping[name] = []

    proxy = simple.servermanager._getPyProxy(simple.servermanager.ActiveConnection.Session.GetRemoteObject(int(source[1])))
    proxyMapping[name].append(proxy)


def applyMaterialToRepresentation(filepath):
  view = simple.Render()
  with open(filepath) as json_file:
    props = json.load(json_file)

    for key in props:
      for proxy in proxyMapping[str(key)]:
        simple.Show(proxy=proxy, view=view, **props[key])

  simple.Render()


def loadFiles(directoryPath):
  for (dirpath, dirnames, filenames) in os.walk(directoryPath):
    for filename in filenames:
      if filename[:-5] == '.json':
        materialPaths.append(os.path.join(dirpath, filename))
      else:
        simple.OpenDataFile(os.path.join(dirpath, filename), registrationName=filename)


def applyMaterials():
  updateSourceMapping()
  for matFile in materialPaths:
    applyMaterialToRepresentation(matFile)
