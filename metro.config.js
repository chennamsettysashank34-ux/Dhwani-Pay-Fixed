const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure @/* always resolves to the root Expo React Native directories
// and never accidentally resolves to the legacy Vite web-only ./src directory.
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules || {}),
    '@': path.resolve(__dirname),
  },
  blockList: [
    ...(Array.isArray(config.resolver?.blockList)
      ? config.resolver.blockList
      : config.resolver?.blockList
      ? [config.resolver.blockList]
      : []),
    new RegExp(`^${path.resolve(__dirname, 'src').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[/\\\\].*`),
    new RegExp(`^${path.resolve(__dirname, 'server').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[/\\\\].*`),
  ],
};

module.exports = config;
