#!/Applications/ParaView-5.8.1.app/Contents/bin/pvpython

# -----------------------------------------------------------------------------
# User configuration
# -----------------------------------------------------------------------------

# objToLoad = '/Users/seb/Documents/code/Web/vtk-js/Data/obj/ferrari-f1-race-car/ferrari-f1-race-car.obj'
# mtlToLoad = '/Users/seb/Documents/code/Web/vtk-js/Data/obj/ferrari-f1-race-car/ferrari-f1-race-car.mtl'

# objToLoad = '/Users/seb/Documents/code/Web/vtk-js/Data/obj/blskes-plane/blskes-plane.obj'
# mtlToLoad = '/Users/seb/Documents/code/Web/vtk-js/Data/obj/blskes-plane/blskes-plane.mtl'

# objToLoad = '/Users/seb/Documents/code/Web/vtk-js/Data/obj/mini-cooper/mini-cooper.obj'
# mtlToLoad = '/Users/seb/Documents/code/Web/vtk-js/Data/obj/mini-cooper/mini-cooper.mtl'

# objToLoad = '/Users/seb/Documents/code/Web/vtk-js/Data/obj/space-shuttle-orbiter/space-shuttle-orbiter.obj'
# mtlToLoad = '/Users/seb/Documents/code/Web/vtk-js/Data/obj/space-shuttle-orbiter/space-shuttle-orbiter.mtl'

# -----------------------------------------------------------------------------

from vtk import *
from paraview import simple
import os
import sys
import hashlib
import json

# -----------------------------------------------------------------------------

def nameRemap(name):
  if 'Paneel' in name:
    return '3204_Paneel_4Hoek_Definition1'

  if 'Zijgevel' in name:
    return 'seb_white_steel'

  return name

# -----------------------------------------------------------------------------
# obj Parser
# -----------------------------------------------------------------------------

class OBJParser(object):

  def __init__(self, objFilePath, splitMode = None):
    self.splitOn = splitMode
    self.pieces = [];
    self.v = [];
    self.vt = [];
    self.vn = [];
    self.f = [[]];
    self.size = 0;
    self.output = []

    with open(objFilePath, "r", encoding="utf-8") as objLines:
        for line in objLines:
            self.parseLine(line.rstrip('\n'))
    self.end();


  @staticmethod
  def createPoints(pythonArray):
      pts = vtkPoints()
      nbPoints = int(len(pythonArray) / 3)
      pts.SetNumberOfPoints(nbPoints);
      for i in range(nbPoints):
          pts.SetPoint(i, pythonArray[(i * 3) + 0], pythonArray[(i * 3) + 1], pythonArray[(i * 3) + 2])
      return pts


  @staticmethod
  def createCellArray(pythonArray, nbCells):
      cellArray = vtkCellArray()

      idx = 0
      size = len(pythonArray)
      while idx < size:
        cellSize = pythonArray[idx]
        cellArray.InsertNextCell(cellSize)
        idx += 1
        for i in range(cellSize):
          cellArray.InsertCellPoint(int(pythonArray[idx]))
          idx += 1

      return cellArray


  @staticmethod
  def createFloatArray(name, nbComponents, pythonArray):
      array = vtkFloatArray()
      array.SetName(name)
      array.SetNumberOfComponents(nbComponents)
      array.SetNumberOfTuples(int(len(pythonArray) / nbComponents))

      for i in range(len(pythonArray)):
          array.SetValue(i, pythonArray[i])

      return array

  @staticmethod
  def pushVector(src, srcOffset, dst, vectorSize):
      for i in range(vectorSize):
          dst.append(src[srcOffset + i])

  @staticmethod
  def faceMap(str):
      idxs = [int(i) if len(i) else 1 for i in str.split('/')]
      vertexIdx = int(idxs[0] - 1);
      textCoordIdx = int(idxs[1] - 1) if len(idxs) > 1 else vertexIdx
      vertexNormal = int(idxs[2] - 1) if len(idxs) > 2 else vertexIdx
      return [vertexIdx, textCoordIdx, vertexNormal]


  def parseLine(self, line):
      if len(line.strip()) == 0 or line[0] == '#':
        return

      tokens = line.strip().split()
      if tokens[0] == self.splitOn:
        tokens.pop(0)
        self.pieces.append(' '.join(tokens).strip())
        self.f.append([])
        self.size += 1;
      elif tokens[0] == 'v':
        self.v.append(float(tokens[1]))
        self.v.append(float(tokens[2]))
        self.v.append(float(tokens[3]))
      elif tokens[0] == 'vt':
        self.vt.append(float(tokens[1]))
        self.vt.append(float(tokens[2]))
      elif tokens[0] == 'vn':
        self.vn.append(float(tokens[1]))
        self.vn.append(float(tokens[2]))
        self.vn.append(float(tokens[3]))
      elif tokens[0] == 'f':
        # Handle triangles for now
        if self.size == 0:
          self.size += 1

        cells = self.f[self.size - 1];
        tokens.pop(0)
        size = len(tokens)
        cells.append(size)
        for i in range(size):
          cells.append(OBJParser.faceMap(tokens[i]))


  def end(self):
      hasTcoords = True if len(self.vt) > 0 else False
      hasNormals = True if len(self.vn) > 0 else False
      if self.splitOn:
          for idx in range(self.size):
              ctMapping = {}
              polydata = vtkPolyData()
              pts = []
              tc = []
              normals = []
              polys = []
              nbCells = 0

              polyIn = self.f[idx]
              nbElems = len(polyIn)
              offset = 0
              while offset < nbElems:
                  cellSize = polyIn[offset]
                  nbCells += 1
                  polys.append(cellSize)
                  for pIdx in range(cellSize):
                      vIdx, tcIdx, nIdx = polyIn[offset + pIdx + 1]
                      key = '%d/%d/%d' % (vIdx, tcIdx, nIdx)
                      if key not in ctMapping:
                        ctMapping[key] = len(pts) / 3
                        OBJParser.pushVector(self.v, vIdx * 3, pts, 3)
                        if hasTcoords:
                          OBJParser.pushVector(self.vt, tcIdx * 2, tc, 2)

                        if hasNormals:
                          OBJParser.pushVector(self.vn, nIdx * 3, normals, 3)

                      polys.append(ctMapping[key])

                  offset += cellSize + 1;

              polydata.SetPoints(OBJParser.createPoints(pts))
              polydata.SetPolys(OBJParser.createCellArray(polys, nbCells))

              if hasTcoords:
                tcoords = OBJParser.createFloatArray('TextureCoordinates', 2, tc)
                polydata.GetPointData().SetTCoords(tcoords);

              if hasNormals:
                normalsArray = OBJParser.createFloatArray('Normals', 3, normals)
                polydata.GetPointData().SetNormals(normalsArray)

              # register in output
              self.output.append(polydata)
              print(self.pieces[idx])
      else:
          polydata = vtkPolyData()
          polydata.SetPoints(OBJParser.createPoints(self.v))
          if hasTcoords and (len(self.v) / 3) == (len(self.vt) / 2):
              tcoords = OBJParser.createFloatArray('TextureCoordinates', 2, self.vt)
              polydata.GetPointData().SetTCoords(tcoords);

          if hasNormals and (len(self.v) == len(self.vn)):
              normalsArray = OBJParser.createFloatArray('Normals', 3, self.vn)
              polydata.GetPointData().SetNormals(normalsArray)

          polys = []
          polyIn = self.f[0]
          nbElems = len(polyIn)
          offset = 0
          nbCells = 0
          while offset < nbElems:
            cellSize = polyIn[offset]
            nbCells += 1
            polys.append(cellSize)
            for pIdx in range(cellSize):
              polys.append(polyIn[offset + pIdx + 1][0])
            offset += cellSize + 1

          polydata.SetPolys(OBJParser.createCellArray(polys, nbCells))
          self.output.append(polydata)

# -----------------------------------------------------------------------------
# mtl Parser
# -----------------------------------------------------------------------------

def materialToSHA(mat):
  keys = list(mat.keys())
  keys.sort()
  m = hashlib.md5()
  for key in keys:
    m.update(key.encode('utf-8'))
    for token in mat[key]:
      m.update(token.encode('utf-8'))

  return m.hexdigest()


class MTLParser(object):

  def __init__(self, mtlFilePath):
      self.materials = {}
      self.currentMaterial = None
      self.textures = {}
      self.baseDir = os.path.dirname(mtlFilePath)
      self.reducedMaterialMap = {}
      self.reverseReduceMap = {}
      self.representationsParameters = {}

      with open(mtlFilePath, "r", encoding="utf-8") as lines:
          for line in lines:
              self.parseLine(line.rstrip('\n'))

  def parseLine(self, line):
      if len(line.strip()) == 0 or line[0] == '#':
        return

      tokens = line.strip().split()
      if tokens[0] == 'newmtl':
        tokens.pop(0);
        self.currentMaterial = ' '.join(tokens).strip()
      elif self.currentMaterial:
        if self.currentMaterial not in self.materials:
          self.materials[self.currentMaterial] = {}

        if len(tokens) > 1:
            self.materials[self.currentMaterial][tokens[0]] = tokens[1:]

  def reduceMaterialDefinitions(self):
    for name in self.materials:
      sha = materialToSHA(self.materials[name])
      self.reducedMaterialMap[name] = sha
      self.reverseReduceMap[sha] = name

    print('Reducing materials from %s to %s' % (len(self.reducedMaterialMap), len(self.reverseReduceMap)))


  def applyMaterialToRepresentation(self, name, representation):
    self.representationsParameters[name] = {}
    material = {}
    if name in self.materials:
      material = self.materials[name]
    if name in self.reverseReduceMap:
      material = self.materials[self.reverseReduceMap[name]]

    if 'map_Kd' in material:
        if name not in self.textures:
            from paraview import servermanager
            texture = servermanager._getPyProxy(servermanager.CreateProxy('textures', 'ImageTexture'))
            texture.FileName = os.path.join(self.baseDir, material['map_Kd'][0])
            self.textures[name] = texture
            servermanager.Register(texture)

        representation.Texture = self.textures[name]

    if 'Ka' in material:
        representation.AmbientColor = [float(n) for n in material['Ka']]
        self.representationsParameters[name]['AmbientColor'] = [float(n) for n in material['Ka']]

    if 'Ks' in material:
        representation.SpecularColor = [float(v) for v in material['Ks']]
        self.representationsParameters[name]['SpecularColor'] = [float(v) for v in material['Ks']]

    if 'Kd' in material:
        representation.DiffuseColor = [float(v) for v in material['Kd']]
        self.representationsParameters[name]['DiffuseColor'] = [float(v) for v in material['Kd']]

    if 'd' in material:
        representation.Opacity = float(material['d'][0])
        self.representationsParameters[name]['Opacity'] = float(material['d'][0])

    if 'Ns' in material:
        representation.SpecularPower = float(material['Ns'][0])
        self.representationsParameters[name]['SpecularPower'] = float(material['Ns'][0])

    if 'illum' in material:
        representation.Ambient = 1.0 if 0 <= float(material['illum'][0]) else 0.0
        representation.Diffuse = 1.0 if 1 <= float(material['illum'][0]) else 0.0
        representation.Specular = 1.0 if 2 <= float(material['illum'][0]) else 0.0
        self.representationsParameters[name]['Ambient'] = 1.0 if 0 <= float(material['illum'][0]) else 0.0
        self.representationsParameters[name]['Diffuse'] = 1.0 if 1 <= float(material['illum'][0]) else 0.0
        self.representationsParameters[name]['Specular'] = 1.0 if 2 <= float(material['illum'][0]) else 0.0
    # else:
    #     representation.Ambient = 1.0
    #     representation.Diffuse = 1.0
    #     representation.Specular = 1.0



# -----------------------------------------------------------------------------
# Mesh writer builder
# -----------------------------------------------------------------------------

def writeMeshes(meshBaseDirectory, objReader, nameMapping = {}):
  nameToFilePath = {}
  writer = vtkXMLPolyDataWriter()
  ext = '.vtp'

  if not os.path.exists(meshBaseDirectory):
    os.makedirs(meshBaseDirectory)

  nbPieces = len(objReader.pieces)
  dsList = {}
  nameToKey = nameMapping
  for idx in range(nbPieces):
    name = objReader.pieces[idx]
    if name not in nameToKey:
      nameToKey[name] = name

  # Gather polydata with same textures
  for idx in range(nbPieces):
      name = objReader.pieces[idx]
      key = nameToKey[name]
      if key not in dsList:
          dsList[key] = []
      dsList[key].append(objReader.output[idx])

  # Write each dataset
  idx = 0
  size = len(dsList)
  for name in dsList:
      fullPath = os.path.join(meshBaseDirectory, '%s%s' % (name, ext))
      merge = vtkAppendPolyData()
      for block in dsList[name]:
        merge.AddInputData(block)

      merge.Update()

      writer.SetInputData(merge.GetOutput(0))
      writer.SetFileName(fullPath)
      writer.Modified()
      print('%d - %d/%d - %s => %s' % ((idx + 1), len(dsList[name]), size, name, fullPath))
      writer.Write()
      nameToFilePath[name] = fullPath
      idx += 1

  return nameToFilePath;


# -----------------------------------------------------------------------------
# Scene Loader
# -----------------------------------------------------------------------------

def loadScene(objFilePath, mtlFilePath):
  mtlReader = MTLParser(mtlFilePath)
  mtlReader.reduceMaterialDefinitions()

  objReader = OBJParser(objFilePath, 'usemtl')
  meshBaseDirectory = os.path.join(os.path.dirname(objFilePath), os.path.basename(objFilePath)[:-4])

  # custom remap
  mapToSha = {}
  for key in mtlReader.reducedMaterialMap:
    mapToSha[key] = mtlReader.reducedMaterialMap[nameRemap(key)]

  meshMapping = writeMeshes(meshBaseDirectory, objReader, mapToSha)
  for name in meshMapping:
    source = simple.OpenDataFile(meshMapping[name], guiName=name)
    rep = simple.Show(source)
    mtlReader.applyMaterialToRepresentation(name, rep)

  with open('%s/representations.json' % meshBaseDirectory, "w", encoding="utf-8") as text_file:
    text_file.write(json.dumps(mtlReader.representationsParameters, indent=2, sort_keys=True))

  simple.Render()

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

if __name__ == "__main__":
  if len(sys.argv) < 2:
      print("Usage: obj-mtl-importer /path/to/file.obj")
  else:
      objPath = sys.argv[1]
      loadScene(objPath, '%s.mtl' % objPath[:-4])
      simple.SaveState('%s-pv-state.pvsm' % objPath[:-4])
