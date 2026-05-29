import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
    { ignores: ["dist", "node_modules", "*.config.*"] },
    { files: ["**/*.js"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: { ...globals.node, ...globals.browser, ...globals.worker } } },
    { files: ["**/*.test.js"], languageOptions: { globals: { ...globals.node, ...globals.browser, ...globals.worker, ...globals.jest } } },
    { plugins: {'@stylistic': stylistic} },
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/no-extra-semi': 'error',
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/curly-newline': 'error',
            '@stylistic/indent': ['error', 4],
            '@stylistic/comma-dangle': ['error', 'never'],
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
        }
    }
]);
