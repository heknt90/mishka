import path from "path";
import gulp from "gulp";
import newer from "gulp-newer";
import plumber from "gulp-plumber";
import imagemin, { mozjpeg, optipng, svgo } from "gulp-imagemin";
import del from "del";
import concat from "gulp-concat";
import uglify from "gulp-uglify";
import debug from "gulp-debug";
import bsync from "browser-sync";
import sassHandler from "sass";
import gulpSass from "gulp-sass";

const sass = gulpSass(sassHandler);
const server = bsync.create();

const PATHS = {
  src: {
    base: "src",
    watch: function (type) {
      let path = null;
      if (type === "scss") {
        path = `${this.base}/scss/**/*.scss`;
      } else if (type === "html") {
        path = `${this.base}/**/*.html`;
      } else if (type === "fonts") {
        path = `${this.base}/fonts/**/*.{woff,woff2}`;
      } else if (type === "images") {
        path = `${this.base}/images/**/*.{png,svg,jpg}`;
      } else if (type === "scripts") {
        path = `${this.base}/js/**/*.js`;
      }

      return path;
    },
  },
  dist: {
    base: "build",
  },
};

gulp.task("scss", () =>
  gulp
    .src(`${PATHS.src.base}/scss/style.scss`)
    .pipe(plumber())
    .pipe(sass())
    .pipe(gulp.dest(`${PATHS.dist.base}/css`))
    .pipe(server.stream())
);

gulp.task("html", () =>
  gulp
    .src(PATHS.src.watch("html"))
    .pipe(newer(PATHS.dist.base))
    .pipe(debug({ title: "HTML" }))
    .pipe(gulp.dest(PATHS.dist.base))
    .pipe(server.stream())
);

gulp.task("fonts", () =>
  gulp
    .src(PATHS.src.watch("fonts"))
    .pipe(newer(`${PATHS.dist.base}/fonts`))
    .pipe(debug({ title: "FONTS" }))
    .pipe(gulp.dest(`${PATHS.dist.base}/fonts`))
    .pipe(server.stream())
);

gulp.task("images", () =>
  gulp
    .src(PATHS.src.watch("images"))
    .pipe(newer(`${PATHS.dist.base}/images`))
    .pipe(debug({ title: "IMAGES" }))
    .pipe(
      imagemin([
        mozjpeg(
          { quality: 75, progressive: true },
          optipng({ optimizationLevel: 3 })
        ),
        svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(gulp.dest(`${PATHS.dist.base}/images`))
    .pipe(server.stream())
);

gulp.task("scripts", () =>
  gulp
    .src(PATHS.src.watch("scripts"))
    .pipe(concat("script.js"))
    //   .pipe(uglify())
    .pipe(gulp.dest(`${PATHS.dist.base}/js`))
    .pipe(server.stream())
);

gulp.task("clean", () => {
  return del(PATHS.dist.base);
});

gulp.task(
  "serve",
  gulp.series(() => {
    server.init({
      server: {
        baseDir: PATHS.dist.base,
      },
      notify: false,
      host: "localhost",
      port: 3000,
      open: false,
    });

    gulp.watch(PATHS.src.watch("scss"), gulp.series("scss"));
    gulp.watch(PATHS.src.watch("scripts"), gulp.series("scripts"));
    gulp
      .watch(PATHS.src.watch("html"), gulp.series("html"))
      .on("unlink", unlinkHandler);
    gulp
      .watch(PATHS.src.watch("fonts"), gulp.series("fonts"))
      .on("unlink", unlinkHandler);
    gulp
      .watch(PATHS.src.watch("images"), gulp.series("images"))
      .on("unlink", unlinkHandler);
  })
);

gulp.task(
  "build",
  gulp.series(
    "clean",
    gulp.parallel("scss", "html", "fonts", "images", "scripts")
  )
);

function unlinkHandler(filePath) {
  // отделяем часть пути относительно development папки
  const filePathFromSrc = path.relative(path.resolve(PATHS.src.base), filePath);
  //   Получаем относительный путь к файлу внутри production папки
  const destFilePath = path.relative(
    "./",
    path.resolve(PATHS.dist.base, filePathFromSrc)
  );
  //   Удаляем файл из production папки
  return del.sync(destFilePath);
}
