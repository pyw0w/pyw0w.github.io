const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer').default;
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const fileInclude = require('gulp-file-include');
const htmlmin = require('gulp-htmlmin');
const browserSync = require('browser-sync').create();

const paths = {
  styles: {
    src: 'src/assets/styles/*.scss',
    dest: 'dist/assets/css'
  },
  scripts: {
    src: 'src/assets/scripts/**/*.js',
    dest: 'dist/assets/js'
  },
  html: {
    src: 'src/pages/*.html',
    dest: 'dist'
  },
  pwa: {
    src: 'src/sw/**/*',
    dest: 'dist'
  },
  manifest: {
    src: 'src/manifest.json',
    dest: 'dist'
  },
  assets: {
    src: 'src/assets/images/**/*',
    dest: 'dist/assets/images'
  },
  data: {
    src: 'src/data/**/*',
    dest: 'dist/data'
  }
};

function styles() {
  return gulp.src(paths.styles.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

function scripts() {
  return gulp.src(paths.scripts.src)
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(concat('app.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

function html() {
  return gulp.src(paths.html.src)
    .pipe(fileInclude({ prefix: '@@', basepath: '@file' }))
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(paths.html.dest))
    .pipe(browserSync.stream());
}

function pwa() {
  return gulp.src(paths.pwa.src)
    .pipe(gulp.dest(paths.pwa.dest));
}

function manifest() {
  return gulp.src(paths.manifest.src)
    .pipe(gulp.dest(paths.manifest.dest));
}

function assets() {
  return gulp.src(paths.assets.src, { dot: true })
    .pipe(gulp.dest(paths.assets.dest));
}

function data() {
  return gulp.src(paths.data.src, { dot: true })
    .pipe(gulp.dest(paths.data.dest));
}

function watch() {
  browserSync.init({
    server: { baseDir: './dist' }
  });

  gulp.watch('src/assets/styles/**/*.scss', styles);
  gulp.watch('src/assets/scripts/**/*.js', scripts);
  gulp.watch('src/pages/**/*.html', html);
  gulp.watch('src/includes/**/*.html', html);
  gulp.watch('src/sw/**/*', pwa);
  gulp.watch('src/manifest.json', manifest);
}

const build = gulp.series(
  gulp.parallel(styles, scripts, html, pwa, manifest, assets, data)
);

module.exports = {
  styles,
  scripts,
  html,
  pwa,
  manifest,
  assets,
  data,
  watch,
  build
};
