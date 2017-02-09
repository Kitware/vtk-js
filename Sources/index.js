import Common       from './Common';
import Filters      from './Filters';
import Interaction  from './Interaction';
import IO           from './IO';
import Rendering    from './Rendering';
import Representation from './Representation';

import { getCurrentGlobalMTime } from './macro';

import vtk from './vtk';

vtk.Common = Common;
vtk.Filters = Filters;
vtk.Interaction = Interaction;
vtk.IO = IO;
vtk.Rendering = Rendering;
vtk.Representation = Representation;

vtk.mtime = getCurrentGlobalMTime;

/* eslint-disable */
module.exports = vtk;
