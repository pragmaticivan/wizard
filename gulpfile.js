const gulp = require('gulp');
const path = require('path');
const fs = require('fs');
const isparta = require('isparta');
const loadPlugins = require('gulp-load-plugins');
const codecov = require('gulp-codecov');

const manifest = require('./package.json');
const mochaGlobals = require('./test/setup/.globals');
const Instrumenter = isparta.Instrumenter;

// Load all of our Gulp plugins
var $ = loadPlugins();

function registerBabel_() {
  require('babel-register');
}

function mocha_() {
  return gulp.src(['test/setup/node.js', 'test/unit/**/*.js'], {read: false})
    .pipe($.mocha({
      reporter: 'spec',
      globals: Object.keys(mochaGlobals.globals),
      ignoreLeaks: false
    }));
}

function test() {
  registerBabel_();
  return mocha_();
}

function coverage(done) {
  registerBabel_();
  gulp.src(['src/**/*.js'])
    .pipe($.istanbul({
      instrumenter: Instrumenter,
      includeUntested: true
    }))
    .pipe($.istanbul.hookRequire())
    .on('finish', () => {
      return test()
        .pipe($.istanbul.writeReports())
        .on('end', done);
    });
}

function codeCoverageServer() {
  gulp.src('./coverage/lcov.info')
      .pipe(codecov());
}

var watchFiles = ['src/**/*', 'test/**/*'];

function testWatch() {
  gulp.watch(watchFiles, ['test']);
}
// Set up coverage and run tests
gulp.task('coverage', coverage);

// Run our tests
gulp.task('test', test);
gulp.task('test:watch', testWatch);
gulp.task('test:coverage:travis', codeCoverageServer);
