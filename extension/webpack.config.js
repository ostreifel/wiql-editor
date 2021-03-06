const webpack = require('webpack');
const path = require("path");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
    // Don't want symbols.ts to be minified - renaming the class names 
    mode: "development",
    entry: {
        playground: "./scripts/wiqlPlayground/playground.ts",
        queryContext: "./scripts/queryContext/queryContext.ts",
        queryEditor: "./scripts/queryEditor/queryEditor.ts"
    },
    output: {
        libraryTarget: "amd",
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },
    externals: [{
        "q": true,
        "react": true,
        "react-dom": true,
        "monaco": true,
    },
        /^TFS\//, // Ignore TFS/* since they are coming from VSTS host 
        /^VSS\//  // Ignore VSS/* since they are coming from VSTS host
    ],
    resolve: {
        // alias: { "office-ui-fabric-react": path.join(process.cwd(), 'node_modules', 'office-ui-fabric-react', 'lib-amd') },
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
      new BundleAnalyzerPlugin({
        openAnalyzer: false,
        reportFilename: "bundle-analysis.html",
        analyzerMode: "static"
      })
    ],
    devtool: "source-map",
    module: {
      rules: [
        // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
        { test: /\.tsx?$/, loader: "ts-loader" }
      ]
    }
};