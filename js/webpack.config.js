var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      PVWStyle: path.resolve('./node_modules/paraviewweb/style'),
    },
  },

  entry: ['./src/index.tsx'],
  output: {
    path: __dirname + '/dist',
    filename: 'SimpleDemoClient.js'
  },

  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: { presets: ['@babel/preset-env', '@babel/preset-react'] }
      },
      {
        test: /\.m?css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader?name=public/fonts/[name].[ext]'
      }
    ]
  },

  stats: {
    errorDetails: true
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: "ParaViewWeb-SimpleDemo",
      filename: 'index.html'
    }),
  ]
};
