<h1 align="center">wizard</h1>

<h5 align="center">Fast, flexible autoload for express dependencies using the power of glob.</h5>

<div align="center">
  <a href="http://travis-ci.org/pragmaticivan/wizard">
    <img src="https://secure.travis-ci.org/pragmaticivan/wizard.svg?branch=master" alt="Travis CI" />
  </a>

  <a href="https://codecov.io/gh/pragmaticivan/wizard">
    <img src="https://codecov.io/gh/pragmaticivan/wizard/branch/master/graph/badge.svg" alt="Coverage" />
  </a>

  <a href="https://www.npmjs.com/package/express-wizard">
    <img src="https://img.shields.io/npm/v/express-wizard.svg" alt="Npm" />
  </a>

  <img src="https://img.shields.io/npm/l/express-wizard.svg" alt="License">
</div>

## Why

Loading dependencies and including them into express shouldn't be hard. Sometimes you need a clean and powerful interface like the one provide by the glob package to do the job.

That's why express-wizard exists.

## Install

You can get it on npm.

```
npm install express-wizard --save
or
yarn add express-wizard
```
## Usage
```
var Wizard = require('express-wizard');

var instance = new Wizard()
                      .inject('model/**/*.js')
                      .inject(['controller/**/*.js', 'service/**/*.js'])
                      .inject('stop.js')
                      .exclude('middleware/**/*.js')
                      .exclude('start.js')
                      .into(app)
// app.model.foo
// app.model.bar
// app.controller.foo
// app.controller.bar
// app.service.foo
// app.service.bar
// app.stop

```

## Options

#### Defaults

  ```js
    new Wizard({
      cwd: process.cwd(),
      logger: console,
      verbose: true,
      loggingType: 'info',
      defaultExclusion: []
    })
  ```
### Logging

  `logger` - Defaults to console, this can be switched out.
  `verbose` - On by default, set to `false` for no logging
  `loggingType` - Set the type of logging, defaults to `info`

### Base Directory (cwd)

  Wizard will simply use a relative path from your current working directory, however sometimes you don't want heavily nested files included in the object chain, so you can set the cwd:

  ```js
  new Wizard()
    .include('project/model/**/*.js') // ./project/model/foo.js
    .into(app);
  ```

  would result in:

  ```js
  app.project.model.foo
  ```

  so using the `cwd` option:

  ```js
  new Wizard({cwd: 'project'})
    .include('model/**/*.js') // ./project/model/foo.js
    .into(app);
  ```
  would give us:

  ```js
  app.model.foo
  ```


## Semver

Until wizard reaches a `1.0` release, breaking changes will be released with a new minor version. For example `0.6.1`, and `0.6.4` will have the same API, but `0.7.0` will have breaking changes.

## Tests

To run the test suite, first install the dependencies, then run `npm test`:

  ```bash
  $ npm install or yarn install
  $ npm test
  ```
## Resources

* [Changelog](https://github.com/pragmaticivan/wizard/blob/master/CHANGELOG.md)
* [Contributing Guide](https://github.com/pragmaticivan/wizard/blob/master/CONTRIBUTING.md)
* [Code of Conduct](https://github.com/pragmaticivan/wizard/blob/master/CODE_OF_CONDUCT.md)

## License

[MIT License](http://pragmaticivan.mit-license.org/) © Ivan Santos
