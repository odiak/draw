const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { EnvironmentPlugin } = require('webpack')
const dotenv = require('dotenv')
const CopyWebpackPlugin = require('copy-webpack-plugin')

dotenv.config({ path: '.env.local' })

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
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
    new EnvironmentPlugin({
      NEXT_PUBLIC_FIREBASE_CONFIG: '',
      NEXT_PUBLIC_SENTRY_DSN: '',
      NEXT_PUBLIC_RECAPTCHA_KEY: ''
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: '**/*',
          context: 'public'
        }
      ]
    })
  ],
  devServer: {
    historyApiFallback: true
  }
}
