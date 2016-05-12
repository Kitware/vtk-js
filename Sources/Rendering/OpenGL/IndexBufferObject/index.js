import * as macro from '../../../macro';
import BufferObject from '../BufferObject';
import { OBJECT_TYPE } from '../BufferObject/Constants';
import { DynamicTypedArray } from '../../../../Sources/Common/Core/DynamicTypedArray';

/* eslint-disable no-multi-spaces */

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkOpenGLIndexBufferObject methods
// ----------------------------------------------------------------------------

function indexBufferObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLIndexBufferObject');

  // Sizes/offsets are all in bytes as OpenGL API expects them.
  let indexCount = 0; // Number of indices in the VBO

  publicAPI.createTriangleIndexBuffer = (cells, points) => {
    const dynArray = new DynamicTypedArray();
    publicAPI.appendTriangleIndexBuffer(dynArray, cells, points, 0);
    const indexArray = dynArray.getFrozenArray();
    indexCount = indexArray.length;
    if (indexCount > 0) {
      publicAPI.upload(indexArray, OBJECT_TYPE.ELEMENT_ARRAY_BUFFER);
    }
    return indexCount;
  };

  publicAPI.appendTriangleIndexBuffer = (indexArray, cells, points, vOffset) => {
    let currentCellOffset = 0;
    // const polygon = null;

    while (currentCellOffset < cells.length) {
      const npts = cells[currentCellOffset];
      const idxOffset = currentCellOffset + 1;

      if (npts < 3) {
        // ignore degenerate triangles
        console.log(`skipping degenerate triangle at connectivity entry ${currentCellOffset}`);
      } else if (npts === 3) {
        indexArray.push(cells[idxOffset]     + vOffset);
        indexArray.push(cells[idxOffset + 1] + vOffset);
        indexArray.push(cells[idxOffset + 2] + vOffset);
      } else {  // triangulate needed
        // special cases for quads, penta, hex which are common
        if (npts === 4) {
          indexArray.push(cells[idxOffset]     + vOffset);
          indexArray.push(cells[idxOffset + 1] + vOffset);
          indexArray.push(cells[idxOffset + 2] + vOffset);
          indexArray.push(cells[idxOffset]     + vOffset);
          indexArray.push(cells[idxOffset + 2] + vOffset);
          indexArray.push(cells[idxOffset + 3] + vOffset);
        } else if (npts === 5) {
          indexArray.push(cells[idxOffset]     + vOffset);
          indexArray.push(cells[idxOffset + 1] + vOffset);
          indexArray.push(cells[idxOffset + 2] + vOffset);
          indexArray.push(cells[idxOffset]     + vOffset);
          indexArray.push(cells[idxOffset + 2] + vOffset);
          indexArray.push(cells[idxOffset + 3] + vOffset);
          indexArray.push(cells[idxOffset]     + vOffset);
          indexArray.push(cells[idxOffset + 3] + vOffset);
          indexArray.push(cells[idxOffset + 4] + vOffset);
        } else if (npts === 6) {
          indexArray.push(cells[idxOffset]     + vOffset);
          indexArray.push(cells[idxOffset + 1] + vOffset);
          indexArray.push(cells[idxOffset + 2] + vOffset);
          indexArray.push(cells[idxOffset]     + vOffset);
          indexArray.push(cells[idxOffset + 2] + vOffset);
          indexArray.push(cells[idxOffset + 3] + vOffset);
          indexArray.push(cells[idxOffset]     + vOffset);
          indexArray.push(cells[idxOffset + 3] + vOffset);
          indexArray.push(cells[idxOffset + 4] + vOffset);
          indexArray.push(cells[idxOffset]     + vOffset);
          indexArray.push(cells[idxOffset + 4] + vOffset);
          indexArray.push(cells[idxOffset + 5] + vOffset);
        } else { // 7 sided polygon or higher, do a full smart triangulation
          console.log('7 more sides in a polygon is not yet implemented');
          // if (!polygon) {
          //   polygon = vtkPolygon::New();
          //   tris = vtkIdList::New();
          //   triPoints = vtkPoints::New();
          // }

          // vtkIdType *triIndices = new vtkIdType[npts];
          // triPoints->SetNumberOfPoints(npts);
          // for (int i = 0; i < npts; ++i) {
          //   int idx = indices[i];
          //   triPoints->SetPoint(i,points->GetPoint(idx));
          //   triIndices[i] = i;
          // }
          // polygon->Initialize(npts, triIndices, triPoints);
          // polygon->Triangulate(tris);
          // for (int j = 0; j < tris->GetNumberOfIds(); ++j) {
          //   indexArray.push(static_cast<unsigned int>(indices[tris->GetId(j)]+vOffset));
          // }
          // delete [] triIndices;
        }
      }

      // move to next cell
      currentCellOffset += (npts + 1);
    }

    // if (polygon) {
    //   polygon.delete();
    //   tris.delete();
    //   triPoints.delete();
    // }
  };

  publicAPI.createLineIndexBuffer = (cells) => {
    const dynArray = new DynamicTypedArray();
    publicAPI.appendLineIndexBuffer(dynArray, cells, 0);
    const indexArray = dynArray.getFrozenArray();
    indexCount = indexArray.length;
    if (indexCount > 0) {
      publicAPI.upload(indexArray, OBJECT_TYPE.ELEMENT_ARRAY_BUFFER);
    }
    return indexCount;
  };

  publicAPI.appendLineIndexBuffer = (indexArray, cells, vOffset) => {
    let currentCellOffset = 0;

    while (currentCellOffset < cells.length) {
      const npts = cells[currentCellOffset];
      const idxOffset = currentCellOffset + 1;

      for (let i = 0; i < npts - 1; ++i) {
        indexArray.push(cells[idxOffset + i]     + vOffset);
        indexArray.push(cells[idxOffset + i + 1] + vOffset);
      }

      // move to next cell
      currentCellOffset += (npts + 1);
    }
  };

  publicAPI.createTriangleLineIndexBuffer = cells => {
    const dynArray = new DynamicTypedArray();
    publicAPI.appendTriangleLineIndexBuffer(dynArray, cells, 0);
    const indexArray = dynArray.getFrozenArray();
    indexCount = indexArray.length;
    if (indexCount > 0) {
      publicAPI.upload(indexArray, OBJECT_TYPE.ELEMENT_ARRAY_BUFFER);
    }
    return indexCount;
  };

  publicAPI.appendTriangleLineIndexBuffer = (indexArray, cells, vOffset) => {
    let currentCellOffset = 0;

    while (currentCellOffset < cells.length) {
      const npts = cells[currentCellOffset];
      const idxOffset = currentCellOffset + 1;

      for (let i = 0; i < npts; ++i) {
        indexArray.push(cells[idxOffset + i] + vOffset);
        indexArray.push(cells[idxOffset + (i < (npts - 1) ? i + 1 : 0)] + vOffset);
      }

      // move to next cell
      currentCellOffset += (npts + 1);
    }
  };

  publicAPI.createPointIndexBuffer = (cells) => {
    const dynArray = new DynamicTypedArray();
    publicAPI.appendPointIndexBuffer(dynArray, cells, 0);
    const indexArray = dynArray.getFrozenArray();
    indexCount = indexArray.length;
    if (indexCount > 0) {
      publicAPI.upload(indexArray, OBJECT_TYPE.ELEMENT_ARRAY_BUFFER);
    }
    return indexCount;
  };

  publicAPI.appendPointIndexBuffer = (indexArray, cells, vOffset) => {
    let currentCellOffset = 0;

    while (currentCellOffset < cells.length) {
      const npts = cells[currentCellOffset];
      const idxOffset = currentCellOffset + 1;

      for (let i = 0; i < npts; ++i) {
        indexArray.push(cells[idxOffset + i] + vOffset);
      }

      // move to next cell
      currentCellOffset += (npts + 1);
    }
  };

  publicAPI.createStripIndexBuffer = (cells, wireframeTriStrips) => {
    const dynArray = new DynamicTypedArray();

    if (wireframeTriStrips) {
      let currentCellOffset = 0;

      while (currentCellOffset < cells.length) {
        const npts = cells[currentCellOffset];
        const idxOffset = currentCellOffset + 1;

        dynArray.push(cells[idxOffset]);
        dynArray.push(cells[idxOffset + 1]);

        for (let i = 0; i < npts - 2; ++i) {
          dynArray.push(cells[idxOffset + i]);
          dynArray.push(cells[idxOffset + i + 2]);
          dynArray.push(cells[idxOffset + i + 1]);
          dynArray.push(cells[idxOffset + i + 2]);
        }

        // move to next cell
        currentCellOffset += (npts + 1);
      }
    } else {
      let currentCellOffset = 0;

      while (currentCellOffset < cells.length) {
        const npts = cells[currentCellOffset];
        const idxOffset = currentCellOffset + 1;

        for (let i = 0; i < npts - 2; ++i) {
          dynArray.push(cells[idxOffset + i]);
          dynArray.push(cells[idxOffset + i + 1 + i % 2]);
          dynArray.push(cells[idxOffset + i + 1 + (i + 1) % 2]);
        }

        // move to next cell
        currentCellOffset += (npts + 1);
      }
    }

    const indexArray = dynArray.getFrozenArray();
    indexCount = indexArray.length;
    if (indexCount > 0) {
      publicAPI.upload(indexArray, OBJECT_TYPE.ELEMENT_ARRAY_BUFFER);
    }
    return indexCount;
  };

  publicAPI.createEdgeFlagIndexBuffer = (cells, ef) => {
    console.log('edge flag index buffer is not yet implemented.');
    //   // vtkCellArray *cells,
    //   // vtkDataArray *ef)
    //   const info = computeIndexBufferInfo(cells);
    //   if (info.numberOfCells === 0) {
    //     indexCount = 0;
    //     return 0;
    //   }
    //   indexCount = info.numberOfVertices;

    //   vtkIdType      *pts = 0;
    //   vtkIdType      npts = 0;
    //   std::vector<unsigned int> indexArray;
    //   unsigned char *ucef = NULL;
    //   ucef = vtkUnsignedCharArray::SafeDownCast(ef)->GetPointer(0);
    //   indexArray.reserve(cells->GetData()->GetSize()*2);
    //   for (cells->InitTraversal(); cells->GetNextCell(npts,pts); )
    //     {
    //     for (int j = 0; j < npts; ++j)
    //       {
    //       if (ucef[pts[j]] && npts > 1) // draw this edge and poly is not degenerate
    //         {
    //         // determine the ending vertex
    //         vtkIdType nextVert = (j == npts-1) ? pts[0] : pts[j+1];
    //         indexArray.push(static_cast<unsigned int>(pts[j]));
    //         indexArray.push(static_cast<unsigned int>(nextVert));
    //         }
    //       }
    //     }
    //   this->Upload(indexArray, vtkOpenGLIndexBufferObject::ElementArrayBuffer);
    //   this->IndexCount = indexArray.size();
    //   return indexArray.size();
  };

  publicAPI.createCellSupportArrays = (prims, cellCellMap, representation) => {
    console.log('cell support arrays not yet implemented');
    //   // vtkCellArray *prims[4],
    //   // std::vector<unsigned int> &cellCellMap,
    //   // int representation
    //   // need an array to track what points to orig points
    //   size_t minSize = prims[0]->GetNumberOfCells() +
    //                    prims[1]->GetNumberOfCells() +
    //                    prims[2]->GetNumberOfCells() +
    //                    prims[3]->GetNumberOfCells();
    //   vtkIdType* indices(NULL);
    //   vtkIdType npts(0);

    //   // make sure we have at least minSize
    //   cellCellMap.reserve(minSize);
    //   unsigned int vtkCellCount = 0;

    //   // points
    //   for (prims[0]->InitTraversal(); prims[0]->GetNextCell(npts, indices); )
    //     {
    //     for (int i=0; i < npts; ++i)
    //       {
    //       cellCellMap.push(vtkCellCount);
    //       }
    //     vtkCellCount++;
    //     } // for cell

    //   if (representation == VTK_POINTS)
    //     {
    //     for (int j = 1; j < 4; j++)
    //       {
    //       for (prims[j]->InitTraversal(); prims[j]->GetNextCell(npts, indices); )
    //         {
    //         for (int i=0; i < npts; ++i)
    //           {
    //           cellCellMap.push(vtkCellCount);
    //           }
    //         vtkCellCount++;
    //         } // for cell
    //       }
    //     }
    //   else // lines or surfaces
    //     {
    //     // lines
    //     for (prims[1]->InitTraversal(); prims[1]->GetNextCell(npts, indices); )
    //       {
    //       for (int i = 0; i < npts-1; ++i)
    //         {
    //         cellCellMap.push(vtkCellCount);
    //         }
    //       vtkCellCount++;
    //       } // for cell

    //     if (representation == VTK_WIREFRAME)
    //       {
    //       // polys
    //       for (prims[2]->InitTraversal(); prims[2]->GetNextCell(npts, indices); )
    //         {
    //         for (int i = 0; i < npts; ++i)
    //           {
    //           cellCellMap.push(vtkCellCount);
    //           }
    //         vtkCellCount++;
    //         } // for cell

    //       // strips
    //       for (prims[3]->InitTraversal(); prims[3]->GetNextCell(npts, indices); )
    //         {
    //         cellCellMap.push(vtkCellCount);
    //         for (int i = 2; i < npts; ++i)
    //           {
    //           cellCellMap.push(vtkCellCount);
    //           cellCellMap.push(vtkCellCount);
    //           }
    //         vtkCellCount++;
    //         } // for cell
    //       }
    //     else
    //       {
    //       // polys
    //       for (prims[2]->InitTraversal(); prims[2]->GetNextCell(npts, indices); )
    //         {
    //         if (npts > 2)
    //           {
    //           for (int i = 2; i < npts; ++i)
    //             {
    //             cellCellMap.push(vtkCellCount);
    //             }
    //           }
    //         vtkCellCount++;
    //         } // for cell

    //       // strips
    //       for (prims[3]->InitTraversal(); prims[3]->GetNextCell(npts, indices); )
    //         {
    //         for (int i = 2; i < npts; ++i)
    //           {
    //           cellCellMap.push(vtkCellCount);
    //           }
    //         vtkCellCount++;
    //         } // for cell
    //       }
    //     }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  BufferObject.extend(publicAPI, model);

  // Object specific methods
  indexBufferObject(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
