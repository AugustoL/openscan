const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const DotenvWebpackPlugin = require("dotenv-webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const { execSync } = require("child_process");
const packageJson = require("./package.json");

const isProd = process.env.NODE_ENV === "production";
const isGhPages = process.env.GITHUB_PAGES === "true";

// Get git commit hash
let commitHash = "development";
try {
	commitHash = execSync("git rev-parse HEAD").toString().trim();
} catch (error) {
	console.warn("Could not get git commit hash:", error.message);
}

module.exports = {
	entry: path.resolve(__dirname, "src", "index.tsx"),
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "bundle.js",
		publicPath: isGhPages ? "/openscan/" : "/", // key for GH Pages
		clean: true,
		charset: false,
	},
	mode: isProd ? "production" : "development",
	devServer: {
		// Serve static assets from public (and dist as a fallback so icons are available in dev)
		static: [
			path.resolve(__dirname, "public"),
			path.resolve(__dirname, "dist"),
		],
		historyApiFallback: true,
		port: 3000,
		open: true,
		hot: true,
		liveReload: false,
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: "babel-loader",
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
				type: "asset/resource",
				generator: {
					filename: "images/[name].[hash][ext]",
				},
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js", ".jsx"],
	},
	optimization: {
		moduleIds: "deterministic",
		chunkIds: "deterministic",
		minimize: true,
		minimizer: [
			new (require("terser-webpack-plugin"))({
				terserOptions: {
					mangle: {
						safari10: true,
						reserved: [],
					},
					compress: {
						drop_console: false,
						drop_debugger: false,
						passes: 1,
					},
					format: {
						comments: false,
					},
				},
				parallel: false,
				extractComments: false,
			}),
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "public", "index.html"),
			inject: "body", // ensure script is injected
		}),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.resolve(__dirname, "public"),
					to: path.resolve(__dirname, "dist"),
					globOptions: {
						ignore: ["**/index.html"], // Don't copy index.html as HtmlWebpackPlugin handles it
					},
				},
			],
		}),
		new DotenvWebpackPlugin(),
		...(process.env.NODE_ENV !== "production"
			? [new webpack.HotModuleReplacementPlugin()]
			: []),
		new webpack.DefinePlugin({
			"process.env.REACT_APP_COMMIT_HASH": JSON.stringify(
				process.env.REACT_APP_COMMIT_HASH || commitHash,
			),
			"process.env.REACT_APP_GITHUB_REPO": JSON.stringify(
				process.env.REACT_APP_GITHUB_REPO ||
					"https://github.com/AugustoL/openscan",
			),
			"process.env.REACT_APP_VERSION": JSON.stringify(
				process.env.REACT_APP_VERSION || packageJson.version,
			),
		}),
	],
};
