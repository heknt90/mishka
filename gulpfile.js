import path from "path";
import gulp from "gulp";
import plumber from "gulp-plumber";
import imagemin, { mozjpeg, optipng, svgo } from "gulp-imagemin";
import del from "del";
import bsync from "browser-sync";
import sassHandler from "sass";
import gulpSass from "gulp-sass";
import debug from "gulp-debug";

const sass = gulpSass(sassHandler);
const server = bsync.create();

const PATHS = {
  src: {
    base: "src",
    watch: function (type) {
      let path;
      if (type === "scss") {
        path = `${this.base}/scss/**/*.scss`;
      } else if (type === "html") {
        path = `${this.base}/**/*.html`;
      } else if (type === "fonts") {
        path = `${this.base}/fonts/**/*.{woff,woff2}`;
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
    .src(PATHS.src.watch("html"), { since: gulp.lastRun("html") })
    .pipe(debug({ title: "HTML" }))
    .pipe(gulp.dest(PATHS.dist.base))
    .pipe(server.stream())
);

gulp.task("fonts", () =>
  gulp
    .src(PATHS.src.watch("fonts"), { since: gulp.lastRun("fonts") })
    .pipe(debug({ title: "FONTS" }))
    .pipe(gulp.dest(`${PATHS.dist.base}/fonts`))
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
    gulp
      .watch(PATHS.src.watch("html"), gulp.series("html"))
      .on("unlink", unlinkHandler);
    gulp
      .watch(PATHS.src.watch("fonts"), gulp.series("fonts"))
      .on("unlink", unlinkHandler);
  })
);

gulp.task(
  "build",
  gulp.series("clean", gulp.parallel("scss", "html", "fonts"))
);

function unlinkHandler(filePath) {
  // отделяем часть пути относительно development папки
  const filePathFromSrc = path.relative(path.resolve(PATHS.src.base), filePath);
  //   Получаем относительный путь к файлу внутри production папки
  const destFilePath = path.relative(
    "./",
    path.resolve(PATHS.dist.base, filePathFromSrc)
  );
  //   Удаляем
  return del.sync(destFilePath);
}
