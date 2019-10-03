# -----------------------------------------------------------------------------
# Load script in ParaView then run
# > applyMaterialToRepresentation('.../path/to/representations.json')
# -----------------------------------------------------------------------------

from paraview import simple
import json
import os

proxyMapping = {}

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
  materialPaths = []
  for (dirpath, dirnames, filenames) in os.walk(directoryPath):
    for filename in filenames:
      if filename == 'representations.json':
        materialPaths.append(os.path.join(dirpath, filename))
      else:
        simple.OpenDataFile(os.path.join(dirpath, filename), registrationName=filename)

  updateSourceMapping()
  for matFile in materialPaths:
    applyMaterialToRepresentation(matFile)


# loadFiles('/Users/seb/Downloads/PoA_OBJ/RVT2019_141s-Zaha-HH-Brug-1103-PP')
# loadFiles('/Users/seb/Downloads/PoA_OBJ/RVT2019_151s-Zaha-HH-Nieuwbouw-1014-PP')
# loadFiles('/Users/seb/Downloads/PoA_OBJ/RVT2019_151s-Zaha-HH-Oudbouw-0417-MO')
