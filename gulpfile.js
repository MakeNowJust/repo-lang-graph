// load gulp and plugins
var
gulp      = require('gulp'),
jade      = require('gulp-jade'),
stylus    = require('gulp-stylus'),
webserver = require('gulp-webserver'),
sequence  = require('gulp-sequence'),
webpack   = require('webpack-stream'),

// load other packages
path   = require('path'),
named  = require('vinyl-named'),
async  = require('async'),
rimraf = require('rimraf'),
mkdirp = require('mkdirp');

// constants
var
DEST = '.dest';

// tasks

gulp.task('init', function (cb) {
  async.series([
    function (cb) { rimraf(DEST, cb); },
    function (cb) { mkdirp(DEST, cb); },
  ], cb);
});

gulp.task('webserver', function () {
  return gulp.src(DEST, {dot: true})
    .pipe(webserver({
      host: '0.0.0.0',
      path: '/repo-lang-graph',
      livereload: true,
      open: 'http://localhost:8000/repo-lang-graph',
    }));
});

gulp.task('jade', function () {
  return gulp.src('jade/*.jade')
    .pipe(jade())
    .pipe(gulp.dest(DEST));
});

gulp.task('stylus', function () {
  return gulp.src('styl/*.styl')
    .pipe(stylus({
      use: [require('kouto-swiss')()],
    }))
    .pipe(gulp.dest(path.join(DEST, 'css')));
});

gulp.task('webpack', function () {
  return gulp.src('js/*.js')
    .pipe(named())
    .pipe(webpack({
      module: {
        loaders: [
          { test: /\.json$/, loader: 'json' },
        ],
      },
      output: {
        filename: '[name].js',
      },
    }))
    .pipe(gulp.dest(path.join(DEST, 'js')));
});

gulp.task('copy', function () {
  return gulp.src('www/**/*')
    .pipe(gulp.dest(DEST));
});

gulp.task('watch', function () {
  gulp.watch(['jade/*.jade']  , ['jade']);
  gulp.watch(['styl/*.styl']  , ['stylus']);
  gulp.watch(['js/*.js']      , ['webpack']);
  gulp.watch(['www/**/*']     , ['copy']);
});

gulp.task('build', sequence('init', ['jade', 'stylus', 'webpack', 'copy']));

gulp.task('default', sequence('build', ['watch', 'webserver']));
