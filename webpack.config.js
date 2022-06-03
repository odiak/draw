const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { DefinePlugin } = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const fs = require('fs')

const secrets = fs.readFileSync('./secrets.json', 'utf-8')

module.exports = (env, arg) => {
  const isRecaptchaEnabled = arg.mode === 'production'

  return {
    mode: 'development',
    entry: './src/index.tsx',
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      publicPath: '/'
    },
    module: {
      rules: [{ test: /\.tsx?/, loader: 'ts-loader' }]
    },
    plugins: [
      new HtmlWebpackPlugin({ template: './src/index.html' }),
      new DefinePlugin({
        kakeruSecrets: secrets,
        isRecaptchaEnabled
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
    },
    optimization: {
      runtimeChunk: 'single',
      moduleIds: 'deterministic',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
  }
}
