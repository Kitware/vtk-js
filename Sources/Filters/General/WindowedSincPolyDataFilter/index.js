import macro from 'vtk.js/Sources/macros';

import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath from 'vtk.js/Sources/Common/Core/Math/index';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';

const VertexType = {
  VTK_SIMPLE_VERTEX: 0,
  VTK_FIXED_VERTEX: 1,
  VTK_FEATURE_EDGE_VERTEX: 2,
  VTK_BOUNDARY_EDGE_VERTEX: 3,
};

// ----------------------------------------------------------------------------
// vtkWindowedSincPolyDataFilter methods
// ----------------------------------------------------------------------------

function vtkWindowedSincPolyDataFilter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWindowedSincPolyDataFilter');

  publicAPI.vtkWindowedSincPolyDataFilterExecute = (
    inPts,
    inputPolyData,
    output
  ) => {
    if (!inPts || model.numberOfIterations <= 0) {
      return inPts;
    }
    const inPtsData = inPts.getData();

    const inVerts = inputPolyData.getVerts().getData();
    const inLines = inputPolyData.getLines().getData();
    const inPolys = inputPolyData.getPolys().getData();
    const inStrips = inputPolyData.getStrips().getData();

    const cosFeatureAngle = Math.cos(
      vtkMath.radiansFromDegrees(model.featureAngle)
    );
    const cosEdgeAngle = Math.cos(vtkMath.radiansFromDegrees(model.edgeAngle));

    const numPts = inPts.getNumberOfPoints();

    // Perform topological analysis. What we're going to do is build a connectivity
    // array of connected vertices. The outcome will be one of three
    // classifications for a vertex: VTK_SIMPLE_VERTEX, VTK_FIXED_VERTEX. or
    // VTK_EDGE_VERTEX. Simple vertices are smoothed using all connected
    // vertices. FIXED vertices are never smoothed. Edge vertices are smoothed
    // using a subset of the attached vertices.
    const verts = new Array(numPts);
    for (let i = 0; i < numPts; ++i) {
      verts[i] = {
        type: VertexType.VTK_SIMPLE_VERTEX,
        edges: null,
      };
    }

    // check vertices first. Vertices are never smoothed_--------------
    let npts = 0;
    for (let i = 0; i < inVerts.length; i += npts + 1) {
      npts = inVerts[i];
      const pts = inVerts.slice(i + 1, i + 1 + npts);
      for (let j = 0; j < pts.length; ++j) {
        verts[pts[j]].type = VertexType.VTK_FIXED_VERTEX;
      }
    }

    // now check lines. Only manifold lines can be smoothed------------
    for (let i = 0; i < inLines.length; i += npts + 1) {
      npts = inLines[i];
      const pts = inLines.slice(i + 1, i + 1 + npts);

      // Check for closed loop which are treated specially. Basically the
      // last point is ignored (set to fixed).
      const closedLoop = pts[0] === pts[npts - 1] && npts > 3;

      for (let j = 0; j < npts; ++j) {
        if (verts[pts[j]].type === VertexType.VTK_SIMPLE_VERTEX) {
          // First point
          if (j === 0) {
            if (!closedLoop) {
              verts[pts[0]].type = VertexType.VTK_FIXED_VERTEX;
            } else {
              verts[pts[0]].type = VertexType.VTK_FEATURE_EDGE_VERTEX;
              verts[pts[0]].edges = [pts[npts - 2], pts[1]];
            }
          }
          // Last point
          else if (j === npts - 1 && !closedLoop) {
            verts[pts[j]].type = VertexType.VTK_FIXED_VERTEX;
          }
          // In between point // is edge vertex (unless already edge vertex!)
          else {
            verts[pts[j]].type = VertexType.VTK_FEATURE_EDGE_VERTEX;
            verts[pts[j]].edges = [
              pts[j - 1],
              pts[closedLoop && j === npts - 2 ? 0 : j + 1],
            ];
          }
        } // if simple vertex

        // Vertex has been visited before, need to fix it. Special case
        // when working on closed loop.
        else if (
          verts[pts[j]].type === VertexType.VTK_FEATURE_EDGE_VERTEX &&
          !(closedLoop && j === npts - 1)
        ) {
          verts[pts[j]].type = VertexType.VTK_FIXED_VERTEX;
          verts[pts[j]].edges = null;
        }
      } // for all points in this line
    } // for all lines

    // now polygons and triangle strips-------------------------------
    const numPolys = inPolys.length;
    const numStrips = inStrips.length;
    if (numPolys > 0 || numStrips > 0) {
      const inMesh = vtkPolyData.newInstance();
      inMesh.setPoints(inputPolyData.getPoints());
      inMesh.setPolys(inputPolyData.getPolys());
      const mesh = inMesh;

      let neighbors = [];
      let nei = 0;
      // const numNeiPts = 0;
      const normal = [];
      const neiNormal = [];

      /* TODO: Add vtkTriangleFilter
      if ( (numStrips = inputPolyData.getStrips().GetNumberOfCells()) > 0 )
      { // convert data to triangles
        inMesh.setStrips(inputPolyData.getStrips());
        const toTris = vtkTriangleFilter.newInstance();
        toTris.setInputData(inMesh);
        toTris.update();
        mesh = toTris.getOutput();
      }
      */

      mesh.buildLinks(); // to do neighborhood searching
      const polys = mesh.getPolys().getData();

      let cellId = 0;
      for (let c = 0; c < polys.length; c += npts + 1, ++cellId) {
        npts = polys[c];
        const pts = polys.slice(c + 1, c + 1 + npts);

        for (let i = 0; i < npts; ++i) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % npts];

          if (verts[p1].edges === null) {
            verts[p1].edges = [];
          }
          if (verts[p2].edges == null) {
            verts[p2].edges = [];
          }

          neighbors = mesh.getCellEdgeNeighbors(cellId, p1, p2);
          const numNei = neighbors.length; // neighbors->GetNumberOfIds();

          let edge = VertexType.VTK_SIMPLE_VERTEX;
          if (numNei === 0) {
            edge = VertexType.VTK_BOUNDARY_EDGE_VERTEX;
          } else if (numNei >= 2) {
            // non-manifold case, check nonmanifold smoothing state
            if (!model.nonManifoldSmoothing) {
              // check to make sure that this edge hasn't been marked already
              let j = 0;
              for (; j < numNei; ++j) {
                if (neighbors[j] < cellId) {
                  break;
                }
              }
              if (j >= numNei) {
                edge = VertexType.VTK_FEATURE_EDGE_VERTEX;
              }
            }
            /* eslint-disable no-cond-assign */
          } else if (numNei === 1 && (nei = neighbors[0]) > cellId) {
            if (model.featureEdgeSmoothing) {
              // TODO: support polygons
              // vtkPolygon::ComputeNormal(inPts,npts,pts,normal);
              vtkTriangle.computeNormal(
                [...inPts.getPoint(pts[0])],
                [...inPts.getPoint(pts[1])],
                [...inPts.getPoint(pts[2])],
                normal
              );
              const { cellPointIds } = mesh.getCellPoints(nei);
              // vtkPolygon::ComputeNormal(inPts,numNeiPts,neiPts,neiNormal);
              vtkTriangle.computeNormal(
                [...inPts.getPoint(cellPointIds[0])],
                [...inPts.getPoint(cellPointIds[1])],
                [...inPts.getPoint(cellPointIds[2])],
                neiNormal
              );

              if (vtkMath.dot(normal, neiNormal) <= cosFeatureAngle) {
                edge = VertexType.VTK_FEATURE_EDGE_VERTEX;
              }
            }
          } // a visited edge; skip rest of analysis
          else {
            /* eslint-disable no-continue */
            continue;
          }

          if (edge && verts[p1].type === VertexType.VTK_SIMPLE_VERTEX) {
            verts[p1].edges = [p2];
            verts[p1].type = edge;
          } else if (
            (edge && verts[p1].type === VertexType.VTK_BOUNDARY_EDGE_VERTEX) ||
            (edge && verts[p1].type === VertexType.VTK_FEATURE_EDGE_VERTEX) ||
            (!edge && verts[p1].type === VertexType.VTK_SIMPLE_VERTEX)
          ) {
            verts[p1].edges.push(p2);
            if (
              verts[p1].type &&
              edge === VertexType.VTK_BOUNDARY_EDGE_VERTEX
            ) {
              verts[p1].type = VertexType.VTK_BOUNDARY_EDGE_VERTEX;
            }
          }
          if (edge && verts[p2].type === VertexType.VTK_SIMPLE_VERTEX) {
            verts[p2].edges = [p1];
            verts[p2].type = edge;
          } else if (
            (edge && verts[p2].type === VertexType.VTK_BOUNDARY_EDGE_VERTEX) ||
            (edge && verts[p2].type === VertexType.VTK_FEATURE_EDGE_VERTEX) ||
            (!edge && verts[p2].type === VertexType.VTK_SIMPLE_VERTEX)
          ) {
            verts[p2].edges.push(p1);
            if (
              verts[p2].type &&
              edge === VertexType.VTK_BOUNDARY_EDGE_VERTEX
            ) {
              verts[p2].type = VertexType.VTK_BOUNDARY_EDGE_VERTEX;
            }
          }
        }
      }
    } // if strips or polys

    // post-process edge vertices to make sure we can smooth them
    /* eslint-disable no-unused-vars */
    let numSimple = 0;
    let numBEdges = 0;
    let numFixed = 0;
    let numFEdges = 0;
    for (let i = 0; i < numPts; ++i) {
      if (verts[i].type === VertexType.VTK_SIMPLE_VERTEX) {
        ++numSimple;
      } else if (verts[i].type === VertexType.VTK_FIXED_VERTEX) {
        ++numFixed;
      } else if (
        verts[i].type === VertexType.VTK_FEATURE_EDGE_VERTEX ||
        verts[i].type === VertexType.VTK_BOUNDARY_EDGE_VERTEX
      ) {
        // see how many edges; if two, what the angle is

        if (
          !model.boundarySmoothing &&
          verts[i].type === VertexType.VTK_BOUNDARY_EDGE_VERTEX
        ) {
          verts[i].type = VertexType.VTK_FIXED_VERTEX;
          ++numBEdges;
        } else if ((npts = verts[i].edges.length) !== 2) {
          // can only smooth edges on 2-manifold surfaces
          verts[i].type = VertexType.VTK_FIXED_VERTEX;
          ++numFixed;
        } // check angle between edges
        else {
          const x1 = [0, 0, 0];
          inPts.getPoint(verts[i].edges[0], x1);
          const x2 = [0, 0, 0];
          inPts.getPoint(i, x2);
          const x3 = [0, 0, 0];
          inPts.getPoint(verts[i].edges[1], x3);

          const l1 = [0, 0, 0];
          const l2 = [0, 0, 0];
          for (let k = 0; k < 3; ++k) {
            l1[k] = x2[k] - x1[k];
            l2[k] = x3[k] - x2[k];
          }
          if (
            vtkMath.normalize(l1) >= 0.0 &&
            vtkMath.normalize(l2) >= 0.0 &&
            vtkMath.dot(l1, l2) < cosEdgeAngle
          ) {
            ++numFixed;
            verts[i].type = VertexType.VTK_FIXED_VERTEX;
          } else if (verts[i].type === VertexType.VTK_FEATURE_EDGE_VERTEX) {
            ++numFEdges;
          } else {
            ++numBEdges;
          }
        } // if along edge
      } // if edge vertex
    } // for all points

    // Perform Windowed Sinc function interpolation
    //
    // console.log('Beginning smoothing iterations...');
    // need 4 vectors of points
    let zero = 0;
    let one = 1;
    let two = 2;
    const three = 3;

    const newPts = [];
    newPts.push(vtkPoints.newInstance());
    newPts[zero].setNumberOfPoints(numPts);
    newPts.push(vtkPoints.newInstance());
    newPts[one].setNumberOfPoints(numPts);
    newPts.push(vtkPoints.newInstance());
    newPts[two].setNumberOfPoints(numPts);
    newPts.push(vtkPoints.newInstance());
    newPts[three].setNumberOfPoints(numPts);

    // Get the center and length of the input dataset
    const inCenter = vtkBoundingBox.getCenter(inputPolyData.getBounds());
    const inLength = vtkBoundingBox.getDiagonalLength(
      inputPolyData.getBounds()
    );

    if (!model.normalizeCoordinates) {
      // initialize to old coordinates
      // for (let i = 0; i < numPts; ++i) {
      //   newPts[zero].setPoint(i, inPts.subarray(i));
      // }
      const copy = macro.newTypedArray(newPts[zero].getDataType(), inPtsData);
      newPts[zero].setData(copy, 3);
    } else {
      // center the data and scale to be within unit cube [-1, 1]
      // initialize to old coordinates
      const normalizedPoint = [0, 0, 0];
      for (let i = 0; i < numPts; ++i) {
        inPts.getPoint(i, normalizedPoint);
        normalizedPoint[0] = (normalizedPoint[0] - inCenter[0]) / inLength;
        normalizedPoint[1] = (normalizedPoint[1] - inCenter[1]) / inLength;
        normalizedPoint[2] = (normalizedPoint[2] - inCenter[2]) / inLength;
        newPts[zero].setPoint(i, ...normalizedPoint);
      }
    }

    // Smooth with a low pass filter defined as a windowed sinc function.
    // Taubin describes this methodology is the IBM tech report RC-20404
    // (#90237, dated 3/12/96) "Optimal Surface Smoothing as Filter Design"
    // G. Taubin, T. Zhang and G. Golub. (Zhang and Golub are at Stanford
    // University)

    // The formulas here follow the notation of Taubin's TR, i.e.
    // newPts[zero], newPts[one], etc.

    // calculate weights and filter coefficients
    const kPb = model.passBand; // reasonable default for kPb in [0, 2] is 0.1
    const thetaPb = Math.acos(1.0 - 0.5 * kPb); // thetaPb in [0, M_PI/2]

    // vtkDebugMacro(<< "thetaPb = " << thetaPb);

    const w = new Array(model.numberOfIterations + 1);
    const c = new Array(model.numberOfIterations + 1);
    const cprime = new Array(model.numberOfIterations + 1);

    const zerovector = [0, 0, 0];

    // Calculate the weights and the Chebychev coefficients c.
    //

    // Windowed sinc function weights. This is for a Hamming window. Other
    // windowing function could be implemented here.
    for (let i = 0; i <= model.numberOfIterations; ++i) {
      w[i] =
        0.54 + 0.46 * Math.cos((i * Math.PI) / (model.numberOfIterations + 1));
    }

    // Calculate the optimal sigma (offset or fudge factor for the filter).
    // This is a Newton-Raphson Search.
    let fKpb = 0;
    let fPrimeKpb = 0;
    let done = false;
    let sigma = 0.0;

    for (let j = 0; !done && j < 500; ++j) {
      // Chebyshev coefficients
      c[0] = (w[0] * (thetaPb + sigma)) / Math.PI;
      for (let i = 1; i <= model.numberOfIterations; ++i) {
        c[i] = (2.0 * w[i] * Math.sin(i * (thetaPb + sigma))) / (i * Math.PI);
      }

      // calculate the Chebyshev coefficients for the derivative of the filter
      cprime[model.numberOfIterations] = 0.0;
      cprime[model.numberOfIterations - 1] = 0.0;
      if (model.numberOfIterations > 1) {
        cprime[model.numberOfIterations - 2] =
          2.0 *
          (model.numberOfIterations - 1) *
          c[model.numberOfIterations - 1];
      }
      for (let i = model.numberOfIterations - 3; i >= 0; --i) {
        cprime[i] = cprime[i + 2] + 2.0 * (i + 1) * c[i + 1];
      }
      // Evaluate the filter and its derivative at kPb (note the discrepancy
      // of calculating the c's based on thetaPb + sigma and evaluating the
      // filter at kPb (which is equivalent to thetaPb)
      fKpb = 0.0;
      fPrimeKpb = 0.0;
      fKpb += c[0];
      fPrimeKpb += cprime[0];
      for (let i = 1; i <= model.numberOfIterations; ++i) {
        if (i === 1) {
          fKpb += c[i] * (1.0 - 0.5 * kPb);
          fPrimeKpb += cprime[i] * (1.0 - 0.5 * kPb);
        } else {
          fKpb += c[i] * Math.cos(i * Math.acos(1.0 - 0.5 * kPb));
          fPrimeKpb += cprime[i] * Math.cos(i * Math.acos(1.0 - 0.5 * kPb));
        }
      }
      // if fKpb is not close enough to 1.0, then adjust sigma
      if (model.numberOfIterations > 1) {
        if (Math.abs(fKpb - 1.0) >= 1e-3) {
          sigma -= (fKpb - 1.0) / fPrimeKpb; // Newton-Rhapson (want f=1)
        } else {
          done = true;
        }
      } else {
        // Order of Chebyshev is 1. Can't use Newton-Raphson to find an
        // optimal sigma. Object will most likely shrink.
        done = true;
        sigma = 0.0;
      }
    }
    if (Math.abs(fKpb - 1.0) >= 1e-3) {
      console.log(
        'An optimal offset for the smoothing filter could not be found.  Unpredictable smoothing/shrinkage may result.'
      );
    }

    const x = [0, 0, 0];
    const y = [0, 0, 0];
    const deltaX = [0, 0, 0];
    const xNew = [0, 0, 0];
    const x1 = [0, 0, 0];
    const x2 = [0, 0, 0];

    // first iteration
    for (let i = 0; i < numPts; ++i) {
      if (verts[i].edges != null && (npts = verts[i].edges.length) > 0) {
        // point is allowed to move
        newPts[zero].getPoint(i, x); // use current points
        deltaX[0] = 0.0;
        deltaX[1] = 0.0;
        deltaX[2] = 0.0;

        // calculate the negative of the laplacian
        // for all connected points
        for (let j = 0; j < npts; ++j) {
          newPts[zero].getPoint(verts[i].edges[j], y);
          for (let k = 0; k < 3; ++k) {
            deltaX[k] += (x[k] - y[k]) / npts;
          }
        }
        // newPts[one] = newPts[zero] - 0.5 newPts[one]
        for (let k = 0; k < 3; ++k) {
          deltaX[k] = x[k] - 0.5 * deltaX[k];
        }
        newPts[one].setPoint(i, ...deltaX);

        if (verts[i].type === VertexType.VTK_FIXED_VERTEX) {
          newPts[zero].getPoint(i, deltaX);
        } else {
          // calculate newPts[three] = c0 newPts[zero] + c1 newPts[one]
          for (let k = 0; k < 3; ++k) {
            deltaX[k] = c[0] * x[k] + c[1] * deltaX[k];
          }
        }
        newPts[three].setPoint(i, ...deltaX);
      } // if can move point
      else {
        // point is not allowed to move, just use the old point...
        // (zero out the Laplacian)
        newPts[one].setPoint(i, ...zerovector);
        newPts[zero].getPoint(i, deltaX);
        newPts[three].setPoint(i, ...deltaX);
      }
    } // for all points

    // for the rest of the iterations
    const pX0 = [0, 0, 0];
    const pX1 = [0, 0, 0];
    const pX3 = [0, 0, 0];
    let iterationNumber = 2;
    for (; iterationNumber <= model.numberOfIterations; iterationNumber++) {
      if (iterationNumber && !(iterationNumber % 5)) {
        // this->UpdateProgress (0.5 + 0.5*iterationNumber/this->NumberOfIterations);
        // if (this->GetAbortExecute())
        // {
        //  break;
        // }
      }

      for (let i = 0; i < numPts; ++i) {
        npts = verts[i].edges != null ? verts[i].edges.length : 0;
        if (npts > 0) {
          // point is allowed to move
          newPts[zero].getPoint(i, pX0); // use current points
          newPts[one].getPoint(i, pX1);

          deltaX[0] = 0.0;
          deltaX[1] = 0.0;
          deltaX[2] = 0.0;

          // calculate the negative laplacian of x1
          for (let j = 0; j < npts; ++j) {
            newPts[one].getPoint(verts[i].edges[j], y);
            for (let k = 0; k < 3; ++k) {
              deltaX[k] += (pX1[k] - y[k]) / npts;
            }
          } // for all connected points

          // Taubin:  x2 = (x1 - x0) + (x1 - x2)
          for (let k = 0; k < 3; ++k) {
            deltaX[k] = pX1[k] - pX0[k] + pX1[k] - deltaX[k];
          }
          newPts[two].setPoint(i, ...deltaX);

          // smooth the vertex (x3 = x3 + cj x2)
          newPts[three].getPoint(i, pX3);
          for (let k = 0; k < 3; ++k) {
            xNew[k] = pX3[k] + c[iterationNumber] * deltaX[k];
          }
          if (verts[i].type !== VertexType.VTK_FIXED_VERTEX) {
            newPts[three].setPoint(i, ...xNew);
          }
        } // if can move point
        else {
          // point is not allowed to move, just use the old point...
          // (zero out the Laplacian)
          newPts[one].setPoint(i, ...zerovector);
          newPts[two].setPoint(i, ...zerovector);
        }
      } // for all points

      // update the pointers. three is always three. all other pointers
      // shift by one and wrap.
      zero = (1 + zero) % 3;
      one = (1 + one) % 3;
      two = (1 + two) % 3;
    } // for all iterations or until converge

    // move the iteration count back down so that it matches the
    // actual number of iterations executed
    --iterationNumber;

    // set zero to three so the correct set of positions is outputted
    zero = three;

    // console.log('Performed', iterationNumber, 'smoothing passes');
    // if we scaled the data down to the unit cube, then scale data back
    // up to the original space
    if (model.normalizeCoordinates) {
      // Re-position the coordinated
      const repositionedPoint = [0, 0, 0];
      for (let i = 0; i < numPts; ++i) {
        newPts[zero].getPoint(i, repositionedPoint);
        for (let j = 0; j < 3; ++j) {
          repositionedPoint[j] = repositionedPoint[j] * inLength + inCenter[j];
        }
        newPts[zero].setPoint(i, ...repositionedPoint);
      }
    }

    if (model.generateErrorScalars) {
      const newScalars = new Float32Array(numPts);

      for (let i = 0; i < numPts; ++i) {
        inPts.getPoint(i, x1);
        newPts[zero].getPoint(i, x2);
        newScalars[i] = Math.sqrt(Math.distance2BetweenPoints(x1, x2));
      }

      const newScalarsArray = vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: newScalars,
      });

      const idx = output.getPointData().addArray(newScalarsArray);
      output.getPointData().setActiveAttribute(idx, AttributeTypes.SCALARS);
    }

    if (model.generateErrorVectors) {
      const newVectors = new Float32Array(3 * numPts);
      for (let i = 0; i < numPts; ++i) {
        inPts.getPoint(i, x1);
        newPts[zero].getPoint(i, x2);
        for (let j = 0; j < 3; ++j) {
          newVectors[3 * i + j] = x2[j] - x1[j];
        }
      }

      const newVectorsArray = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: newVectors,
      });

      output.getPointData().setVectors(newVectorsArray);
    }

    return newPts[zero];
  };

  publicAPI.requestData = (inData, outData) => {
    const numberOfInputs = publicAPI.getNumberOfInputPorts();

    if (!numberOfInputs) {
      return;
    }

    const input = inData[0];

    if (!input) {
      return;
    }
    const output = vtkPolyData.newInstance();

    const outputPoints = publicAPI.vtkWindowedSincPolyDataFilterExecute(
      input.getPoints(),
      input,
      output
    );

    output.setPointData(input.getPointData());
    output.setCellData(input.getCellData());
    output.setFieldData(input.getFieldData());
    output.setPoints(outputPoints);
    output.setVerts(input.getVerts());
    output.setLines(input.getLines());
    output.setPolys(input.getPolys());
    output.setStrips(input.getStrips());

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  numberOfIterations: 20,
  passBand: 0.1,
  featureAngle: 45.0,
  edgeAngle: 15.0,
  featureEdgeSmoothing: 0,
  boundarySmoothing: 1,
  nonManifoldSmoothing: 0,
  generateErrorScalars: 0,
  generateErrorVectors: 0,
  normalizeCoordinates: 0,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  /* Make this a VTK object */

  macro.obj(publicAPI, model);

  /* Also make it an algorithm with one input and one output */

  macro.algo(publicAPI, model, 1, 1);

  /* Setters */
  macro.setGet(publicAPI, model, [
    'numberOfIterations',
    'passBand',
    'featureAngle',
    'edgeAngle',
    'featureEdgeSmoothing',
    'boundarySmoothing',
    'nonManifoldSmoothing',
    'generateErrorScalars',
    'generateErrorVectors',
    'normalizeCoordinates',
  ]);

  /* Object specific methods */

  vtkWindowedSincPolyDataFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWindowedSincPolyDataFilter'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
