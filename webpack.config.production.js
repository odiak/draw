const webpack = require('webpack')
const defaultConfig = require('./webpack.config')

const def = new webpack.DefinePlugin({
  SERVER_URL: JSON.stringify('https://server.kakeru.app')
})

module.exports = {
  ...defaultConfig,

  mode: 'production',
  plugins: defaultConfig.plugins.map((p) => {
    if (p instanceof webpack.DefinePlugin) {
      return def
    }

    return p
  })
}
