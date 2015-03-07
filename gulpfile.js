// load gulp and plugins
var
gulp     = require('gulp'),
jade     = require('gulp-jade'),
stylus   = require('gulp-stylus'),
connect  = require('gulp-connect'),
sequence = require('gulp-sequence'),
webpack  = require('gulp-webpack'),

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

gulp.task('connect', function () {
  connect.server({
    root: DEST,
    livereload: true,
  });
});

gulp.task('jade', function () {
  return gulp.src('jade/*.jade')
    .pipe(jade())
    .pipe(gulp.dest(DEST))
    .pipe(connect.reload());
});

gulp.task('stylus', function () {
  var
  nib = require('nib');

  return gulp.src('styl/*.styl')
    .pipe(stylus({
      use: [nib()],
    }))
    .pipe(gulp.dest(path.join(DEST, 'css')))
    .pipe(connect.reload());
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
    .pipe(gulp.dest(path.join(DEST, 'js')))
    .pipe(connect.reload());
});

gulp.task('copy', function () {
  return gulp.src('www/**/*')
    .pipe(gulp.dest(DEST))
    .pipe(connect.reload());
});

gulp.task('watch', function () {
  gulp.watch(['jade/*.jade']  , ['jade']);
  gulp.watch(['styl/*.styl']  , ['stylus']);
  gulp.watch(['js/*.js']      , ['webpack']);
  gulp.watch(['www/**/*']     , ['copy']);
});

gulp.task('build', sequence('init', ['jade', 'stylus', 'webpack', 'copy']));

gulp.task('default', sequence('build', ['watch', 'connect']));
