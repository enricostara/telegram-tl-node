var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

gulp.task('src', function () {
    return gulp.src('lib/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('test', function () {
    return gulp.src('./test/**/*.js')
        .pipe(mocha({reporter: 'tap', timeout: '10s'}));
});

gulp.task('default', ['src', 'test']);
