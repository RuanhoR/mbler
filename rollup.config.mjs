import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import ts from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import { readFileSync } from "node:fs";
// 基础配置
const main = {
  input: "src/index.ts", // 入口文件
  output: [
    {
      file: "dist/index.js", // CommonJS
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.esm.js", // CommonJS
      format: "esm",
      sourcemap: true,
    }
  ],
  plugins: [resolve(), json(), commonjs(), ts()],
  external: JSON.parse(readFileSync("package.json", "utf-8")).deependencies ? Object.keys(JSON.parse(readFileSync("package.json", "utf-8")).dependencies) : []
};
export default [main];
