const { expoRouterBabelPlugin } = require("babel-preset-expo/build/expo-router-plugin");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // babel-preset-expo only auto-loads expo-router when it can resolve it from the
    // hoisted install path (monorepo root). The app keeps expo-router locally.
    plugins: [expoRouterBabelPlugin],
  };
};
