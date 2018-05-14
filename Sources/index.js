import Common from './Common';
import Filters from './Filters';
import Imaging from './Imaging';
import Interaction from './Interaction';
import IO from './IO';
import Rendering from './Rendering';
import VTKProxy from './Proxy';

import macro from './macro';

import vtk from './vtk';

vtk.Common = Common;
vtk.Filters = Filters;
vtk.Imaging = Imaging;
vtk.Interaction = Interaction;
vtk.IO = IO;
vtk.Rendering = Rendering;
vtk.Proxy = VTKProxy;

vtk.mtime = macro.getCurrentGlobalMTime;
vtk.macro = macro;

/* eslint-disable */
module.exports = vtk;
