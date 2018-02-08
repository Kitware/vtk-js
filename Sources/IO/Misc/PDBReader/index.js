import macro from 'vtk.js/Sources/macro';
import vtkMolecule from 'vtk.js/Sources/Common/DataModel/Molecule';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';

import ATOMS from 'vtk.js/Utilities/XMLConverter/chemistry-mapper/elements.json';

// ----------------------------------------------------------------------------
// vtkPDBReader methods
// ----------------------------------------------------------------------------

function vtkPDBReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPDBReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchPDB(url, option) {
    return model.dataAccessHelper.fetchText(publicAPI, url, option);
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option) => {
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
    return publicAPI.loadData(option);
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option) =>
    fetchPDB(model.url, option).then(publicAPI.parseAsText);

  publicAPI.parseAsText = (txt) => {
    model.pdb = txt;
    model.molecule = [];
    model.molecule = model.pdb.split('\n');
    publicAPI.modified();
    return true;
  };

  publicAPI.requestData = (inData, outData) => {
    const moleculedata = vtkMolecule.newInstance();

    if (model.molecule) {
      const jSize = model.molecule.length;

      // atom position
      const pointValues = [];

      // atomicNumber
      const atomicNumber = [];

      model.numberOfAtoms = 0;

      let j = 0;
      while (j < jSize && model.molecule[j] !== 'END') {
        const iSize = model.molecule[j].length;
        const linebuf = model.molecule[j];

        const command = linebuf.substr(0, 6).replace(/\s+/g, '');
        command.toUpperCase();

        // Parse lines
        if (command === 'ATOM' || command === 'HETATM') {
          const dum1 = linebuf.substr(12, 4).replace(/\s+/g, '');
          // const dum2 = (linebuf.substr(17, 3)).replace(/\s+/g, '');
          // const chain = (linebuf.substr(21, 1)).replace(/\s+/g, '');
          // const resi = ((linebuf.substr(22, 8)).replace(/\s+/g, '')).replace(/\D/g, '');
          const x = linebuf.substr(30, 8).replace(/\s+/g, '');
          const y = linebuf.substr(38, 8).replace(/\s+/g, '');
          const z = linebuf.substr(46, 8).replace(/\s+/g, '');

          let elem = '';
          if (iSize >= 78) {
            elem = linebuf.substr(76, 2).replace(/\s+/g, '');
          }
          if (elem === '') {
            // if element symbol was not specified, just use the "Atom name".
            elem = dum1.substr(0, 2).replace(/\d/g, '');
          }

          // fill polydata
          // atoms position
          pointValues.push(x);
          pointValues.push(y);
          pointValues.push(z);

          // fetch data from the element database elements.json
          const [atomicNumberData] = ATOMS[elem];

          // atoms atomicNumber
          atomicNumber.push(atomicNumberData);

          // residue.push(resi);
          // chain.push(chain);
          // atomType.push(elem);
          // atomTypeStrings.push(dum1);
          // isHetatm.push(command === 'HETATM');

          model.numberOfAtoms++;
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

      // fill molecule class
      moleculedata.getAtoms().elements = {};
      moleculedata.getAtoms().elements.number = Int8Array.from(atomicNumber);
      moleculedata.getAtoms().coords = {};
      moleculedata.getAtoms().coords['3d'] = Float32Array.from(pointValues);
    } // if model.molecule

    model.output[0] = moleculedata;
  };

  // return Busy state
  publicAPI.isBusy = () => !!model.requestCount;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numberOfAtoms: 0,
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
    'requestCount',
  ]);
  macro.setGet(publicAPI, model, ['dataAccessHelper']);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkPDBReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPDBReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
