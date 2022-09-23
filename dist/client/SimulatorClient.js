"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorClient = void 0;
const ConfigurableCorePool_1 = require("../core/ConfigurableCorePool");
const PoolState_1 = require("../model/PoolState");
const SimulatorRoadmapManager_1 = require("../manager/SimulatorRoadmapManager");
const SimulatorConsoleVisitor_1 = require("../manager/SimulatorConsoleVisitor");
const SimulatorPersistenceVisitor_1 = require("../manager/SimulatorPersistenceVisitor");
const EventDBManager_1 = require("../manager/EventDBManager");
const MainnetDataDownloader_1 = require("./MainnetDataDownloader");
const EventDataSourceType_1 = require("../enum/EventDataSourceType");
class SimulatorClient {
    constructor(simulatorDBManager) {
        this.simulatorDBManager = simulatorDBManager;
        this._simulatorRoadmapManager = new SimulatorRoadmapManager_1.SimulatorRoadmapManager(simulatorDBManager);
    }
    get simulatorRoadmapManager() {
        return this._simulatorRoadmapManager;
    }
    async initCorePoolFromMainnet(poolName = "", poolAddress, endBlock, RPCProviderUrl = undefined, eventDataSourceType = EventDataSourceType_1.EventDataSourceType.SUBGRAPH) {
        let mainnetDataDownloader = new MainnetDataDownloader_1.MainnetDataDownloader(RPCProviderUrl, eventDataSourceType);
        await mainnetDataDownloader.download(poolName, poolAddress, endBlock);
        let eventDBFilePath = mainnetDataDownloader.generateMainnetEventDBFilePath(poolName, poolAddress);
        let eventDB = await EventDBManager_1.EventDBManager.buildInstance(eventDBFilePath);
        try {
            let poolConfig = await eventDB.getPoolConfig();
            let configurableCorePool = this.initCorePoolFromConfig(poolConfig);
            if (endBlock == "afterDeployment")
                return configurableCorePool;
            let endBlockInNumber = await mainnetDataDownloader.parseEndBlockTypeWhenInit(endBlock, poolAddress);
            await mainnetDataDownloader.initializeAndReplayEvents(eventDB, configurableCorePool, endBlockInNumber, endBlock == "afterInitialization");
            return configurableCorePool;
        }
        finally {
            await eventDB.close();
        }
    }
    async recoverFromMainnetEventDBFile(mainnetEventDBFilePath, endBlock, RPCProviderUrl = undefined, eventDataSourceType = EventDataSourceType_1.EventDataSourceType.SUBGRAPH) {
        let mainnetDataDownloader = new MainnetDataDownloader_1.MainnetDataDownloader(RPCProviderUrl, eventDataSourceType);
        await mainnetDataDownloader.update(mainnetEventDBFilePath, endBlock);
        let { poolAddress } = mainnetDataDownloader.parseFromMainnetEventDBFilePath(mainnetEventDBFilePath);
        let eventDB = await EventDBManager_1.EventDBManager.buildInstance(mainnetEventDBFilePath);
        try {
            let poolConfig = await eventDB.getPoolConfig();
            let configurableCorePool = this.initCorePoolFromConfig(poolConfig);
            if (endBlock == "afterDeployment")
                return configurableCorePool;
            let endBlockInNumber = await mainnetDataDownloader.parseEndBlockTypeWhenRecover(await eventDB.getLatestEventBlockNumber(), endBlock, poolAddress);
            await mainnetDataDownloader.initializeAndReplayEvents(eventDB, configurableCorePool, endBlockInNumber, endBlock == "afterInitialization");
            return configurableCorePool;
        }
        finally {
            await eventDB.close();
        }
    }
    initCorePoolFromConfig(poolConfig) {
        return new ConfigurableCorePool_1.ConfigurableCorePool(new PoolState_1.PoolState(poolConfig), this._simulatorRoadmapManager, new SimulatorConsoleVisitor_1.SimulatorConsoleVisitor(), new SimulatorPersistenceVisitor_1.SimulatorPersistenceVisitor(this.simulatorDBManager));
    }
    recoverCorePoolFromSnapshot(snapshotId) {
        return this.getSnapshot(snapshotId).then((snapshot) => !snapshot
            ? Promise.reject("This snapshot doesn't exist!")
            : Promise.resolve(new ConfigurableCorePool_1.ConfigurableCorePool(PoolState_1.PoolState.from(snapshot), this._simulatorRoadmapManager, new SimulatorConsoleVisitor_1.SimulatorConsoleVisitor(), new SimulatorPersistenceVisitor_1.SimulatorPersistenceVisitor(this.simulatorDBManager))));
    }
    listSnapshotProfiles() {
        return this.simulatorDBManager.getSnapshotProfiles();
    }
    shutdown() {
        return this.simulatorDBManager.close();
    }
    getSnapshot(snapshotId) {
        return this.simulatorDBManager.getSnapshot(snapshotId);
    }
}
exports.SimulatorClient = SimulatorClient;
