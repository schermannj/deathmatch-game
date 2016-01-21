var gulp = require('gulp');
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var mainBowerFiles = require('gulp-main-bower-files');
var merge = require('merge-stream');
var inject = require('gulp-inject');
var series = require('stream-series');

gulp.task('css', function () {
    return gulp.src(['./app/style/**/*.css', './bower_components/**/*.min.css'])
        .pipe(gulp.dest('./target/css'))
        .pipe(connect.reload())
});

gulp.task('js', function () {
    var bF = gulp.src('./bower.json').pipe(mainBowerFiles());
    var appF = gulp.src('./app/js/**/*.js').pipe(concat('app.js'));

    return merge(bF, appF).pipe(gulp.dest('./target/js')).pipe(connect.reload());
});

gulp.task('html', ['css', 'js'], function () {
    gulp.src('./app/html/index.html').pipe(
        inject(
            series(
                gulp.src(['./target/js/**/*.js', './target/css/**/*.css', '!./target/js/app.js'], {read: false}),
                gulp.src('./target/js/app.js', {read: false})
            ),
            {ignorePath: ['/target', '/app/style'], addRootSlash: false})

    ).pipe(gulp.dest('./target')).pipe(connect.reload());


    gulp.src('./app/html/templates/**/*.html').pipe(gulp.dest('./target/templates'));
});

gulp.task('connect', function () {
    connect.server({
        root: 'target',
        livereload: true,
        port: 8888
    });
});

gulp.task('watch', ['css', 'js', 'html', 'connect'], function () {
    gulp.watch('./app/js/**/*.js', ['js']);
    gulp.watch('./app/style/**/*.css', ['css']);
    gulp.watch('./app/html/**/*.html', ['html']);
});

gulp.task('default', ['watch'], function () {
});