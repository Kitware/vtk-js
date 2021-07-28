import Common from './Common';
import Filters from './Filters';
import Imaging from './Imaging';
import Interaction from './Interaction';
import IO from './IO';
import Rendering from './Rendering';
import VTKProxy from './Proxy';
import ThirdParty from './ThirdParty';
import Widgets from './Widgets';

import macro from './macros';

import vtk from './vtk';

vtk.Common = Common;
vtk.Filters = Filters;
vtk.Imaging = Imaging;
vtk.Interaction = Interaction;
vtk.IO = IO;
vtk.Proxy = VTKProxy;
vtk.Rendering = Rendering;
vtk.ThirdParty = ThirdParty;
vtk.Widgets = Widgets;

vtk.mtime = macro.getCurrentGlobalMTime;
vtk.macro = macro;

// Expose vtk to global scope without exporting it so nested namespace
// do not pollute the global one.
window.vtk = vtk;
