const path = require("path")
const isProduction = process.env.NODE_ENV === "production"

/** @type {import("webpack").Configuration} */
const config = {
    mode: isProduction ? "production" : "development",
    entry: {
        main: "./src/index.ts",
    },
    target: 'node',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                loader: "ts-loader",
                options: { compilerOptions: { module: "esnext", moduleResolution: "node" } },
            }
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"],
    },
    devtool: "source-map"
}

module.exports = config