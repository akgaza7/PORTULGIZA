import { FlatCompat } from "@eslint/eslintrc";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const nextConfigDirectory = path.dirname(require.resolve("eslint-config-next/package.json"));
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  resolvePluginsRelativeTo: nextConfigDirectory
});

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default eslintConfig;
