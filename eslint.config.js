import pluginJs from "@eslint/js";
import * as tsParser from "@typescript-eslint/parser";
import solid from "eslint-plugin-solid/dist/configs/typescript.js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  { files: ["./src/**/*.{ts,tsx}"] },
  {
    ignores: ["*.config.{ts,cjs}"],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...solid,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "tsconfig.json",
      },
    },
  },
];
