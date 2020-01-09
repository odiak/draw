import webpack from 'webpack'
import defaultConfig from './webpack.config'

const def = new webpack.DefinePlugin({
  SERVER_URL: JSON.stringify('https://server.kakeru.app')
})

const config: webpack.Configuration = {
  ...defaultConfig,

  mode: 'production',
  plugins: defaultConfig.plugins!.map((p) => {
    if (p instanceof webpack.DefinePlugin) {
      return def
    }

    return p
  })
}

export default config
