import path from 'path'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import 'webpack-dev-server'
// @ts-ignore
import PnpWebpackPlugin from 'pnp-webpack-plugin'

const config: webpack.Configuration = {
  mode: 'development',
  entry: './src/index.tsx',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [PnpWebpackPlugin]
  },
  resolveLoader: {
    plugins: [PnpWebpackPlugin.moduleLoader(module)]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [{ test: /\.tsx?/, loader: 'ts-loader' }]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    new webpack.DefinePlugin({
      SERVER_URL: JSON.stringify('http://localhost:8000')
    })
  ],
  devServer: {
    historyApiFallback: true
  }
}

export default config
