import path from 'path'

export default {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'Mobilitybox',
    libraryTarget: 'umd',
    libraryExport: 'Mobilitybox'
  },
  devtool: 'source-map',
}
