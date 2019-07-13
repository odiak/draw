import path from 'path'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'

const config: webpack.Configuration = {
  mode: 'development',
  entry: './src/index.tsx',
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [{ test: /\.tsx?/, loader: 'ts-loader' }]
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })]
}

export default config
