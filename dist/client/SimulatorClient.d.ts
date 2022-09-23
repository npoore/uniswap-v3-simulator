import { PoolConfig } from "../model/PoolConfig";
import { SimulationDataManager } from "../interface/SimulationDataManager";
import { SnapshotProfile } from "../entity/SnapshotProfile";
import { SimulatorRoadmapManager as ISimulatorRoadmapManager } from "../interface/SimulatorRoadmapManager";
import { ConfigurableCorePool as IConfigurableCorePool } from "../interface/ConfigurableCorePool";
import { EndBlockTypeWhenInit, EndBlockTypeWhenRecover } from "../entity/EndBlockType";
import { EventDataSourceType } from "../enum/EventDataSourceType";
export declare class SimulatorClient {
    private simulatorDBManager;
    private readonly _simulatorRoadmapManager;
    get simulatorRoadmapManager(): ISimulatorRoadmapManager;
    constructor(simulatorDBManager: SimulationDataManager);
    initCorePoolFromMainnet(poolName: string | undefined, poolAddress: string, endBlock: EndBlockTypeWhenInit, RPCProviderUrl?: string | undefined, eventDataSourceType?: EventDataSourceType): Promise<IConfigurableCorePool>;
    recoverFromMainnetEventDBFile(mainnetEventDBFilePath: string, endBlock: EndBlockTypeWhenRecover, RPCProviderUrl?: string | undefined, eventDataSourceType?: EventDataSourceType): Promise<IConfigurableCorePool>;
    initCorePoolFromConfig(poolConfig: PoolConfig): IConfigurableCorePool;
    recoverCorePoolFromSnapshot(snapshotId: string): Promise<IConfigurableCorePool>;
    listSnapshotProfiles(): Promise<SnapshotProfile[]>;
    shutdown(): Promise<void>;
    private getSnapshot;
}
