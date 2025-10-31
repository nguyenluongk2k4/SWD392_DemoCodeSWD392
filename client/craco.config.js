const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Allow imports from outside src/ directory using alias
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      };

      return webpackConfig;
    },
  },
};