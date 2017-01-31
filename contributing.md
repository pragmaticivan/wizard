# Contributing

We are open to, and grateful for, any contributions made by the community. By contributing to wizard, you agree to abide by the [code of conduct](https://github.com/pragmaticivan/wizard/blob/master/CODE_OF_CONDUCT.md).

### Code Style

Please follow the [Google javascript style guide](http://google.github.io/styleguide/jsguide.html).

### Commit Messages

Commit messages should be verb based, using the following pattern:

- `Fixes ...`
- `Adds ...`
- `Updates ...`
- `Removes ...`

### Testing

Please update the tests to reflect your code changes. Pull requests will not be accepted if they are failing on [Travis CI](https://travis-ci.com/pragmaticivan/wizard).

### Documentation

Please update the docs accordingly so that there are no discrepencies between the API and the documentation.

### Developing

- `npm run test` run the mocha tests for browser environment
- `npm run test:watch` watch for changes and run `test`
- `npm run build` bundle the source


### Releasing

Releasing a new version is mostly automated. Once this has been done run the commands below. Versions should follow [semantic versioning](http://semver.org/).

- `npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]`
- `npm publish`
