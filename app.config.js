// Dynamic Expo app config to inject env vars into extra for EAS builds
// Does not commit secrets; values come from process.env at build time

// If you want local .env values available here too, install dotenv and uncomment:
// require('dotenv').config();

const appJson = require("./app.json");

module.exports = ({ config }) => {
  const base = appJson.expo || {};
  return {
    ...config,
    ...base,
    extra: {
      ...(base.extra || {}),
      // Firebase (optional): if provided by EAS env, available via Constants.expoConfig.extra
      FIREBASE_API_KEY:
        process.env.FIREBASE_API_KEY || base.extra?.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN:
        process.env.FIREBASE_AUTH_DOMAIN || base.extra?.FIREBASE_AUTH_DOMAIN,
      FIREBASE_DATABASE_URL:
        process.env.FIREBASE_DATABASE_URL || base.extra?.FIREBASE_DATABASE_URL,
      FIREBASE_PROJECT_ID:
        process.env.FIREBASE_PROJECT_ID || base.extra?.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET:
        process.env.FIREBASE_STORAGE_BUCKET ||
        base.extra?.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID:
        process.env.FIREBASE_MESSAGING_SENDER_ID ||
        base.extra?.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID:
        process.env.FIREBASE_APP_ID || base.extra?.FIREBASE_APP_ID,
      // Mapbox public token: prefer env, fallback to app.json existing value
      MAPBOX_API: process.env.MAPBOX_API || base.extra?.MAPBOX_API,
    },
  };
};
