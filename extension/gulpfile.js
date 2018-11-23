const path = require("path");
const gulp = require('gulp');
const yargs = require("yargs");
const {exec, execSync} = require('child_process');
const sass = require('gulp-sass');
const del = require("del");
const {Linter} = require("tslint");
const tslint = require('gulp-tslint');
const inlinesource = require('gulp-inline-source');

const distFolder = 'dist';

gulp.task('clean', gulp.series(() => {
    return del([distFolder, '*.vsix']);
}));

gulp.task('tslint', gulp.series(() => {
    const program = Linter.createProgram("./tsconfig.json");
    return gulp.src([
        "scripts/**/*ts",
        "scripts/**/*tsx",
        "!scripts/wiqlEditor/compiler/wiqlTable.ts"
    ])
        .pipe(tslint({
            fix: true,
            formatter: "stylish",
            program,
        }))
        .pipe(tslint.report());
}));
gulp.task('styles', gulp.series(() => {
    return gulp.src("styles/**/*scss")
        .pipe(sass())
        .pipe(gulp.dest(distFolder));
}));

gulp.task('copy', gulp.parallel(() => {
    return gulp.src([
        'node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js',
    ]).pipe(gulp.dest(distFolder));
    }, () => {
    return gulp.src([
        "node_modules/monaco-editor/min/vs/base/**/*",
        "!**/*.svg",
    ]).pipe(gulp.dest(distFolder + '/node_modules/monaco-editor/min/vs/base'));
    }, () => {
    return gulp.src([
        "node_modules/monaco-editor/min/vs/basic-languages/**/*",
        "!**/*.svg",
    ]).pipe(gulp.dest(distFolder + '/node_modules/monaco-editor/min/vs/basic-languages'));
    }, () => {
    return gulp.src([
        "node_modules/monaco-editor/min/vs/editor/**/*",
        "!**/*.svg",
    ]).pipe(gulp.dest(distFolder + '/node_modules/monaco-editor/min/vs/editor'));
    }, () => {
    return gulp.src([
        "node_modules/monaco-editor/min/vs/loader.js",
    ]).pipe(gulp.dest(distFolder + '/node_modules/monaco-editor/min/vs'));
}));

gulp.task('html', gulp.series(gulp.parallel('copy', 'styles'), () => {
    return gulp.src("*.html")
        .pipe(inlinesource())
        .pipe(gulp.dest(distFolder));
}));

gulp.task('webpack', gulp.series(async () => {
    return execSync('webpack', {
        stdio: [null, process.stdout, process.stderr]
    });
}));

gulp.task('build', gulp.parallel('html', 'tslint', 'webpack'));

gulp.task('package', gulp.series('clean', 'build', async () => {
    const overrides = {}
    if (yargs.argv.release) {
        overrides.public = true;
    } else {
        const manifest = require('./vss-extension.json');
        overrides.name = manifest.name + ": Development Edition";
        overrides.id = manifest.id + "-dev2";
    }
    const overridesArg = `--override "${JSON.stringify(overrides).replace(/"/g, '\\"')}"`;
    const rootArg = `--root ${distFolder}`;
    const manifestsArg = `--manifests ..\\vss-extension.json`;

    execSync(
        `tfx extension create ${overridesArg} --rev-version`,
        (err, stdout, stderr) => {
            if (err) {
                console.log(err);
            }

            console.log(stdout);
            console.log(stderr);
            
        }
    );
}));

gulp.task('default', gulp.series('package'));


gulp.task('build-table', gulp.series(() => {
    execSync("tsc --p ../buildTable/tsconfig.json", {
        stdio: [null, process.stdout, process.stderr]
    });
}));

gulp.task('generate-table', gulp.series('build-table', () => {
    execSync('node ../buildTable/build/buildTable.js ./wiql.ebnf ./scripts/wiqlEditor/compiler/wiqlTable.ts', {
        stdio: [null, process.stdout, process.stderr]
    });
}));