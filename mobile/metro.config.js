// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enables CSS support (required for web in Expo SDK 54 + expo-router v6)
  isCSSEnabled: true,
});

// Ensure Metro resolves packages from the project's node_modules first
// (fixes "Unable to resolve" errors for relative paths inside react-native-web)
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
];

module.exports = config;
