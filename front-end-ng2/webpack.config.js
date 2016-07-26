'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        main: path.join(__dirname, 'src/main.ts'),
        vendor: path.join(__dirname, 'src/vendor.ts'),
        polyfills: path.join(__dirname, 'src/polyfills.ts')
    },

    devtool: 'cheap-module-eval-source-map',

    resolve: {
        extensions: ['', '.js', '.ts']
    },

    output: {
        path: path.join(__dirname, '/dist/'),
        publicPath: '/',
        chunkFilename: '[id].chunk.js',
        filename: '[name].js'
    },

    module: {
        loaders: [
            {
                test: /\.ts$/,
                loaders: ['ts', 'angular2-template-loader']
            },
            {
                test: /\.html$/,
                loader: 'html'
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                loader: 'file?name=assets/[name].[hash].[ext]'
            },
            {
                test: /\.(css|scss)$/,
                loader: ExtractTextPlugin.extract('style', 'css?sourceMap')
            }
        ]
    },

    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: ['main', 'vendor', 'polyfills']
        }),

        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src/index.html')
        }),

        new ExtractTextPlugin('[name].css')
    ],

    devServer: {
        historyApiFallback: true,
        stats: 'minimal'
    }
};