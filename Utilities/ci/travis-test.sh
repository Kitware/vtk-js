#!/bin/bash
set -ev

npm run build:release
npm run validate
npm run test:travis
