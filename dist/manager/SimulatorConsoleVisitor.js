"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorConsoleVisitor = void 0;
const PoolConfig_1 = require("../model/PoolConfig");
class SimulatorConsoleVisitor {
    visitTransition(transition, callback) {
        console.log(transition.toString());
        if (callback)
            callback(transition, transition.toString());
        return Promise.resolve("ok");
    }
    visitPoolState(poolState, callback) {
        let corePool = poolState.recoverCorePool(true);
        console.log(corePool.toString());
        if (callback)
            callback(poolState, corePool.toString());
        return Promise.resolve("ok");
    }
    visitConfigurableCorePool(configurableCorePool, callback) {
        let poolConfig = configurableCorePool.poolState.poolConfig;
        console.log(PoolConfig_1.toString(poolConfig));
        if (callback)
            callback(configurableCorePool, PoolConfig_1.toString(poolConfig));
        return Promise.resolve("ok");
    }
}
exports.SimulatorConsoleVisitor = SimulatorConsoleVisitor;
