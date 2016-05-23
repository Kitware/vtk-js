vtkDataSet is an abstract class that specifies an interface for dataset
objects. vtkDataSet also provides methods to provide informations about
the data, such as center, bounding box, and representative length.

In vtk a dataset consists of a structure (geometry and topology) and
attribute data. The structure is defined implicitly or explicitly as
a collection of cells. The geometry of the structure is contained in
point coordinates plus the cell interpolation functions. The topology
of the dataset structure is defined by cell types and how the cells
share their defining points.

Attribute data in vtk is either point data (data at points) or cell data
(data at cells). Typically filters operate on point data, but some may
operate on cell data, both cell and point data, either one, or none.

## newInstance()

Construct a new vtkDataSet with some initial content.

### api TBD
