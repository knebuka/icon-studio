const path = require("path");

module.exports = {
	mode: process.env.NODE_ENV || "development",
	entry: "./src/main.ts",
	target: "electron-main",
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "main.js",
	},
	node: {
		__dirname: false,
		__filename: false,
	},
};
