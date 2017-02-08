const gulp = require('gulp');
const eslint = require('gulp-eslint');
const del = require('del');
const runSequence = require('run-sequence');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const isparta = require('isparta');
const loadPlugins = require('gulp-load-plugins');
const concat = require('gulp-concat');
const codecov = require('gulp-codecov');
const mochaGlobals = require('./test/setup/.globals');
const Instrumenter = isparta.Instrumenter;

// Load all of our Gulp plugins
const $ = loadPlugins();
const watchFiles = ['src/**/*', 'test/**/*'];
const destinationFolder = 'dist';

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
 * Build helper.
 * @param  {Function} done
 */
function build(done) {
  runSequence(
    'clean',
    'build-src',
    ['lint'],
    done
  );
}

/**
 * Clean distribution folder.
 * @param  {Function} done [description]
 */
function cleanDist(done) {
  del([destinationFolder]).then(() => done());
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
  gulp.watch(watchFiles, ['coverage']);
}


// General build
gulp.task('build', build);


// Build the src files
gulp.task('build-src', () => {
    return gulp.src('src/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(concat('all.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('watch-src', () => {
  return gulp.watch('src/**/*.js', [
    'build-src',
  ]);
});

gulp.task('watch', ['watch-src']);


// Performs eslint functions

const lintWatchFiles = ['**/*.js',
                        '!node_modules/**',
                        '!coverage/**',
                        '!dist/**'];
gulp.task('lint', () => {
    return gulp.src(lintWatchFiles)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('lint:watch', () => {
  gulp.watch(lintWatchFiles, ['lint']);
});

// Remove the built files
gulp.task('clean', cleanDist);

// Set up coverage and run tests
gulp.task('coverage', coverage);

// Run our tests
gulp.task('test', test);
gulp.task('test:watch', testWatch);
gulp.task('test:coverage:travis', codeCoverageServer);
