import webpack from 'webpack'
import merge from 'webpack-merge'
import baseConfig from './webpack.config'

const config: webpack.Configuration = merge(baseConfig, {
  plugins: [
    new webpack.DefinePlugin({
      SERVER_URL: JSON.stringify('https://draw.odiak.net')
    })
  ]
})
export default config
