Development
============

Node
-----
We use a current verison of node for development. It is mentioned in `./.nvmrc`.
Use Node Version Manager (nvm - https://github.com/nvm-sh/nvm) in order to maintain it.

Switch to the right node Version:
`nvm use`

How to commit
--------------
We use [semantic-release](https://github.com/semantic-release/semantic-release) for releasing. Therefore it is mandatory to apply to the [Angular Commit Message Standard](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) in this project.

Thats why we strongly encourage you to use [commitizen](https://github.com/commitizen/cz-cli) for commiting. To make it easy you can use the following script:

`npm run commit`


Testing
--------
We use automatic tests in this project based on [mocha](https://mochajs.org) and [chai](https://www.chaijs.com) transpiled with [babel](https://babeljs.io) so you can use ES6 in testing. Test with `npm test`.

During development we recommend to test it in parallel to each change. Use the following script for it:

`npm run watch:test`


Test Coverage
--------------
We check the test coverage automatically with [nyc](https://github.com/istanbuljs/nyc) we expect 100% code coverage. The code coverage ist just a reminder if we forget to test something, it is not a replacement for smart-thinking whilst writing tests ;)

- Check your coverage with: `npm run cover`
- We also recommend checking the coverage results graphically: `open coverage/lcov-report/index.html`


Build
------
We build to a `./dist` folder with [babel](https://babeljs.io) and [webpack](https://webpack.js.org). It consists of a transpiled version for use in node. And a browser version (in expanded and minified).

- Build with `npm run build`

Do not commit the `dist` folder, as it will be build by the Continous-Integration pipeline on release.


Testing Builds
---------------
As we produce a result in `./dist`, which is actually used in the npm package and in the browser we need to test that too. Especially after we changed something on the build process.

We have three main use cases: Import in Node via ES modules, Require in Node on commonjs and use in Browser.

So you should test the following - all three show a simple departure monitor if it works:
```
npm run build
node test/test_build/test_import_as_es_module.mjs
node test/test_build/test_import_as_commonjs.js
open test/test_build/test_browser.html
```


Tutorial hint
--------------
Check out this tutorial. It helps to understand at least a few things on how we develop here: https://egghead.io/lessons/javascript-introduction-to-how-to-write-an-open-source-javascript-library
