var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task('browserify', function() {
    return browserify('./demo/javascript/src/demo.js')
        .bundle()
        .on('error', function(err){
          // print the error (can replace with gulp-util)
          console.log(err.message);
          // end this stream
          this.emit('end');
        })
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('bundle.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./demo/javascript/build/'));
});

gulp.task('test', function() {
    return gulp.src('test.js', {read: false})
        .pipe(mocha({reporter: 'spec', showStack: true}))
        .on('error', gutil.log);
});

gulp.task('default', function() {
    gulp.watch(['./**/*.js', './*.js'], ['browserify', 'test']);
});
