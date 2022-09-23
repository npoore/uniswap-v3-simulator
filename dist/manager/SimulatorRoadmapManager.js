"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorRoadmapManager = void 0;
const Roadmap_1 = require("../model/Roadmap");
const PoolConfig_1 = require("../model/PoolConfig");
const PoolStateHelper_1 = require("../util/PoolStateHelper");
class SimulatorRoadmapManager {
    constructor(dbManager) {
        this.configurableCorePools = new Map();
        this.poolStates = new Map();
        this.simulationDataManager = dbManager;
    }
    addPoolState(poolState) {
        this.poolStates.set(poolState.id, poolState);
        return poolState.id;
    }
    getPoolState(poolStateId) {
        return this.poolStates.get(poolStateId);
    }
    hasPoolState(poolStateId) {
        return this.poolStates.has(poolStateId);
    }
    addRoute(configurableCorePool) {
        this.configurableCorePools.set(configurableCorePool.id, configurableCorePool);
    }
    printRoute(configurableCorePoolId) {
        if (!this.configurableCorePools.has(configurableCorePoolId)) {
            throw new Error("Can't find CorePool, id: " + configurableCorePoolId);
        }
        let pool = this.configurableCorePools.get(configurableCorePoolId);
        return pool.showStateTransitionRoute(pool.poolState.id);
    }
    listRoutes() {
        return [...this.configurableCorePools.values()];
    }
    persistRoute(configurableCorePoolId, description) {
        if (!this.configurableCorePools.has(configurableCorePoolId)) {
            throw new Error("Can't find CorePool, id: " + configurableCorePoolId);
        }
        let pool = this.configurableCorePools.get(configurableCorePoolId);
        let roadmapId;
        return pool
            .persistSnapshots(pool.poolState.id)
            .then((snapshotIds) => {
            let roadmap = new Roadmap_1.Roadmap(description, snapshotIds);
            roadmapId = roadmap.id;
            return this.simulationDataManager.persistRoadmap(roadmap);
        })
            .then(() => Promise.resolve(roadmapId));
    }
    loadAndPrintRoute(roadmapId) {
        return this.simulationDataManager
            .getRoadmap(roadmapId)
            .then((roadmap) => {
            if (!roadmap)
                return Promise.reject(new Error("Can't find Roadmap, id: " + roadmapId));
            console.log(Roadmap_1.toString(roadmap));
            return this.simulationDataManager.getSnapshots(roadmap.snapshots);
        })
            .then((snapshots) => {
            if (snapshots.length == 0)
                return Promise.resolve();
            console.log(PoolConfig_1.toString(snapshots[0].poolConfig));
            snapshots.forEach((snapshot) => {
                let recoveredCorePool = PoolStateHelper_1.PoolStateHelper.buildCorePoolBySnapshot(snapshot);
                console.log(recoveredCorePool.toString());
            });
            return Promise.resolve();
        });
    }
}
exports.SimulatorRoadmapManager = SimulatorRoadmapManager;
