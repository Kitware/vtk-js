/**
 * The purpose of this file is to bundle all testing
 * entrypoints into one chunk. This cuts down on extraneous
 * code generation and addresses a race issue with the
 * timer task queue.
 */

import './setupTestEnv';

// webpack will include files that match the regex
// '..' refers to the Sources/ dir
const testsContext = require.context('..', true, /test[^/]+\.js$/);
testsContext.keys().forEach(testsContext);
