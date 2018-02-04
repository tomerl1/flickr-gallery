const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractPlugin = new ExtractTextPlugin({
    filename: '[name].bundle.css',
});

module.exports = {
    entry: ['./app/js/main.js', './app/scss/main.scss'],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        loaders: [
            {
                loader: 'babel-loader',
                test: /\.js$/,
                exclude: /node_modules/
            }
        ],
        rules: [{
            test: /\.scss$/,
            use: extractPlugin.extract({
                use: ['css-loader', 'sass-loader']
            })
        }]
    },
    devServer: {
        port: 3000,
        publicPath: '/dist/'
    },
    plugins: [
        extractPlugin
    ],
    devtool: 'inline-source-map'
};