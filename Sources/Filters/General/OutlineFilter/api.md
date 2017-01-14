## Introduction

vtkOutlineFilter - generates outline from an input

vtkOutlineFilter creates a stick outline (12 edges of a rectangular prism)
based on the spatial bounds (i.e. getBounds()) of its input data. The output
is a vtkPolyData with 12 lines and 8 points.
