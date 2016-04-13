var gulp = require('gulp');
var vinylPaths = require('vinyl-paths');
var del = require('del');
var size = require('gulp-size');
var chokidar = require('chokidar');
var svgmin = require('gulp-svgmin');
var cheerio = require('gulp-cheerio');
var extReplace = require('gulp-ext-replace');
var plumber = require('gulp-plumber');

var config = require('./reqs/config.js');
var utils = require('./reqs/utilities.js');
var messages = require('./reqs/messages.js');


/**
 * pre-processing for svg icons...
 * @function build:svg
 * @memberof slate-cli.tasks.build
 * @static
 */
gulp.task('build:svg', function() {
  return processIcons(config.paths.srcIcons);
});

/**
 * watches source svg icons for changes...
 * @function watch:svg
 * @memberof slate-cli.tasks.watch
 * @static
 */
gulp.task('watch:svg', function() {
  var cache = utils.createEventCache();

  chokidar.watch([config.paths.srcIcons], {ignoreInitial: true})
    .on('all', function(event, path) {
      messages.logFileEvent(event, path);
      cache.addEvent(event, path);
      utils.processCache(cache, processIcons, removeIcons);
    });
});


/**
 * Processing for SVGs prior to deployment - adds accessibility markup, and converts
 * the file to a liquid snippet.
 *
 * @param {Array} files - glob/array of files to match & send to the stream
 * @returns {Stream}
 * @private
 */
function processIcons(files) {
  messages.logProcessFiles('build:svg', files);
  return gulp.src(files)
    .pipe(plumber(utils.errorHandler))
    .pipe(svgmin(config.plugins.svgmin))
    .pipe(cheerio(config.plugins.cheerio))
    .pipe(extReplace('.liquid'))
    .pipe(size({showFiles: true, pretty: true}))
    .pipe(gulp.dest(config.paths.destSnippets));
}

/**
 * Cleanup/remove liquid snippets from the `dist` directory during watch tasks if
 * any underlying SVG files in the `src` folder have been removed.
 * @param {Array} files - glob/array of files to match & send to the stream
 * @returns {Stream}
 * @private
 */
function removeIcons(files) {
  messages.logProcessFiles('remove:svg', files);
  files = files.map(function(file) {
    file = file.replace('src/icons', 'dist/snippets');
    file = file.replace('.svg', '.liquid');
    return file;
  });

  return gulp.src(files)
    .pipe(plumber(utils.errorHandler))
    .pipe(vinylPaths(del))
    .pipe(size({showFiles: true, pretty: true}));
}
