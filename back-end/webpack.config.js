'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: [
        path.join(__dirname, 'app.js')
    ],
    output: {
        path: path.join(__dirname, '/dist/'),
        filename: '[name].js',
        publicPath: '/',
        libraryTarget: 'commonjs'
    },
    devtool: "source-map",
    cache: false,
    externals: [
        /^(?!\.|\/).+/i
    ],
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel',
                query: {
                    "presets": ["es2015", "stage-0"]
                }
            }, {
                test: /\.json?$/,
                loader: 'json'
            }
        ]
    },
    target: "node"
};