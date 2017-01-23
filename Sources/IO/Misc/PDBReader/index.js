import * as macro           from '../../../macro';

import vtkPolyData          from '../../../Common/DataModel/PolyData';
import vtkDataArray         from '../../../Common/Core/DataArray';

import atomElem from '../../../../Utilities/XMLConverter/chemistry/elements.json';
import DataAccessHelper     from '../../Core/DataAccessHelper';


// ----
// Globals
// ----

const ATOMS = {};
atomElem.atoms.forEach((a) => { ATOMS[a.id] = a; });

// ----------------------------------------------------------------------------
// vtkPDBReader methods
// ----------------------------------------------------------------------------

export function vtkPDBReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPDBReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchPDB(url) {
    return model.dataAccessHelper.fetchText(publicAPI, url);
  }

  // Set DataSet url
  publicAPI.setUrl = (url) => {
    if (url.indexOf('.pdb') === -1) {
      model.baseURL = url;
      model.url = `${url}`; // `${url}/index.pdb`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    // Fetch metadata
    return publicAPI.loadData();
  };

  // Fetch the actual data arrays
  publicAPI.loadData = () => {
    const promise = fetchPDB(model.url);

    promise.then(
      (pdb) => {
        model.pdb = pdb;
        model.molecule = [];

        // Parse data
        model.molecule = model.pdb.split('\n');

        publicAPI.modified();
      });

    return promise;
  };

  publicAPI.requestData = (inData, outData) => {
    const polydata = vtkPolyData.newInstance();

    if (model.molecule) {
      const jSize = model.molecule.length;

      const points = polydata.getPoints();
      const pointdata = polydata.getPointData();

      // atom position
      const pointValues = [];

      // radiusVDW coords
      const radiusVDW = [];

      // radiusCovalent coords
      const radiusCovalent = [];

      // color coords
      const color = [];

      // mass coords
      const mass = [];

      model.numberOfAtoms = 0;

      let j = 0;
      while (j < jSize && model.molecule[j] !== 'END') {
        const iSize = model.molecule[j].length;
        const linebuf = model.molecule[j];

        const command = (linebuf.substr(0, 6)).replace(/\s+/g, '');
        command.toUpperCase();

        // Parse lines
        if (command === 'ATOM' || command === 'HETATM') {
          const dum1 = (linebuf.substr(12, 4)).replace(/\s+/g, '');
          // const dum2 = (linebuf.substr(17, 3)).replace(/\s+/g, '');
          // const chain = (linebuf.substr(21, 1)).replace(/\s+/g, '');
          // const resi = ((linebuf.substr(22, 8)).replace(/\s+/g, '')).replace(/\D/g, '');
          const x = (linebuf.substr(30, 8)).replace(/\s+/g, '');
          const y = (linebuf.substr(38, 8)).replace(/\s+/g, '');
          const z = (linebuf.substr(46, 8)).replace(/\s+/g, '');

          let elem = '';
          if (iSize >= 78) {
            elem = (linebuf.substr(76, 2)).replace(/\s+/g, '');
          }
          if (elem === '') {
            // if element symbol was not specified, just use the "Atom name".
            elem = (dum1.substr(0, 2)).replace(/\d/g, '');
          }

          // fill polydata
          // skip hydrogen by default
          // model.hideHydrogen = false; // show hydrogen
          if (!(elem === 'H' || elem === 'h') || !model.hideHydrogen) {
            // // atoms id
            // id.push(ATOMS[elem].id);
            // // atoms atomicNumber
            // atomicNumber.push(ATOMS[elem].atomicNumber);
            // // atoms symbol
            // symbol.push(ATOMS[elem].symbol);
            // // atoms name
            // atomName.push(ATOMS[elem].name);

            // atoms position
            pointValues.push(x * model.xSpacing);
            pointValues.push(y * model.ySpacing);
            pointValues.push(z * model.zSpacing);

            // atoms radius
            radiusCovalent.push(ATOMS[elem].radiusCovalent);
            radiusVDW.push(ATOMS[elem].radiusVDW);

            // atoms color
            color.push(ATOMS[elem].elementColor[0]);
            color.push(ATOMS[elem].elementColor[1]);
            color.push(ATOMS[elem].elementColor[2]);

            // atoms mass
            mass.push(ATOMS[elem].mass);

            // residue.push(resi);
            // chain.push(chain);
            // atomType.push(elem);
            // atomTypeStrings.push(dum1);
            // isHetatm.push(command === 'HETATM');

            model.numberOfAtoms++;
          }
        } // if atom or hetatm

        /*
        else if (command === 'SHEET') {
          const startChain = (linebuf.substr(21,1)).replace(/\s+/g, '');
          const startResi = (linebuf.substr(22,4)).replace(/\s+/g, '').replace(/\D/g, '');
          const endChain = (linebuf.substr(32,1)).replace(/\s+/g, '');
          const endResi = (linebuf.substr(33,4)).replace(/\s+/g, '').replace(/\D/g, '');;
          const tuple = { startChain, startResi, endChain, endResi };
          sheets.push(tuple);
        }
        else if (command === 'HELIX') {
          const startChain = (linebuf.substr(19,2)).replace(/\s+/g, '');
          const startResi = (linebuf.substr(21,4)).replace(/\s+/g, '').replace(/\D/g, '');;
          const endChain = (linebuf.substr(31,2)).replace(/\s+/g, '');
          const endResi = (linebuf.substr(33,4)).replace(/\s+/g, '').replace(/\D/g, '');;
          const tuple = { startChain, startResi, endChain, endResi };
          helix.push(tuple);
        }
        */
        j++;
      } // lines loop (j)

      points.setData(Float32Array.from(pointValues), 3);

      const radiusCovalentArray = vtkDataArray.newInstance({ numberOfComponents: 1, values: Float32Array.from(radiusCovalent), name: 'radiusCovalent' });
      pointdata.addArray(radiusCovalentArray);

      const radiusVDWArray = vtkDataArray.newInstance({ numberOfComponents: 1, values: Float32Array.from(radiusVDW), name: 'radiusVDW' });
      pointdata.addArray(radiusVDWArray);

      const colorArray = vtkDataArray.newInstance({ numberOfComponents: 3, values: Float32Array.from(color), name: 'elementColor' });
      pointdata.addArray(colorArray);

      const massArray = vtkDataArray.newInstance({ numberOfComponents: 1, values: Float32Array.from(mass), name: 'mass' });
      pointdata.addArray(massArray);
    } // if model.molecule

    model.output[0] = polydata;
  };

  // return Busy state
  publicAPI.isBusy = () => !!model.requestCount;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numberOfAtoms: 0,
  xSpacing: 1,
  ySpacing: 1,
  zSpacing: 1,
  hideHydrogen: true,
  requestCount: 0,
  // baseURL: null,
  // dataAccessHelper: null,
  // url: null,
};

// ----------------------------------------------------------------------------


export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'url',
    'baseURL',
    'numberOfAtoms',
  ]);
  macro.setGet(publicAPI, model, [
    'dataAccessHelper',
    'xSpacing',
    'ySpacing',
    'zScaling',
    'hideHydrogen',
  ]);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkPDBReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
