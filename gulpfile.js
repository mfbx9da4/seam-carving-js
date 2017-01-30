var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var browserify = require('browserify');
var babelify = require('babelify');
var uglify      = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var sourcemaps  = require('gulp-sourcemaps');

gulp.task('browserify', function() {
    return browserify('./demo/javascript/src/demo.js')
        .bundle()
        .on('error', function(err){
          console.log(err.toString());
          this.emit('end');
        })
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./demo/javascript/build/'));
});

gulp.task('build', function() {
    return browserify('./SeamCarver.js')
        .transform("babelify", { presets: ["es2015"] })
        .bundle()
        .pipe(source('SeamCarver.min.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write('./maps'))
        .on('error', function(err){console.log(err.toString()); this.emit('end'); })
        .pipe(gulp.dest('./'))
});

gulp.task('test', function() {
    return gulp.src('test.js', {read: false})
        .pipe(mocha({reporter: 'spec'}))
        .on('error', gutil.log);
});

gulp.task('default', function() {
    gulp.watch(['./**/*.js', './*.js'], ['browserify', 'test']);
});
