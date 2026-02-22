import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import ts from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
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
  external: [
    "typescript",
    "chokidar"
  ],
};
export default [main];
