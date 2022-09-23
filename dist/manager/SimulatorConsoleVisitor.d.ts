import { ConfigurableCorePool } from "../core/ConfigurableCorePool";
import { SimulatorVisitor } from "../interface/SimulatorVisitor";
import { PoolState } from "../model/PoolState";
import { Transition } from "../model/Transition";
export declare class SimulatorConsoleVisitor implements SimulatorVisitor {
    visitTransition(transition: Transition, callback?: (transition: Transition, returnValue: string) => void): Promise<string>;
    visitPoolState(poolState: PoolState, callback?: (poolState: PoolState, returnValue: string) => void): Promise<string>;
    visitConfigurableCorePool(configurableCorePool: ConfigurableCorePool, callback?: (configurableCorePool: ConfigurableCorePool, returnValue: string) => void): Promise<string>;
}
