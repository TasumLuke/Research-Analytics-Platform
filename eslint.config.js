import js from "@eslint/js";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: ["tsconfig.json"],
      },
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Not needed for React 17+
      "no-unused-vars": "warn",
      "semi": ["warn", "always"],
      "quotes": ["warn", "double"],
    },
    settings: {
      react: { version: "detect" },
    },
  },
];
