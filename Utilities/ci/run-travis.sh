#!/bin/bash
set -ev

event_type="${1:-$TRAVIS_EVENT_TYPE}"
branch="${2:-$TRAVIS_BRANCH}"

npm run build:release
npm run validate
npm run test:travis

if [ "$event_type" == "push" ]; then
  # branches from semantic-release config
  # I suspect I don't actually need these conditions here,
  # as semantic-release should ignore branches that it's not configured for.
  if [ "$branch" == "master" ] || \
     [ "$branch" == "next" ] || \
     [ "$branch" == "next-major" ]; then
    git config --global user.name "Travis CI"
    git config --global user.email "sebastien.jourdain@kitware.com"
    export GIT_PUBLISH_URL=https://${GH_TOKEN}@github.com/Kitware/vtk-js.git
    npm run semantic-release
  fi

  # only update website when pushing to master, as we do not have
  # next/next-major docs yet
  if [ "$branch" == "master" ]; then
    npm run doc:publish
  fi
fi
