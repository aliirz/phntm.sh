/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js modules that don't exist in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        process: require.resolve('process/browser'),
        buffer: require.resolve('buffer'),
      };

      // Add global polyfills using webpack
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }

    // Ignore optional native modules that WebTorrent tries to load
    config.externals = config.externals || [];
    config.externals.push({
      'utp-native': 'commonjs utp-native',
      'fs-native-extensions': 'commonjs fs-native-extensions'
    });

    return config;
  },
};

module.exports = nextConfig;