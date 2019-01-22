/**
 * 新版的gulpfile
 * 任务清单：
 *   1. watch   执行编译并监听文件变化
 *   2. default 执行编译
 */

'use strict'
const deployerPath = './src/**'
const distPath = './dist/'
const wxmlFiles = [`${deployerPath}/*.wxml`] // html文件
const cssFiles = [`${deployerPath}/*.less`, `!${deployerPath}/_src/*.less`] // css文件
const jsFiles = [`${deployerPath}/*.js`, `${deployerPath}/*.json`] // js文件
const imgFiles = [`${deployerPath}/*.png`, `${deployerPath}/*.jpg`, `${deployerPath}/*.gif`] // img文件
const watchPath = [].concat(wxmlFiles, cssFiles, jsFiles, imgFiles).filter(item => !/^!/.test(item)) // 监听文件变化的路径

var gulp = require('gulp')
var less = require('gulp-less')
var imagemin = require('gulp-imagemin')
var runSequence = require('gulp-sequence')
var rename = require('gulp-rename')


gulp.task('css', () =>
  gulp.src(cssFiles)
  .pipe(less())
  .pipe(rename({
    extname: '.wxss'
  }))
  .pipe(gulp.dest(distPath))
)

gulp.task('wxml', () =>
  gulp.src(wxmlFiles)
  .pipe(gulp.dest(distPath))
)

gulp.task('js', () =>
  gulp.src(jsFiles)
  .pipe(gulp.dest(distPath))
)

gulp.task('img', () =>
  gulp.src(imgFiles)
  .pipe(gulp.dest(distPath))
)

gulp.task('imagemin', () =>
  gulp.src(imgFiles)
  .pipe(imagemin())
  .pipe(gulp.dest(distPath))
)

gulp.task('default', cb => {
  runSequence('wxml', 'css', 'js', 'img')(cb)
})

gulp.task('watch', () => {
  gulp.watch(watchPath, ['default'])
})
