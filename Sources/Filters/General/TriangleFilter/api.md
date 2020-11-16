## Introduction
vtkTriangleFilter - A filter that generates triangles for larger cells

vtkTriangleFilter is a filter that converts cells wih more than 3 points into
triangles.

This is a naive implementation (not performant)

**Warning**
Points shared by multiple cells are duplicated.

## Public API
