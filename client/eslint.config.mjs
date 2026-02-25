import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "import/order": "off",
      "import/no-unresolved": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
];

export default eslintConfig;
