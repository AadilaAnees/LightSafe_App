// metro.config.js
// Ensures Metro resolves platform-specific files (.web.js) before generic .js
// This prevents react-native-maps from being bundled on web.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure .web.js is resolved before .js for web platform
// Metro already does this by default when platform=web, but being explicit avoids edge cases.
config.resolver.sourceExts = [
  "web.js",
  "web.jsx",
  "web.ts",
  "web.tsx",
  ...config.resolver.sourceExts,
];

module.exports = config;
