const appJson = require("./app.json");

/** Production defaults so Gradle/Android Studio builds work without a local .env */
process.env.NODE_ENV ??= "development";
process.env.EXPO_PUBLIC_ANCAP_API_BASE ??= "https://api.ancap.cloud/v1";
process.env.EXPO_PUBLIC_ACP_RPC_URL ??= "https://acp1.ancap.cloud/rpc";
// npm workspaces: keep Metro project root on the app, not the monorepo root.
process.env.EXPO_NO_METRO_WORKSPACE_ROOT ??= "1";

/** @type {import('expo/config').ConfigContext} */
module.exports = () => ({
  ...appJson.expo,
});
