"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toString = exports.PoolConfig = void 0;
const IdGenerator_1 = require("../util/IdGenerator");
class PoolConfig {
    constructor(tickSpacing, token0, token1, fee) {
        this.id = IdGenerator_1.IdGenerator.guid();
        this.tickSpacing = tickSpacing;
        this.token0 = token0;
        this.token1 = token1;
        this.fee = fee;
    }
}
exports.PoolConfig = PoolConfig;
function toString(poolConfig) {
    return `
    Pool Config:
        id: ${poolConfig.id}
        tickSpacing: ${poolConfig.tickSpacing}
        token0: ${poolConfig.token0}
        token1: ${poolConfig.token1}
        fee: ${poolConfig.fee}
  `;
}
exports.toString = toString;
