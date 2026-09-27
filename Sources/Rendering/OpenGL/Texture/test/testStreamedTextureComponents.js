import { describe, it, expect, vi } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

const size = 16;
const wholeExtent = [0, size - 1, 0, size - 1, 0, size - 1];
// Disjoint extents that all cross the reslice plane: rows of odd width, which
// leave RGB byte rows unaligned, a single row and a whole slice.
const extents = [
  [2, 4, 5, 9, 10, 12],
  [9, 13, 9, 9, 2, 6],
  [0, size - 1, 0, size - 1, 8, 8],
];
const colors = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
];
// One scalar type per upload path: bytes, 16 bit (norm16 where the GPU has
// it), floats, and a type converted to floats on the CPU.
const layouts = [Uint8Array, Int16Array, Float32Array, Float64Array].flatMap(
  (ArrayType) => [1, 2, 3, 4].map((components) => ({ ArrayType, components }))
);

function fillExtent(image, [x0, x1, y0, y1, z0, z1]) {
  const values = image.getPointData().getScalars().getData();
  for (let z = z0; z <= z1; z++) {
    for (let y = y0; y <= y1; y++) {
      const rowEnd = image.computeOffsetIndex([x1 + 1, y, z]);
      for (let i = image.computeOffsetIndex([x0, y, z]); i < rowEnd; i++) {
        values[i] = 16 + (i % 5) * 17;
      }
    }
  }
}

describe.each([
  ['volume', vtkVolume, vtkVolumeMapper],
  ['reslice', vtkImageSlice, vtkImageResliceMapper],
])('%s streaming', (name, Actor, Mapper) => {
  it.skipIf(__VTK_TEST_NO_WEBGL__).each(layouts)(
    'draws $components component $ArrayType.name updates like a full upload',
    async ({ ArrayType, components }) => {
      const gc = testUtils.createGarbageCollector();
      const { renderer, renderWindow, view } = createTrackedRenderView(gc);
      const gl = view.getContext();
      const image = gc.registerResource(vtkImageData.newInstance());
      image.setDimensions(size, size, size);
      // Values stay above zero so every reslice component has some weight.
      const values = ArrayType.from(
        { length: size ** 3 * components },
        (_, i) => 10 + (i % 7) * 12
      );
      const scalars = gc.registerResource(
        vtkDataArray.newInstance({ numberOfComponents: components, values })
      );
      image.getPointData().setScalars(scalars);
      const mapper = gc.registerResource(Mapper.newInstance());
      mapper.setInputData(image);
      const actor = gc.registerResource(Actor.newInstance());
      actor.setMapper(mapper);
      const property = actor.getProperty();
      colors.slice(0, components).forEach((rgb, c) => {
        const color = gc.registerResource(
          vtkColorTransferFunction.newInstance()
        );
        color.addRGBPoint(0, 0, 0, 0);
        color.addRGBPoint(100, ...rgb);
        const opacity = gc.registerResource(vtkPiecewiseFunction.newInstance());
        opacity.addPoint(0, 0);
        opacity.addPoint(100, 0.2);
        property.setRGBTransferFunction(c, color);
        property.setScalarOpacity(c, opacity);
      });
      if (name === 'reslice') {
        property.setIndependentComponents(true);
        property.setUseLookupTableScalarRange(true);
        mapper.setSlicePlane(
          gc.registerResource(
            vtkPlane.newInstance({
              origin: [7.5, 7.5, 7.5],
              normal: [1, 1, 1],
            })
          )
        );
      }
      renderer.addViewProp(actor);
      renderer.resetCamera();

      const fullUploads = vi.spyOn(gl, 'texImage3D');
      const partialUploads = vi.spyOn(gl, 'texSubImage3D');
      const render = async () => {
        fullUploads.mockClear();
        partialUploads.mockClear();
        const captured = view.captureNextImage();
        renderWindow.render();
        expect(gl.getError()).toBe(gl.NO_ERROR);
        const uploads = [
          ...fullUploads.mock.calls.map((a) => [0, 0, 0, ...a.slice(3, 6)]),
          ...partialUploads.mock.calls.map((a) => a.slice(2, 8)),
        ].map(([x, y, z, w, h, d]) => [
          x,
          x + w - 1,
          y,
          y + h - 1,
          z,
          z + d - 1,
        ]);
        return { image: await captured, uploads };
      };

      // Streaming patches the texture allocated by the first render.
      const first = await render();
      extents.forEach((extent) => fillExtent(image, extent));
      scalars.dataChange();
      property.setUpdatedExtents(extents);
      const streamed = await render();
      expect(streamed.uploads).toEqual(extents);
      expect(streamed.image).not.toBe(first.image);

      scalars.modified();
      expect(await render()).toEqual({
        image: streamed.image,
        uploads: [wholeExtent],
      });
    }
  );
});
