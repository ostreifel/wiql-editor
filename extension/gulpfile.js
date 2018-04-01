const path = require("path");
const gulp = require('gulp');
const yargs = require("yargs");
const {exec, execSync} = require('child_process');
const sass = require('gulp-sass');
const del = require("del");
const ts = require("gulp-typescript");
const {Linter} = require("tslint");
const tslint = require('gulp-tslint');

const args =  yargs.argv;
const contentFolder = 'dist';

gulp.task('clean', () => {
    return del([contentFolder, '*.vsix']);
});

gulp.task('tslint', [], () => {
    const program = Linter.createProgram("./tsconfig.json");
    return gulp.src([
        "scripts/**/*ts",
        "scripts/**/*tsx",
        "!scripts/wiqlEditor/compiler/wiqlTable.ts"
    ])
        .pipe(tslint({
            formatter: "stylish",
            program,
        }))
        .pipe(tslint.report());
});

gulp.task('copy', ['clean'], () => {
    gulp.src([
        'node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js',
    ])
        .pipe(gulp.dest(contentFolder));
    gulp.src([
        "node_modules/monaco-editor/min/vs/base/**/*",
        "!**/*.svg",
    ]).pipe(gulp.dest(contentFolder + '/node_modules/monaco-editor/min/vs/base'));
    gulp.src([
        "node_modules/monaco-editor/min/vs/basic-languages/**/*",
        "!**/*.svg",
    ]).pipe(gulp.dest(contentFolder + '/node_modules/monaco-editor/min/vs/basic-languages'));
    gulp.src([
        "node_modules/monaco-editor/min/vs/editor/**/*",
        "!**/*.svg",
    ]).pipe(gulp.dest(contentFolder + '/node_modules/monaco-editor/min/vs/editor'));
    gulp.src([
        "node_modules/monaco-editor/min/vs/loader.js",
    ]).pipe(gulp.dest(contentFolder + '/node_modules/monaco-editor/min/vs'));
});

gulp.task('webpack', ['copy', 'tslint'], () => {
    return execSync('webpack', {
        stdio: [null, process.stdout, process.stderr]
    });
});

gulp.task('package', ['webpack'], () => {
    const overrides = {}
    if (yargs.argv.release) {
        overrides.public = true;
    } else {
        const manifest = require('./vss-extension.json');
        overrides.name = manifest.name + ": Development Edition";
        overrides.id = manifest.id + "-dev";
    }
    const overridesArg = `--override "${JSON.stringify(overrides).replace(/"/g, '\\"')}"`;
    const rootArg = `--root ${contentFolder}`;
    const manifestsArg = `--manifests ..\\vss-extension.json`;

    exec(
        `tfx extension create ${overridesArg} --rev-version`,
        (err, stdout, stderr) => {
            if (err) {
                console.log(err);
            }

            console.log(stdout);
            console.log(stderr);
            
        }
    );

});

gulp.task('default', ['package']);


gulp.task('build-table', [], () => {
    execSync("tsc --p ../buildTable/tsconfig.json", {
        stdio: [null, process.stdout, process.stderr]
    });
});

gulp.task('generate-table', ['build-table'], () => {
    execSync('node ../buildTable/build/buildTable.js ./wiql.ebnf ./scripts/wiqlEditor/compiler/wiqlTable.ts', {
        stdio: [null, process.stdout, process.stderr]
    });
});