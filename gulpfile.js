'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    browserSync = require('browser-sync').create(),
    plumber = require('gulp-plumber'),
    reload = browserSync.reload,
    concat = require('gulp-concat'),
    uglify = require('gulp-uglifyjs'),
    cssnano = require('gulp-cssnano'),
    concatCss = require('gulp-concat-css'),
    rename = require('gulp-rename'),
    del = require('del'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    cache = require('gulp-cache'),
    autoprefixer = require('gulp-autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    fileinclude = require('gulp-file-include'),
    markdown = require('markdown'),
    htmlbeautify = require('gulp-html-beautify'),
    fs = require('fs'),
    replace = require('gulp-string-replace'),
    strip = require('gulp-strip-comments'),
    stripCssComments = require('gulp-strip-css-comments'),
    removeEmptyLines = require('gulp-remove-empty-lines'),
    revts = require('gulp-rev-timestamp'),
    beautify = require('gulp-beautify');

var path = {
  'dist': 'promo'
};

gulp.task('htmlCompilation', function () {
  return gulp.src(['!src/_tpl_*.html', 'src/*.html', 'src/20*/**/*'])
      .pipe(plumber())
      .pipe(fileinclude({
        basepath: '@root',
        filters: {
          markdown: markdown.parse
        }
      }))
      .pipe(gulp.dest('./' + path.dist));
});

gulp.task('htmlCompilationProduction', function () {
  return gulp.src(['!src/_tpl_*.html', 'src/*.html', 'src/20*/**/*'])
      .pipe(plumber())
      .pipe(fileinclude({
        basepath: '@root',
        filters: {
          markdown: markdown.parse
        }
      }))
      .pipe(replace('<base href="http://localhost:3000/">', '<base href="http://ерип.бел/">'))
      .pipe(htmlbeautify({
        "indent_with_tabs": true,
        "max_preserve_newlines": 0
      }))
      .pipe(gulp.dest('./' + path.dist));
});

gulp.task('sassCompilation', function () {
  return gulp.src('src/sass/**/*.+(scss|sass)')
      .pipe(plumber())
      .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'expanded', // nested (default), expanded, compact, compressed
        indentType: 'space',
        indentWidth: 2,
        precision: 3,
        linefeed: 'lf' // cr, crlf, lf or lfcr
      }).on('error', sass.logError))
      .pipe(replace('../../', '../'))
      .pipe(replace('@charset "UTF-8";', ''))
      .pipe(autoprefixer([
        'last 5 versions', '> 1%', 'ie >= 9', 'and_chr >= 2.3'
      ], {
        cascade: true
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./' + path.dist + '/css'))
      .pipe(browserSync.reload({
        stream: true
      }));
});

gulp.task('sassCompilationProduction', function () {
  return gulp.src('src/sass/**/*.+(scss|sass)')
      .pipe(plumber())
      .pipe(sass({
        outputStyle: 'expanded', // nested (default), expanded, compact, compressed
        indentType: 'space',
        indentWidth: 2,
        precision: 3,
        linefeed: 'lf' // cr, crlf, lf or lfcr
      }).on('error', sass.logError))
      .pipe(replace('../../', '../'))
      .pipe(replace('@charset "UTF-8";', ''))
      .pipe(autoprefixer([
        'last 5 versions', '> 1%', 'ie >= 9', 'and_chr >= 2.3'
      ], {
        cascade: true
      }))
      .pipe(cssnano())
      .pipe(gulp.dest('./' + path.dist + '/css'));
});

const cssLibs = [];
gulp.task('mergeCssLibs', function () {
  if(cssLibs.length) {
    return gulp.src(cssLibs)
        .pipe(concatCss(path.dist + "/css/libs.min.css", {
          rebaseUrls: false
        }))
        .pipe(gulp.dest('./'));
  }
});

gulp.task('mergeCssLibsProduction', function () {
  if(cssLibs.length) {
    return gulp.src(cssLibs)
        .pipe(concatCss(path.dist + "/css/libs.min.css", {
          rebaseUrls: false
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('./'));
  }
});

const jsLibs = [
  'node_modules/intersection-observer/intersection-observer.js',
  'node_modules/vanilla-lazyload/dist/lazyload.min.js'
];
gulp.task('mergeScriptsLibs', ['copyJqueryToJs'], function () {
  if(jsLibs.length) {
    return gulp.src(jsLibs)
        .pipe(concat('libs.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.dist + '/js'));
  }
});

gulp.task('copyJqueryToJs', function () {
  return gulp.src([
    'node_modules/jquery/dist/jquery.min.js'
  ])
      .pipe(gulp.dest(path.dist + '/js'));
});

gulp.task('copyJs', function () {
  return gulp.src('src/js/**/*')
      .pipe(gulp.dest(path.dist + '/js'));
});

gulp.task('copyJsProduction', function () {
  gulp.src(['!src/js/common.js', 'src/js/**/*'])
      .pipe(gulp.dest(path.dist + '/js'));

  gulp.src('src/js/common.js')
      .pipe(strip({
        safe: true,
        ignore: /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\//g // Не удалять /**...*/
      }))
      .pipe(removeEmptyLines())
      .pipe(beautify({
        // "indent_with_tabs": true,
        "indent_size": 2,
        "space_after_anon_function": true,
        "max_preserve_newlines": 2
      }))
      .pipe(gulp.dest(path.dist + '/js'));
});

gulp.task('copyResources', function () {
  return gulp.src('src/resources/**/*', { dot: true })
      .pipe(plumber())
      .pipe(gulp.dest(path.dist));
});

gulp.task('copyFonts', function () {
  return gulp.src('src/fonts/**/*')
      .pipe(plumber())
      .pipe(gulp.dest(path.dist + '/fonts'));
});

gulp.task('copyImages', function () {
  return gulp.src('src/img/**/*')
      .pipe(cache(imagemin({
        interlaced: true,
        progressive: true,
        optimizationLevel: 7, // from 0 to 7
        use: [pngquant()]
      })))
      .pipe(gulp.dest(path.dist + '/img'));
});

gulp.task('browserSync', function (done) {
  browserSync.init({
    server: {
      baseDir: "./" + path.dist
    },
    open: false,
    notify: false
  });
  browserSync.watch(['src/*.html', 'src/js/**/*.js', 'src/includes/**/*.json', 'src/includes/**/*.svg']).on("change", browserSync.reload);
  done();
});

gulp.task('watch', ['browserSync', 'htmlCompilation', 'sassCompilation', 'mergeCssLibs', 'mergeScriptsLibs', 'copyResources', 'copyFonts', 'copyJs', 'copyImages'], function () {
  gulp.watch(['src/*.html', 'src/20*/**/*.html', 'src/includes/**/*.svg'], ['htmlCompilation']);
  gulp.watch('src/sass/**/*.+(scss|sass)', ['sassCompilation']);
  gulp.watch('src/resources/**/*', ['copyResources']);
  gulp.watch('src/fonts/**/*', ['copyFonts']);
  gulp.watch('src/js/**/*', ['copyJs']);
  gulp.watch('src/img/**/*', ['copyImages']);
});

gulp.task('develop', ['watch']);

/**
 * Create Production
 */

gulp.task('production', ['cleanDist', 'htmlCompilationProduction', 'sassCompilationProduction', 'mergeCssLibsProduction', 'mergeScriptsLibs', 'copyResources', 'copyFonts', 'copyJsProduction', 'copyImages']);

gulp.task('cleanDist', function () {
  return del.sync([path.dist + '/']);
});

gulp.task('clearCache', function () {
  return cache.clearAll();
});