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
We use automatic tests in this project based on [mocha](https://mochajs.org) and [chai](https://www.chaijs.com) transpiled with babel so you can use ES6 in testing. Test with `npm test`.

During development we recommend to test it in parallel to each change. Use the following script for it:

`npm run watch:test`


Tutorial hint
--------------
Check out this tutorial. It helps to understand at least a few things on how we develop here: https://egghead.io/lessons/javascript-introduction-to-how-to-write-an-open-source-javascript-library
