import macro from 'vtk.js/Sources/macros';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkAbstractPointLocator from 'vtk.js/Sources/Common/DataModel/AbstractPointLocator';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPointLocator methods
// ----------------------------------------------------------------------------

function vtkPointLocator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPointLocator');

  /**
   * Calculate the squared distance from point x to the bucket "nei".
   * @param {Vector3} x  The point coordinates
   * @param {Vector3} nei The bucket coordinates
   * @returns {Number} The squared distance to the bucket
   */
  function distance2ToBucket(x, nei) {
    // Compute bucket bounds
    const bounds = [
      nei[0] * model.HX + model.BX,
      (nei[0] + 1) * model.HX + model.BX,
      nei[1] * model.HY + model.BY,
      (nei[1] + 1) * model.HY + model.BY,
      nei[2] * model.HZ + model.BZ,
      (nei[2] + 1) * model.HZ + model.BZ,
    ];
    return vtkBoundingBox.distance2ToBounds(x, bounds);
  }

  /**
   * Get the neighboring buckets for a given bucket index.
   * @param {Number[]} ijk The bucket index
   * @param {Number[]} ndivs The number of divisions in each dimension
   * @param {Number} level The level of neighbors to retrieve
   * @returns An array of neighboring bucket indices
   */
  function getBucketNeighbors(ijk, ndivs, level) {
    const buckets = [];
    if (level === 0) {
      buckets.push([...ijk]);
      return buckets;
    }
    const minLevel = [];
    const maxLevel = [];
    for (let i = 0; i < 3; i++) {
      const min = ijk[i] - level;
      const max = ijk[i] + level;
      minLevel[i] = min > 0 ? min : 0;
      maxLevel[i] = max < ndivs[i] - 1 ? max : ndivs[i] - 1;
    }
    for (let i = minLevel[0]; i <= maxLevel[0]; i++) {
      for (let j = minLevel[1]; j <= maxLevel[1]; j++) {
        for (let k = minLevel[2]; k <= maxLevel[2]; k++) {
          if (
            i === ijk[0] + level ||
            i === ijk[0] - level ||
            j === ijk[1] + level ||
            j === ijk[1] - level ||
            k === ijk[2] + level ||
            k === ijk[2] - level
          ) {
            buckets.push([i, j, k]);
          }
        }
      }
    }
    return buckets;
  }

  /**
   * Calculate the overlapping buckets for a given point and distance.
   * @param {Vector3} x  The point coordinates
   * @param {*} ijk  The bucket index
   * @param {*} dist  The search distance
   * @param {*} level  The level of detail
   * @returns  An array of overlapping bucket indices
   */
  function getOverlappingBuckets(x, ijk, dist, level) {
    const buckets = [];

    const xBounds = [x[0], x[0], x[1], x[1], x[2], x[2]];
    const bbox = vtkBoundingBox.newInstance();
    bbox.setBounds(xBounds);
    bbox.inflate(dist);

    const ijkBounds = [ijk[0], ijk[0], ijk[1], ijk[1], ijk[2], ijk[2]];
    const ijkBox = vtkBoundingBox.newInstance();
    ijkBox.setBounds(ijkBounds);
    ijkBox.inflate(level);

    const minLevel = publicAPI.getBucketIndices([
      bbox.getBounds()[0],
      bbox.getBounds()[2],
      bbox.getBounds()[4],
    ]);
    const maxLevel = publicAPI.getBucketIndices([
      bbox.getBounds()[1],
      bbox.getBounds()[3],
      bbox.getBounds()[5],
    ]);

    // Iterate through potential buckets
    for (let i = minLevel[0]; i <= maxLevel[0]; i++) {
      for (let j = minLevel[1]; j <= maxLevel[1]; j++) {
        for (let k = minLevel[2]; k <= maxLevel[2]; k++) {
          if (!ijkBox.containsPoint(i, j, k)) {
            buckets.push([i, j, k]);
          }
        }
      }
    }

    return buckets;
  }

  /**
   * Get the bucket index for a given bucket coordinate.
   * @param {Number[]} ijk The bucket index
   * @returns The bucket index
   */
  function getBucketIndex(ijk) {
    return ijk[0] + ijk[1] * model.XD + ijk[2] * model.sliceSize;
  }

  /**
   * Get the bucket indices for a given point.
   * @param {Vector3} point The point coordinates
   * @returns The bucket indices
   */
  publicAPI.getBucketIndices = (point) => {
    const ix = Math.floor((point[0] - model.BX) * model.FX);
    const iy = Math.floor((point[1] - model.BY) * model.FY);
    const iz = Math.floor((point[2] - model.BZ) * model.FZ);
    const ijk = [];
    ijk[0] = Math.max(0, Math.min(ix, model.XD - 1));
    ijk[1] = Math.max(0, Math.min(iy, model.YD - 1));
    ijk[2] = Math.max(0, Math.min(iz, model.ZD - 1));
    return ijk;
  };

  /**
   * Get the bucket index for a given point.
   * @param {Vector3} point The point coordinates
   * @returns The bucket index
   */
  publicAPI.getBucketIndex = (point) => {
    const ijk = publicAPI.getBucketIndices(point);
    return getBucketIndex(ijk);
  };

  /**
   * Build the locator from the input dataset.
   */
  publicAPI.buildLocator = () => {
    model.level = 1;
    const bounds = model.dataSet.getBounds();
    const numPts = model.dataSet.getNumberOfPoints();

    let numBuckets = Math.ceil(numPts / model.numberOfPointsPerBucket);

    const ndivs = [0, 0, 0];
    const bbox = vtkBoundingBox.newInstance();
    bbox.setBounds(bounds);

    if (model.automatic) {
      bbox.computeDivisions(numBuckets, ndivs, model.bounds);
    } else {
      model.bounds = bbox.inflate();
      for (let i = 0; i < 3; i++) {
        ndivs[i] = Math.max(1, model.divisions[i]);
      }
    }

    model.divisions = ndivs;
    numBuckets = ndivs[0] * ndivs[1] * ndivs[2];
    model.numberOfBuckets = numBuckets;

    // Compute width of bucket in three directions
    for (let i = 0; i < 3; ++i) {
      model.H[i] = (model.bounds[2 * i + 1] - model.bounds[2 * i]) / ndivs[i];
    }

    model.hashTable.clear();

    publicAPI.computePerformanceFactors();

    for (let i = 0; i < numPts; ++i) {
      const pt = model.dataSet.getPoints().getPoint(i);
      const key = publicAPI.getBucketIndex(pt);
      if (!model.hashTable.has(key)) {
        model.hashTable.set(key, []); // Initialize bucket if it doesn't exist
      }
      const bucket = model.hashTable.get(key);
      bucket.push(i);
    }
  };

  publicAPI.initialize = () => {
    model.points = null;
    publicAPI.freeSearchStructure();
  };

  /**
   * Initialize point insertion.
   * @param {*} points The points to insert
   * @param {Bounds} bounds The bounds for the points
   * @param {Number} estNumPts Estimated number of points for insertion
   */
  publicAPI.initPointInsertion = (points, bounds, estNumPts = 0) => {
    if (points == null) {
      vtkErrorMacro('A valid vtkPoints object is required for point insertion');
      return false;
    }

    if (!bounds || bounds.length !== 6) {
      vtkErrorMacro('A valid bounds array of length 6 is required');
      return false;
    }

    if (!points) {
      vtkErrorMacro('A valid vtkPoints is required for point insertion');
      return false;
    }

    publicAPI.freeSearchStructure();
    model.insertionPointId = 0;
    model.points = points;
    model.points.setNumberOfComponents(3);
    model.points.initialize();

    let numBuckets = 0;
    const ndivs = [0, 0, 0];
    const bbox = vtkBoundingBox.newInstance();
    bbox.setBounds(bounds);

    if (model.automatic && estNumPts > 0) {
      numBuckets = Math.ceil(estNumPts / model.numberOfPointsPerBucket);
      bbox.computeDivisions(numBuckets, ndivs, model.bounds);
    } else {
      model.bounds = bbox.inflate();
      for (let i = 0; i < 3; i++) {
        ndivs[i] = Math.max(1, model.divisions[i]);
      }
    }

    model.divisions = ndivs;
    numBuckets = ndivs[0] * ndivs[1] * ndivs[2];
    model.numberOfBuckets = numBuckets;

    // Compute width of bucket in three directions
    for (let i = 0; i < 3; ++i) {
      model.H[i] = (model.bounds[2 * i + 1] - model.bounds[2 * i]) / ndivs[i];
    }

    model.insertionTol2 = model.tolerance * model.tolerance;

    let maxDivs = 0;
    let hmin = Number.MAX_VALUE;
    for (let i = 0; i < 3; i++) {
      hmin = model.H[i] < hmin ? model.H[i] : hmin;
      maxDivs = maxDivs > model.divisions[i] ? maxDivs : model.divisions[i];
    }
    model.insertionLevel = Math.ceil(model.tolerance / hmin);
    model.insertionLevel =
      model.insertionLevel > maxDivs ? maxDivs : model.insertionLevel;

    publicAPI.computePerformanceFactors();

    return true;
  };

  /**
   * Insert a point into the point locator.
   * If the point is already present, it returns the existing ID.
   * Otherwise, it inserts the point and returns a new ID.
   *
   * @param {Number} ptId The index of the point to insert.
   * @param {Vector3} x The point to insert.
   * @returns {IInsertPointResult} An object indicating if the point was inserted and its ID.
   */
  publicAPI.insertPoint = (ptId, x) => {
    const key = publicAPI.getBucketIndex(x);
    if (!model.hashTable.has(key)) {
      model.hashTable.set(key, []);
    }
    const bucket = model.hashTable.get(key);
    bucket.push(ptId);
    model.points.insertPoint(ptId, x);
    return { inserted: true, id: ptId };
  };

  /**
   * Insert a point into the point locator.
   * If the point is already present, it returns the existing ID.
   * Otherwise, it inserts the point and returns a new ID.
   *
   * @param {Vector3} x The point to insert.
   * @returns {IInsertPointResult} An object indicating if the point was inserted and its ID.
   */
  publicAPI.insertNextPoint = (x) => {
    const key = publicAPI.getBucketIndex(x);
    if (!model.hashTable.has(key)) {
      model.hashTable.set(key, []);
    }
    const bucket = model.hashTable.get(key);
    bucket.push(model.insertionPointId);
    model.points.insertPoint(model.insertionPointId, x);
    return { inserted: true, id: model.insertionPointId++ };
  };

  /**
   * Insert a point into the point locator.
   * If the point is already present, it returns the existing ID.
   * Otherwise, it inserts the point and returns a new ID.
   *
   * @param {Vector3} x The point to insert.
   * @returns {IInsertPointResult} An object indicating if the point was inserted and its ID.
   */
  publicAPI.insertUniquePoint = (x) => {
    const ptId = publicAPI.isInsertedPoint(x);

    if (ptId > -1) {
      // Point already exists
      return { inserted: false, id: ptId };
    }
    // Insert new point
    const ret = publicAPI.insertNextPoint(x);
    return ret;
  };

  /**
   * Check if a point is already inserted in the point locator.
   *
   * @param {Vector3} x The point to check.
   * @returns {Number} The ID of the point if it exists, otherwise -1.
   */
  publicAPI.isInsertedPoint = (x) => {
    const ijk = publicAPI.getBucketIndices(x);

    // The number and level of neighbors to search depends upon the tolerance and the bucket width.
    // Here, we use InsertionLevel (default to 1 if not set)
    const insertionLevel = model.insertionLevel ?? 1;

    const numDivs = model.divisions;

    for (let lvtk = 0; lvtk <= insertionLevel; lvtk++) {
      const buckets = getBucketNeighbors(ijk, numDivs, lvtk);
      for (let i = 0; i < buckets.length; i++) {
        const nei = buckets[i];
        const key = getBucketIndex(nei);
        const bucket = model.hashTable.get(key);
        if (bucket) {
          for (let j = 0; j < bucket.length; j++) {
            const ptId = bucket[j];
            const pt = model.points.getPoint(ptId);
            if (vtkMath.distance2BetweenPoints(x, pt) <= model.insertionTol2) {
              return ptId;
            }
          }
        }
      }
    }
    return -1;
  };

  /**
   * Find the closest point to a given point.
   *
   * @param {Vector3} x The point coordinates
   * @returns The id of the closest point or -1 if not found
   */
  publicAPI.findClosestPoint = (x) => {
    publicAPI.buildLocator();
    const ijk = publicAPI.getBucketIndices(x);
    const numDivs = model.divisions;
    let minDist2 = Number.MAX_VALUE;
    let closest = -1;
    const maxLevel = Math.max(...numDivs);

    for (let level = 0; level < maxLevel && closest === -1; level++) {
      const neighbors = getBucketNeighbors(ijk, numDivs, level);
      for (let n = 0; n < neighbors.length; n++) {
        const key = getBucketIndex(neighbors[n]);
        const bucket = model.hashTable.get(key);
        if (bucket) {
          for (let b = 0; b < bucket.length; b++) {
            const ptId = bucket[b];
            const pt = model.dataSet.getPoints().getPoint(ptId);
            const dist2 = vtkMath.distance2BetweenPoints(x, pt);
            if (dist2 < minDist2) {
              minDist2 = dist2;
              closest = ptId;
            }
          }
        }
      }
    }
    return closest;
  };

  /**
   * Find the closest point within a specified radius.
   *
   * @param {Number} radius The search radius
   * @param {Vector3} x The point coordinates
   * @param {Number} inputDataLength The length of the input data
   * @returns {IFindClosestPointResult} The closest point result
   */
  publicAPI.findClosestPointWithinRadius = (radius, x, inputDataLength = 0) => {
    publicAPI.buildLocator();
    let closest = -1;
    const radius2 = radius * radius;
    let minDist2 = 1.01 * radius2;
    let dist2 = -1.0;
    const ijk = publicAPI.getBucketIndices(x);
    const key = getBucketIndex(ijk);
    const bucket = model.hashTable.get(key);

    if (bucket) {
      for (let j = 0; j < bucket.length; j++) {
        const ptId = bucket[j];
        const pt = model.dataSet.getPoints().getPoint(ptId);
        const d2 = vtkMath.distance2BetweenPoints(x, pt);
        if (d2 < minDist2) {
          closest = ptId;
          minDist2 = d2;
          dist2 = d2;
        }
      }
    }

    // Now, search only those buckets that are within a radius.
    let refinedRadius;
    let refinedRadius2;
    if (minDist2 < radius2) {
      refinedRadius = Math.sqrt(dist2);
      refinedRadius2 = dist2;
    } else {
      refinedRadius = radius;
      refinedRadius2 = radius2;
    }

    // Optionally restrict radius by inputDataLength and bounds
    if (inputDataLength !== 0.0) {
      const distance2ToDataBounds = vtkBoundingBox.distance2ToBounds(
        x,
        model.bounds
      );
      const maxDistance = Math.sqrt(distance2ToDataBounds) + inputDataLength;
      if (refinedRadius > maxDistance) {
        refinedRadius = maxDistance;
        refinedRadius2 = maxDistance * maxDistance;
      }
    }

    // Compute radius levels for each dimension
    const radiusLevels = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      radiusLevels[i] = Math.floor(refinedRadius / model.H[i]);
      if (radiusLevels[i] > model.divisions[i] / 2) {
        radiusLevels[i] = Math.floor(model.divisions[i] / 2);
      }
    }
    let radiusLevel = Math.max(...radiusLevels);
    if (radiusLevel === 0) {
      radiusLevel = 1;
    }

    for (let ii = radiusLevel; ii >= 1; ii--) {
      const currentRadius = refinedRadius;

      // Build up a list of buckets that are arranged in rings
      const buckets = getOverlappingBuckets(x, ijk, refinedRadius / ii, ii);

      for (let i = 0; i < buckets.length; i++) {
        const nei = buckets[i];
        const d2ToBucket = distance2ToBucket(x, nei);
        if (d2ToBucket < refinedRadius2) {
          const key1 = getBucketIndex(nei);
          const bucket1 = model.hashTable.get(key1);
          if (bucket1) {
            for (let j = 0; j < bucket1.length; j++) {
              const ptId = bucket1[j];
              const pt = model.dataSet.getPoints().getPoint(ptId);
              if (pt) {
                const d2 = vtkMath.distance2BetweenPoints(x, pt);
                if (d2 < minDist2) {
                  closest = ptId;
                  minDist2 = d2;
                  refinedRadius = Math.sqrt(minDist2);
                  refinedRadius2 = minDist2;
                  dist2 = d2;
                }
              }
            }
          }
        }
      }

      // Update ii according to refined radius
      if (refinedRadius < currentRadius && ii > 2) {
        ii = Math.floor(ii * (refinedRadius / currentRadius)) + 1;
        if (ii < 2) {
          ii = 2;
        }
      }
    }

    if (closest !== -1 && minDist2 <= radius * radius) {
      dist2 = minDist2;
    } else {
      closest = -1;
    }

    return { id: closest, dist2 };
  };

  /**
   * Find the closest inserted point to the given coordinates.
   * @param {Vector3} x The query point
   * @returns {Number} The id of the closest inserted point or -1 if not found
   */
  publicAPI.findClosestInsertedPoint = (x) => {
    // Check if point is within bounds
    for (let i = 0; i < 3; i++) {
      if (x[i] < model.bounds[2 * i] || x[i] > model.bounds[2 * i + 1]) {
        return -1;
      }
    }

    const ijk = publicAPI.getBucketIndices(x);
    const numDivs = model.divisions;
    let closest = -1;
    let minDist2 = Number.MAX_VALUE;
    let level = 0;
    const maxLevel = Math.max(numDivs[0], numDivs[1], numDivs[2]);
    const points = model.points;

    // Search buckets and neighbors until closest found
    for (; closest === -1 && level < maxLevel; level++) {
      const neighbors = getBucketNeighbors(ijk, numDivs, level);
      for (let i = 0; i < neighbors.length; i++) {
        const nei = neighbors[i];
        const cno = nei[0] + nei[1] * model.XD + nei[2] * model.sliceSize;
        const bucket = model.hashTable.get(cno);
        if (bucket) {
          for (let j = 0; j < bucket.length; j++) {
            const ptId = bucket[j];
            const pt = points.getPoint(ptId);
            const dist2 = vtkMath.distance2BetweenPoints(x, pt);
            if (dist2 < minDist2) {
              closest = ptId;
              minDist2 = dist2;
            }
          }
        }
      }
    }

    // Refine: search next level neighbors that could be closer
    const refineNeighbors = getBucketNeighbors(ijk, numDivs, level);
    for (let i = 0; i < refineNeighbors.length; i++) {
      const nei = refineNeighbors[i];
      // Only consider neighbors that could possibly be closer
      let dist2 = 0;
      for (let j = 0; j < 3; j++) {
        if (ijk[j] !== nei[j]) {
          const MULTIPLES = ijk[j] > nei[j] ? nei[j] + 1 : nei[j];
          const diff = model.bounds[2 * j] + MULTIPLES * model.H[j] - x[j];
          dist2 += diff * diff;
        }
      }
      if (dist2 < minDist2) {
        const cno = nei[0] + nei[1] * model.XD + nei[2] * model.sliceSize;
        const bucket = model.hashTable.get(cno);
        if (bucket) {
          for (let j = 0; j < bucket.length; j++) {
            const ptId = bucket[j];
            const pt = points.getPoint(ptId);
            const d2 = vtkMath.distance2BetweenPoints(x, pt);
            if (d2 < minDist2) {
              closest = ptId;
              minDist2 = d2;
            }
          }
        }
      }
    }

    return closest;
  };

  /**
   * Get the points in the specified bucket.
   * @param {*} x The point coordinates
   * @returns {Number[]} The points in the bucket
   */
  publicAPI.getPointsInBucket = (x) => {
    publicAPI.buildLocator();
    const key = publicAPI.getBucketIndex(x);
    const bucket = model.hashTable.get(key);

    if (!bucket) return []; // No points in this bucket
    return bucket;
  };

  /**
   * Free the search structure and reset the locator.
   */
  publicAPI.freeSearchStructure = () => {
    model.hashTable.clear();
    model.points = vtkPoints.newInstance();
    model.divisions = [50, 50, 50];
    vtkMath.uninitializeBounds(model.bounds);
  };

  /**
   * Compute performance factors based on the current model state.
   */
  publicAPI.computePerformanceFactors = () => {
    model.HX = model.H[0];
    model.HY = model.H[1];
    model.HZ = model.H[2];
    model.FX = 1.0 / model.H[0];
    model.FY = 1.0 / model.H[1];
    model.FZ = 1.0 / model.H[2];
    model.BX = model.bounds[0];
    model.BY = model.bounds[2];
    model.BZ = model.bounds[4];
    model.XD = model.divisions[0];
    model.YD = model.divisions[1];
    model.ZD = model.divisions[2];
    model.sliceSize = model.divisions[0] * model.divisions[1];
  };

  /**
   * Generate a polydata representation of the point locator.
   *
   * @param {vtkPolyData} polydata The polydata to generate representation for
   */
  publicAPI.generateRepresentation = (polydata) => {
    if (!model.hashTable || model.hashTable.size === 0) {
      vtkErrorMacro("Can't build representation, no data provided!");
      return;
    }

    const facePts = [];
    facePts.length = 4;

    // Helper to add a face to polydata
    function generateFace(face, i, j, k, pts, polys) {
      // Compute the 8 corners of the bucket
      const x0 = model.bounds[0] + i * model.HX;
      const y0 = model.bounds[2] + j * model.HY;
      const z0 = model.bounds[4] + k * model.HZ;
      const x1 = x0 + model.HX;
      const y1 = y0 + model.HY;
      const z1 = z0 + model.HZ;

      // Each face is defined by 4 points (quad)
      // axis: 0=x, 1=y, 2=z
      if (face === 0) {
        // yz plane
        facePts[0] = [x0, y0, z0];
        facePts[1] = [x0, y1, z0];
        facePts[2] = [x0, y1, z1];
        facePts[3] = [x0, y0, z1];
      } else if (face === 1) {
        // xz plane
        facePts[0] = [x0, y0, z0];
        facePts[1] = [x1, y0, z0];
        facePts[2] = [x1, y0, z1];
        facePts[3] = [x0, y0, z1];
      } else if (face === 2) {
        // xy plane
        facePts[0] = [x0, y0, z0];
        facePts[1] = [x1, y0, z0];
        facePts[2] = [x1, y1, z0];
        facePts[3] = [x0, y1, z0];
      }

      // Add points to pts and get their ids
      const ptIds = facePts.map((pt) => pts.insertNextPoint(...pt));
      // Add quad to polys
      polys.insertNextCell([ptIds[0], ptIds[1], ptIds[2], ptIds[3]]);
    }

    // Prepare points and polys
    const pts = vtkPoints.newInstance();
    pts.allocate(5000);
    const polys = vtkCellArray.newInstance();
    polys.allocate(2048);
    // We'll use a Set to avoid duplicate faces
    const divisions = model.divisions;
    const sliceSize = divisions[0] * divisions[1];

    // Helper to check if a bucket exists
    function hasBucket(i, j, k) {
      if (
        i < 0 ||
        i >= divisions[0] ||
        j < 0 ||
        j >= divisions[1] ||
        k < 0 ||
        k >= divisions[2]
      ) {
        return false;
      }
      const idx = i + j * divisions[0] + k * sliceSize;
      return model.hashTable.has(idx);
    }

    // Loop over all buckets, creating appropriate faces
    for (let k = 0; k < divisions[2]; k++) {
      for (let j = 0; j < divisions[1]; j++) {
        for (let i = 0; i < divisions[0]; i++) {
          const idx = i + j * divisions[0] + k * sliceSize;
          const inside = model.hashTable.has(idx);

          // For each axis (0=x, 1=y, 2=z)
          for (let axis = 0; axis < 3; axis++) {
            let ni = i;
            let nj = j;
            let nk = k;
            if (axis === 0) ni = i - 1;
            if (axis === 1) nj = j - 1;
            if (axis === 2) nk = k - 1;

            const neighborInside = hasBucket(ni, nj, nk);

            // If neighbor is out of bounds
            if (ni < 0 || nj < 0 || nk < 0) {
              if (inside) {
                generateFace(axis, i, j, k, pts, polys);
              }
            } else if (
              (neighborInside && !inside) ||
              (!neighborInside && inside)
            ) {
              generateFace(axis, i, j, k, pts, polys);
            }
          }

          // Positive boundary faces
          if (i + 1 >= divisions[0] && inside) {
            generateFace(0, i + 1, j, k, pts, polys);
          }
          if (j + 1 >= divisions[1] && inside) {
            generateFace(1, i, j + 1, k, pts, polys);
          }
          if (k + 1 >= divisions[2] && inside) {
            generateFace(2, i, j, k + 1, pts, polys);
          }
        }
      }
    }

    polydata.setPoints(pts);
    polydata.setPolys(polys);
    // polydata.squeeze();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    divisions: [50, 50, 50],
    numberOfPointsPerBucket: 3,
    bounds: [0, 0, 0, 0, 0, 0],
    tolerance: 0.001,
    automatic: true,
    ...initialValues,
  };
}

export function extend(publicAPI, model, initialValues = {}) {
  vtkAbstractPointLocator.extend(
    publicAPI,
    model,
    defaultValues(initialValues)
  );
  macro.setGet(publicAPI, model, ['numberOfPointsPerBucket', 'points']);

  macro.setGetArray(publicAPI, model, ['divisions'], 3);
  vtkMath.uninitializeBounds(model.bounds);
  model.points = model.points || vtkPoints.newInstance();
  model.hashTable = new Map();
  model.H = [0, 0, 0]; // Bucket sizes in three dimensions
  model.insertionPointId = 0; // ID for next point to be inserted
  model.insertionTol2 = 0.0001; // Tolerance squared for point insertion
  model.insertionLevel = 0; // Level of neighbors to search for insertion
  vtkPointLocator(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkPointLocator');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
