import { ConfigurableCorePool } from "../core/ConfigurableCorePool";
import { SimulatorVisitor } from "../interface/SimulatorVisitor";
import { PoolState } from "../model/PoolState";
import { Transition } from "../model/Transition";
import { SimulationDataManager } from "../interface/SimulationDataManager";
export declare class SimulatorPersistenceVisitor implements SimulatorVisitor {
    private simulationDataManager;
    constructor(dbManager: SimulationDataManager);
    visitTransition(transition: Transition): Promise<string>;
    visitPoolState(poolState: PoolState, callback?: (poolState: PoolState, returnValue: number) => void): Promise<string>;
    visitConfigurableCorePool(configurableCorePool: ConfigurableCorePool): Promise<string>;
}
