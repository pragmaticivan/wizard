const gulp = require('gulp');
const eslint = require('gulp-eslint');
const isparta = require('isparta');
const loadPlugins = require('gulp-load-plugins');
const codecov = require('gulp-codecov');
const mochaGlobals = require('./test/setup/.globals');
const Instrumenter = isparta.Instrumenter;

// Load all of our Gulp plugins
const $ = loadPlugins();
const watchFiles = ['src/**/*', 'test/**/*'];

/**
 * Require register babel.
 */
function registerBabel_() {
  require('babel-register');
}

/**
 * Mocha helper.
 * @return {gulp}
 */
function mocha_() {
  return gulp.src(['test/setup/node.js', 'test/unit/**/*.js'], {read: false})
    .pipe($.mocha({
      reporter: 'spec',
      globals: Object.keys(mochaGlobals.globals),
      ignoreLeaks: false,
    }));
}

/**
 * Test helper.
 * @return {gulp}
 */
function test() {
  registerBabel_();
  return mocha_();
}

/**
 * Coverage helper.
 * @param  {Function} done
 */
function coverage(done) {
  registerBabel_();
  gulp.src(['src/**/*.js'])
    .pipe($.istanbul({
      instrumenter: Instrumenter,
      includeUntested: true,
    }))
    .pipe($.istanbul.hookRequire())
    .on('finish', () => {
      return test()
        .pipe($.istanbul.writeReports())
        .on('end', done);
    });
}

/**
 * CodeCov helper.
 */
function codeCoverageServer() {
  gulp.src('./coverage/lcov.info')
      .pipe(codecov());
}

/**
 * Test watch helper.
 */
function testWatch() {
  gulp.watch(watchFiles, ['test']);
}

gulp.task('lint', () => {
    return gulp.src(['**/*.js', '!node_modules/**', '!coverage/**'])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

// Set up coverage and run tests
gulp.task('coverage', coverage);

// Run our tests
gulp.task('test', test);
gulp.task('test:watch', testWatch);
gulp.task('test:coverage:travis', codeCoverageServer);
