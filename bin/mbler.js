#!/usr/bin/env node
/**
 * @license MIT
 * @description MCBE附加包开发工具
 * @author github-Ruanhor
 */
const main = require('./../lib/start');
new main(require('path').dirname(__dirname))