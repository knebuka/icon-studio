const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	mode: process.env.NODE_ENV || "development",
	entry: "./src/renderer.tsx",
	target: "electron-renderer",
	devtool: "source-map",
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js", ".jsx"],
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "renderer.js",
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./src/index.html",
			filename: "index.html",
		}),
	],
};
