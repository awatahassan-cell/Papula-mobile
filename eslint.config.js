// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    files: ["scripts/**/*.cjs", "tests/**/*.cjs", "*.config.js"],
    languageOptions: {
      globals: { __dirname: "readonly", Buffer: "readonly", require: "readonly", module: "writable", process: "readonly", console: "readonly" },
    },
  },
  {
    ignores: ["dist/**", "work/**", "android/**", "ios/**", "public/**", ".expo/**"],
  }
]);
