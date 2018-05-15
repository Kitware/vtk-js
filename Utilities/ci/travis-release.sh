#!/bin/bash
set -ev

npm run build:release
npm run validate
npm run test:travis
git config --global user.name "Travis CI"
git config --global user.email "sebastien.jourdain@kitware.com"
export GIT_PUBLISH_URL=https://${GH_TOKEN}@github.com/Kitware/vtk-js.git
npm run semantic-release
npm run doc:publish
