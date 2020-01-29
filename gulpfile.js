const gulp = require('gulp');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json');

const tscTaskSrc = ['app/**/*.ts*'];

const tscTask = function() {
	return tsProject.src()
		.pipe(tsProject())
		.js.pipe(gulp.dest('dist'));
};

const copyAssetsSrc = ['./app/**/*', '!./**/*.ts'];

const copyAssetsTask = function() {
	return gulp
		.src(copyAssetsSrc)
		.pipe(gulp.dest('dist'));
};

gulp.task('tsc', tscTask);
gulp.task('copyAssets', copyAssetsTask);

gulp.task('watch', function() {
	gulp.watch(tscTaskSrc, tscTask);
	gulp.watch(copyAssetsSrc, copyAssetsTask);
});

gulp.task('build', gulp.series(tscTask, copyAssetsTask));
