import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
// import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';

import macro from 'vtk.js/Sources/macros';

// import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
// import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

// import vtkXMLPolyDataWriter from 'vtk.js/Sources/IO/XML/XMLPolyDataWriter';
// import vtkXMLWriter from 'vtk.js/Sources/IO/XML/XMLWriter';

import { MODES } from './Contants';

const { vtkWarningMacro } = macro;

// import vtkTextureLODsDownloader from 'vtk.js/Sources/Rendering/Misc/TextureLODsDownloader';

// https://github.com/RepComm/gltf-ts/blob/335c9932cfc2e80569e9f271986b957cb85dd759/src/gltf.ts#L339
// https://github.com/xeokit/xeokit-sdk/blob/master/src/plugins/GLTFLoaderPlugin/GLTFSceneGraphLoader.js
// https://github.com/Kitware/VTK/blob/master/IO/Geometry/vtkGLTFDocumentLoader.cxx
/**
 * @private
 */
class GLTFSceneLoader {
  constructor(data, sceneId, renderer) {
    this.data = data;
    this.sceneId = sceneId;
    this.renderer = renderer;
  }

  load() {
    this.createScene();
  }

  /**
   *
   */
  createScene() {
    const sceneInfo = this.data.scene || this.data.scenes[this.sceneId]; // Default use the first scene.
    console.log('createScene');
    console.log(sceneInfo);

    if (sceneInfo) {
      sceneInfo.nodes.forEach((node) => {
        if (node.matrix) {
          console.log('matrix');
        }

        if (node.translation) {
          console.log('translation');
        }

        if (node.rotation) {
          console.log('rotation');
        }

        if (node.scale) {
          console.log('scale');
        }

        this.createNode(node);
      });
    }
  }

  /**
   *
   * @param {*} node
   */
  createNode(node) {
    const hasChildNodes = node.children && node.children.length > 0;
    if (hasChildNodes) {
      const children = node.children;
      for (let i = 0, cl = children.length; i < cl; i++) {
        const child = children[i];
        this.createActor(child, node.matrix);
      }
    } else {
      this.createActor(node, node.matrix);
    }
  }

  /**
   *
   * @param {*} node
   * @param {*} matrix
   */
  createActor(node, matrix) {
    if (node.mesh) {
      // TODO: support mutiple primitives
      const primitive = node.mesh.primitives[0];
      const hasIndices =
        primitive.indices !== undefined && primitive.indices !== null;

      const hasPositions =
        primitive.attributes.position !== undefined &&
        primitive.attributes.position !== null;

      const hasTCoords0 =
        primitive.attributes.texcoord_0 !== undefined &&
        primitive.attributes.texcoord_0 !== null;

      const hasTCoords1 =
        primitive.attributes.texcoord_1 !== undefined &&
        primitive.attributes.texcoord_1 !== null;

      const hasColors =
        primitive.attributes.color_0 !== undefined &&
        primitive.attributes.color_0 !== null;

      console.log(primitive.attributes);

      const polyData = vtkPolyData.newInstance();
      const pointData = polyData.getPointData();

      if (hasPositions) {
        const positionArray = primitive.attributes.position.value;

        console.log(primitive.attributes.position);
        console.log(positionArray);

        polyData
          .getPoints()
          .setData(positionArray, primitive.attributes.position.component);

        /*
        let min = attributeInfo.min;
        let max = attributeInfo.max;
        if (min) {
          geometry.boundingBox.min.set(min[0], min[1], min[2]);
        }
        if (max) {
          geometry.boundingBox.max.set(max[0], max[1], max[2]);
        }
        */
      }

      if (hasIndices) {
        const indicesArray = primitive.indices.value;
        console.log(indicesArray);
        console.log(indicesArray.length);

        const cellArray = vtkCellArray.newInstance({ values: indicesArray });

        switch (primitive.mode) {
          case MODES.GL_TRIANGLES:
          case MODES.GL_TRIANGLE_FAN:
            polyData.setPolys(cellArray);
            break;
          case MODES.GL_LINES:
          case MODES.GL_LINE_STRIP:
          case MODES.GL_LINE_LOOP:
            polyData.setLines(cellArray);
            break;
          case MODES.GL_POINTS:
            polyData.setVerts(cellArray);
            break;
          case MODES.GL_TRIANGLE_STRIP:
            polyData.setStrips(cellArray);
            break;
          default:
            vtkWarningMacro(
              'Invalid primitive draw mode. Ignoring connectivity.'
            );
        }
      }

      // const tangentArray = primitive.attributes.tangent.value;
      // pointData.setTangents(
      //   vtkDataArray.newInstance({
      //     numberOfComponents: 3,
      //     values: tangentArray,
      //     name: 'Tangents',
      //   })
      // );

      if (hasTCoords0) {
        const tcoordsArray0 = primitive.attributes.texcoord_0.value;
        const da = vtkDataArray.newInstance({
          name: 'TextureCoordinates',
          values: tcoordsArray0,
          numberOfComponents: primitive.attributes.texcoord_0.components,
        });
        pointData.addArray(da);
        pointData.setActiveTCoords(da.getName());
      }

      if (hasTCoords1) {
        const tcoordsArray1 = primitive.attributes.texcoord_1.value;
        const da = vtkDataArray.newInstance({
          name: 'TextureCoordinates1',
          values: tcoordsArray1,
          numberOfComponents: primitive.attributes.texcoord_1.components,
        });
        pointData.addArray(da);
      }

      const normalsArray = primitive.attributes.normal.value;

      pointData.setNormals(
        vtkDataArray.newInstance({
          numberOfComponents: primitive.attributes.normal.components,
          name: 'Normals',
          values: normalsArray,
        })
      );

      if (hasColors) {
        const colorArray = primitive.attributes.color_0.value;
        pointData.setScalars(
          vtkDataArray.newInstance({
            numberOfComponents: primitive.attributes.color_0.components,
            name: 'Scalars',
            values: colorArray,
          })
        );
      }

      const actor = vtkActor.newInstance();
      const mapper = vtkMapper.newInstance();

      mapper.setInputData(polyData);
      actor.setMapper(mapper);

      // const img = new Image();
      // img.onload = () => {
      //   const texture = vtkTexture.newInstance();
      //   texture.setInterpolate(true);
      //   texture.setImage(img);
      //   actor.addTexture(texture);
      // };
      // img.src =
      //   primitive.material.pbrMetallicRoughness.baseColorTexture.texture.source.uri;

      this.renderer.addActor(actor);
      this.renderer.resetCamera();
    }
  }
}

export default GLTFSceneLoader;
