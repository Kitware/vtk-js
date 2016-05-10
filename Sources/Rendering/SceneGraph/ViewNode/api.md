a node within a VTK scene graph

This is the superclass for all nodes within a VTK scene graph. It
contains the API for a node. It supports the essential operations such
as graph creation, state storage and traversal. Child classes adapt this
to VTK's major rendering classes. Grandchild classes adapt those to
for APIs of different rendering libraries.

### build(prepass)

Builds myself.

### synchronize(prepass )

Ensures that my state agrees with my Renderable's.

### render( prepass ) 

Makes calls to make self visible.

### parent

The view node that owns this  view node

### children

The View nodes  gthat this nodeowns

  //A factory that creates particular subclasses for different
  //rendering back ends.
  virtual void SetMyFactory(vtkViewNodeFactory*);
  vtkGetObjectMacro(MyFactory, vtkViewNodeFactory);

### getViewNodeFor ( dataObject )

Returns the view node that corresponding to the provided object
Will return NULL if a match is not found in self or descendents

### getFirstAncestorOfType( type )

Find the first parent/grandparent of the desired type

### renderable

The data object (thing to be rendered)

### traverse ( operation )

Traverse this node with the specified pass. If you want to traverse your 
children in a specific order or way override this method

### traverseAllPasses()

Traverse the view tree for alldefined  passes.
