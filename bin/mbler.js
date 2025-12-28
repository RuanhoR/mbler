#!/usr/bin/env node
try {
  const main = require('./../lib/start');
  new main(require('path').dirname(__dirname))
} catch (err) {
  if (err.message.includes("Cannot find module")) console.log("Plase call 'npm install'")
}