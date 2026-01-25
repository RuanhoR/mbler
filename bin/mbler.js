#!/usr/bin/env node

/**
 * @license MIT
 * @description MCBE附加包开发工具
 * @author github-Ruanhor
 */
const main = require('./../lib/start');
try {
  new main(require('path').dirname(__dirname))
} catch (error) {
  console.log("[runtime error]: " + error.stack);
  process.exit(1)
}