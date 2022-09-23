import { ConfigurableCorePool } from "../core/ConfigurableCorePool";
import { PoolStateContainer } from "../interface/PoolStateContainer";
import { SimulatorRoadmapManager as ISimulatorRoadmapManager } from "../interface/SimulatorRoadmapManager";
import { PoolState } from "../model/PoolState";
import { SimulationDataManager } from "../interface/SimulationDataManager";
export declare class SimulatorRoadmapManager implements ISimulatorRoadmapManager, PoolStateContainer {
    private simulationDataManager;
    private poolStates;
    private configurableCorePools;
    constructor(dbManager: SimulationDataManager);
    addPoolState(poolState: PoolState): string;
    getPoolState(poolStateId: string): PoolState | undefined;
    hasPoolState(poolStateId: string): boolean;
    addRoute(configurableCorePool: ConfigurableCorePool): void;
    printRoute(configurableCorePoolId: string): Promise<void>;
    listRoutes(): Array<ConfigurableCorePool>;
    persistRoute(configurableCorePoolId: string, description: string): Promise<string>;
    loadAndPrintRoute(roadmapId: string): Promise<void>;
}
