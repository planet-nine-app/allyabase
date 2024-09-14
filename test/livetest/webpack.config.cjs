const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './src/livetest.js',
 
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  }
};
