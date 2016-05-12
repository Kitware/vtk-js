import * as macro from '../../../macro';
import BufferObject from '../BufferObject';
import { SHIFT_SCALE_METHOD } from './Constants';
import { OBJECT_TYPE } from '../BufferObject/Constants';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {};

// ----------------------------------------------------------------------------
// vtkOpenGLVertexBufferObject methods
// ----------------------------------------------------------------------------

function vertexBufferObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVertexBufferObject');

  // Sizes/offsets are all in bytes as OpenGL API expects them.
  // let vertexCount = 0;          // Number of vertices in the VBO
  // let stride = 0;               // The size of a complete vertex + attributes
  // let vertexOffset = 0;         // Offset of the vertex
  // let normalOffset = 0;         // Offset of the normal
  // let tCoordOffset = 0;         // Offset of the texture coordinates
  // let tCoordComponents = 0;     // Number of texture dimensions
  // let colorOffset;              // Offset of the color
  // let numColorComponents;       // Number of color components
  // std::vector<float> PackedVBO; // the data

  publicAPI.setType(OBJECT_TYPE.ARRAY_BUFFER);

  publicAPI.createVBO = (points, numPts, normals, tcoords, colors, colorComponents) => {
    // points: {
    //   dataType: "Float32Array",
    //   name: "_points",
    //   tuple: 3,
    //   type: "DataArray",
    //   values: Float32Array[21],
    // }
    // numPts: number,
    // normals: TypedArray,
    // tcoords: TypedArray,
    // colors: TypedArray,
    // colorComponents: number)

    if (model.coordShiftAndScaleMethod === SHIFT_SCALE_METHOD.AUTO_SHIFT_SCALE) {
      const bds = points.bounds;
      const shift = [0, 0, 0];
      const scale = [1, 1, 1];
      let needed = false;
      for (let i = 0; i < 3; ++i) {
        shift[i] = bds[2 * i]; // -0.5 * (bds[2 * i + 1] + bds[2 * i]);
        const delta = bds[2 * i + 1] - bds[2 * i];
        if (delta > 0.0 && Math.abs(shift[i]) / delta > 1.0e4) {
          needed = true;
          scale[i] = 1.0 / delta;
        } else {
          scale[i] = 1.0;
        }
      }
      if (needed) {
        model.setCoordShift(shift);
        model.setCoordScale(scale);
      }
    }
    // fast path
    if (model.coordShiftAndScaleEnabled === false && tcoords === null && normals === null &&
        colors === null && points.dataType === 'Float32Array') {
      // const blockSize = 3;
      // vertexOffset = 0;
      // normalOffset = 0;
      // tCoordOffset = 0;
      // tCoordComponents = 0;
      // // colorComponents = 0;
      // colorOffset = 0;
      // stride = 4 * blockSize;   // FIXME: Do we need to worry about hard-coded float size here
      // vertexCount = numPts;
      publicAPI.upload(points.values, OBJECT_TYPE.ARRAY_BUFFER);
      return;
    }

    // // slower path
    // this->VertexCount = 0;
    // this->AppendVBO(points, numPts, normals, tcoords, colors, colorComponents);
    // this->Upload(this->PackedVBO, vtkOpenGLBufferObject::ArrayBuffer);
    // this->PackedVBO.resize(0);
  };

  publicAPI.appendVBO = (points, numPoints, normals, tcoords, colors, colorComponents) => {
    // vtkPoints *points, unsigned int numPts,
    // vtkDataArray *normals,
    // vtkDataArray *tcoords,
    // unsigned char *colors, int colorComponents)

    // if (this->CoordShiftAndScaleEnabled)
    //   {
    //   switch(points->GetDataType())
    //     {
    //     vtkTemplateMacro(
    //       TemplatedAppendVBOShiftScale(
    //         this, static_cast<VTK_TT*>(points->GetVoidPointer(0)),
    //         normals, numPts, tcoords, colors, colorComponents,
    //         this->CoordShift, this->CoordScale));
    //     }
    //   }
    // else
    //   {
    //   switch(points->GetDataType())
    //     {
    //     vtkTemplateMacro(
    //       TemplatedAppendVBO(
    //         this, static_cast<VTK_TT*>(points->GetVoidPointer(0)),
    //         normals, numPts, tcoords, colors, colorComponents));
    //     }
    //   }
  };

  /*
template<typename T>
void TemplatedAppendVBO(vtkOpenGLVertexBufferObject* self,
  T* points, vtkDataArray* normals, vtkIdType numPts,
  vtkDataArray* tcoords,
  unsigned char *colors, int colorComponents)
{
  if (normals)
    {
    switch(normals->GetDataType())
      {
      vtkFloatDoubleTemplateMacro(
        TemplatedAppendVBO2(self, points,
                  static_cast<VTK_TT*>(normals->GetVoidPointer(0)),
                  numPts, tcoords, colors, colorComponents));
      }
    }
  else
    {
    TemplatedAppendVBO2(self, points,
                        (float *)NULL,
                        numPts, tcoords, colors, colorComponents);
    }
}
  */

/*
template<typename T, typename T2>
void TemplatedAppendVBO2(vtkOpenGLVertexBufferObject *self,
  T* points, T2 *normals, vtkIdType numPts,
  vtkDataArray *tcoords,
  unsigned char *colors, int colorComponents)
{
  if (tcoords)
    {
    switch(tcoords->GetDataType())
      {
      vtkFloatDoubleTemplateMacro(
        TemplatedAppendVBO3(self, points, normals,
                  numPts,
                  static_cast<VTK_TT*>(tcoords->GetVoidPointer(0)),
                  tcoords->GetNumberOfComponents(),
                  colors, colorComponents));
      }
    }
  else
    {
    TemplatedAppendVBO3(self, points, normals,
                        numPts, (float *)NULL, 0,
                        colors, colorComponents);
    }
}
*/

/*
template<typename T, typename T2, typename T3>
void TemplatedAppendVBO3(vtkOpenGLVertexBufferObject *self,
  T* points, T2* normals, vtkIdType numPts,
  T3* tcoords, int textureComponents,
  unsigned char *colors, int colorComponents)
{
  // Figure out how big each block will be, currently 6 or 7 floats.
  int blockSize = 3;
  self->VertexOffset = 0;
  self->NormalOffset = 0;
  self->TCoordOffset = 0;
  self->TCoordComponents = 0;
  self->ColorComponents = 0;
  self->ColorOffset = 0;
  if (normals)
    {
    self->NormalOffset = sizeof(float) * blockSize;
    blockSize += 3;
    }
  if (tcoords)
    {
    self->TCoordOffset = sizeof(float) * blockSize;
    self->TCoordComponents = textureComponents;
    blockSize += textureComponents;
    }
  if (colors)
    {
    self->ColorComponents = colorComponents;
    self->ColorOffset = sizeof(float) * blockSize;
    ++blockSize;
    }
  self->Stride = sizeof(float) * blockSize;

  // Create a buffer, and copy the data over.
  self->PackedVBO.resize(blockSize * (numPts + self->VertexCount));
  std::vector<float>::iterator it = self->PackedVBO.begin()
    + (self->VertexCount*self->Stride/sizeof(float));

  T *pointPtr;
  T2 *normalPtr;
  T3 *tcoordPtr;
  unsigned char *colorPtr;

  // TODO: optimize this somehow, lots of if statements in here
  for (vtkIdType i = 0; i < numPts; ++i)
    {
    pointPtr = points + i*3;
    normalPtr = normals + i*3;
    tcoordPtr = tcoords + i*textureComponents;
    colorPtr = colors + i*colorComponents;

    // Vertices
    *(it++) = *(pointPtr++);
    *(it++) = *(pointPtr++);
    *(it++) = *(pointPtr++);
    if (normals)
      {
      *(it++) = *(normalPtr++);
      *(it++) = *(normalPtr++);
      *(it++) = *(normalPtr++);
      }
    if (tcoords)
      {
      for (int j = 0; j < textureComponents; ++j)
        {
        *(it++) = *(tcoordPtr++);
        }
      }
    if (colors)
      {
      if (colorComponents == 4)
        {
        *(it++) = *reinterpret_cast<float *>(colorPtr);
        }
      else
        {
        vtkucfloat c;
        c.c[0] = *(colorPtr++);
        c.c[1] = *(colorPtr++);
        c.c[2] = *(colorPtr);
        c.c[3] =  255;
        *(it++) = c.f;
        }
      }
    }
  self->VertexCount += numPts;
}
*/

  publicAPI.setCoordShiftAndScaleMethod = shiftScaleMethod => {
    console.log('coordinate shift and scale not yet implemented');
  };

  publicAPI.setCoordShift = shiftArray => {
    console.log('coordinate shift and scale not yet implemented');
  };

  publicAPI.setCoordScale = scaleArray => {
    console.log('coordinate shift and scale not yet implemented');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  coordShift: [0, 0, 0],
  coordScale: [1, 1, 1],
  shiftScaleMethod: SHIFT_SCALE_METHOD.DISABLE_SHIFT_SCALE,
  coordShiftAndScaleEnabled: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  BufferObject.extend(publicAPI, model);

  macro.get(publicAPI, model, [
    'coordShiftAndScaleEnabled',
  ]);

  // macro.get(publicAPI, model, [
  //   { name: 'shiftScaleMethod', enum: SHIFT_SCALE_METHOD, type: 'enum' },
  // ]);

  macro.getArray(publicAPI, model, [
    'coordShift',
    'coordScale',
  ]);

  // Object specific methods
  vertexBufferObject(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
