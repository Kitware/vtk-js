import Common       from './Common';
import Filters      from './Filters';
import Imaging      from './Imaging';
import Interaction  from './Interaction';
import IO           from './IO';
import Rendering    from './Rendering';

import { getCurrentGlobalMTime } from './macro';

import vtk from './vtk';

vtk.Common = Common;
vtk.Filters = Filters;
vtk.Imaging = Imaging;
vtk.Interaction = Interaction;
vtk.IO = IO;
vtk.Rendering = Rendering;

vtk.mtime = getCurrentGlobalMTime;

/* eslint-disable */
module.exports = vtk;
