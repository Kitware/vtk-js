# import to process args
import os

# import paraview modules.
from paraview.web import pv_wslink
from paraview.web import protocols as pv_protocols

from paraview import simple
from wslink import server

try:
    import argparse
except ImportError:
    # since  Python 2.6 and earlier don't have argparse, we simply provide
    # the source for the same as _argparse and we use it instead.
    from vtk.util import _argparse as argparse

# =============================================================================
# Create custom PVServerProtocol class to handle clients requests
# =============================================================================


class _DemoServer(pv_wslink.PVServerProtocol):
    authKey = "wslink-secret"

    def initialize(self):
        # Bring used components
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebMouseHandler())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebViewPort())
        self.registerVtkWebProtocol(
            pv_protocols.ParaViewWebViewPortImageDelivery())
        self.updateSecret(_DemoServer.authKey)

        # Disable interactor-based render calls
        simple.GetRenderView().EnableRenderOnInteraction = 0
        simple.GetRenderView().Background = [0, 0, 0]
        cone = simple.Cone()
        simple.Show(cone)
        simple.Render()

        # Update interaction mode
        pxm = simple.servermanager.ProxyManager()
        interactionProxy = pxm.GetProxy(
            'settings', 'RenderViewInteractionSettings')
        interactionProxy.Camera3DManipulators = [
            'Rotate', 'Pan', 'Zoom', 'Pan', 'Roll', 'Pan', 'Zoom', 'Rotate', 'Zoom']

# =============================================================================
# Main: Parse args and start server
# =============================================================================


if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="ParaViewWeb Demo")

    # Add default arguments
    server.add_arguments(parser)

    # Extract arguments
    args = parser.parse_args()

    # Start server
    server.start_webserver(options=args, protocol=_DemoServer)
