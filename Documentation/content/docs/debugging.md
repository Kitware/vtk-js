title: Debugging
---

To speed up debugging, it is often good to minimize what you rebuild.
Exactly what pages you build and how you run npm will vary depending on what you're trying to debug.

## Debugging an example

Build the calcular example, but do not serve it:

    npm run doc -- -f Calculator

In a separate window, this will serve the example:

    npm run doc -- -s -f Calculator

Alternatively, you can copy one of the examples such as `Examples/WebGL/Cone` into
a new directory and add an entry to `package.json` which will run your test (copy
the Cone example line). Then visit [http://0.0.0.0:9999/webpack-dev-server/](http://0.0.0.0:9999/webpack-dev-server/)
if you want to see build errors.
Otherwise visit [http://0.0.0.0:9999/](http://0.0.0.0:9999/) and you will have access to globals you set up.

## Debugging a test

Comment out all but your test in `Sources/tests.js`.
Run the test server (which monitors file changes):

    npm run test:debug

Then visit [http://localhost:9876/debug.html](http://localhost:9876/debug.html).

## Check style and build

Don't forget to check that the AirBNB style rules are met before you commit and push your changes:

    npm run build
