module.exports = function (grunt) {
    grunt.initConfig({
        ts: {
            build: {
                tsconfig: true,
                "outDir": "./build"
            },
            options: {
                fast: 'never'
            }
        },
        exec: {
            buildTable: {
                command: "tsc --p ../buildTable/tsconfig.json"
            },
            generateParseTable: {
                command: "node ../buildTable/build/buildTable.js ./wiql.ebnf ./scripts/compiler/wiqlTable.ts",
                stdout: true,
                stderr: true
            },
            package_dev: {
                command: "tfx extension create --rev-version --manifests vss-extension.json --overrides-file configs/dev.json",
                stdout: true,
                stderr: true
            },
            package_release: {
                command: "tfx extension create --rev-version --manifests vss-extension.json --overrides-file configs/release.json",
                stdout: true,
                stderr: true
            },
            publish_dev: {
                command: "tfx extension publish --service-url https://marketplace.visualstudio.com --manifests vss-extension.json --overrides-file configs/dev.json",
                stdout: true,
                stderr: true
            },
            publish_release: {
                command: "tfx extension publish --service-url https://marketplace.visualstudio.com --manifests vss-extension.json --overrides-file configs/release.json",
                stdout: true,
                stderr: true
            }
        },
        copy: {
            scripts: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: [
                        "node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js",
                    ],
                    dest: "build",
                    filter: "isFile"
                }, {
                    expand: true,
                    flatten: false,
                    src: [
                        // Everything but the languages folder
                        "node_modules/monaco-editor/min/vs/base/**/*",
                        "node_modules/monaco-editor/min/vs/basic-languages/**/*",
                        "node_modules/monaco-editor/min/vs/editor/**/*",
                        "node_modules/monaco-editor/min/vs/loader.js",
                    ],
                    dest: "build",
                    filter: "isFile"
                }
                ]
            }
        },

        clean: {
            options: { force: true },
            build: ["scripts/**/*.js", "*.vsix", "build", "../buildTable/build"],
            svg: ["build/**/*.svg"]
        },
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask("build", ["clean:build", "ts:build", "copy:scripts", "clean:svg"]);

    grunt.registerTask("package-dev", ["build", "exec:package_dev"]);
    grunt.registerTask("package-release", ["build", "exec:package_release"]);
    grunt.registerTask("publish-dev", ["package-dev", "exec:publish_dev"]);
    grunt.registerTask("publish-release", ["package-release", "exec:publish_release"]);

    grunt.registerTask("generate-table", ["exec:buildTable", "exec:generateParseTable"]);

    grunt.registerTask("default", ["package-dev"]);
};