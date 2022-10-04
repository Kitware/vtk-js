#!/bin/bash

trap 'exit' ERR

curbranch="$(git branch --show-current)"

git reset --hard
git clean -dxf
git checkout gh-pages
git checkout --orphan tmp
git commit -m "vtk.js website"
git branch -D gh-pages
git branch -m gh-pages
git push -f origin gh-pages

git checkout "$curbranch"
