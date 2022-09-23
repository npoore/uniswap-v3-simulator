"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorPersistenceVisitor = void 0;
class SimulatorPersistenceVisitor {
    constructor(dbManager) {
        this.simulationDataManager = dbManager;
    }
    visitTransition(transition) {
        return Promise.resolve("not implemented.");
    }
    visitPoolState(poolState, callback) {
        poolState.recoverCorePool(true);
        return this.simulationDataManager
            .persistSnapshot(poolState)
            .then((returnValue) => {
            if (callback)
                callback(poolState, returnValue);
            return Promise.resolve("ok");
        });
    }
    visitConfigurableCorePool(configurableCorePool) {
        return Promise.resolve("not implemented.");
    }
}
exports.SimulatorPersistenceVisitor = SimulatorPersistenceVisitor;
