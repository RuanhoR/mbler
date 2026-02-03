"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@minecraft/server");
console.log('console in ts minecraft');
server_1.world.getPlayers().sendMessage('text');
