import JSBI from "jsbi";
import { PoolState } from "../model/PoolState";
import { Visitable } from "../interface/Visitable";
import { SimulatorVisitor } from "../interface/SimulatorVisitor";
import { SimulatorConsoleVisitor } from "../manager/SimulatorConsoleVisitor";
import { SimulatorPersistenceVisitor } from "../manager/SimulatorPersistenceVisitor";
import { SimulatorRoadmapManager } from "../manager/SimulatorRoadmapManager";
import { ConfigurableCorePool as IConfigurableCorePool } from "../interface/ConfigurableCorePool";
import { CorePoolView } from "../interface/CorePoolView";
import { PoolStateView } from "../interface/PoolStateView";
import { Transition as TransitionView } from "../interface/Transition";
import { SwapEvent } from "../entity/SwapEvent";
export declare class ConfigurableCorePool implements IConfigurableCorePool, Visitable {
    readonly id: string;
    private simulatorConsoleVisitor;
    private simulatorPersistenceVisitor;
    private _poolState;
    private simulatorRoadmapManager;
    private corePool;
    private postProcessorCallback;
    constructor(poolState: PoolState, simulatorRoadmapManager: SimulatorRoadmapManager, simulatorConsoleVisitor: SimulatorConsoleVisitor, simulatorPersistenceVisitor: SimulatorPersistenceVisitor);
    getPoolState(): PoolStateView;
    getCorePool(): CorePoolView;
    initialize(sqrtPriceX96: JSBI, postProcessorCallback?: (configurableCorePool: IConfigurableCorePool, transition: TransitionView) => Promise<void>): Promise<void>;
    mint(recipient: string, tickLower: number, tickUpper: number, amount: JSBI, postProcessorCallback?: (configurableCorePool: IConfigurableCorePool, transition: TransitionView) => Promise<void>): Promise<{
        amount0: JSBI;
        amount1: JSBI;
    }>;
    burn(owner: string, tickLower: number, tickUpper: number, amount: JSBI, postProcessorCallback?: (configurableCorePool: IConfigurableCorePool, transition: TransitionView) => Promise<void>): Promise<{
        amount0: JSBI;
        amount1: JSBI;
    }>;
    collect(recipient: string, tickLower: number, tickUpper: number, amount0Requested: JSBI, amount1Requested: JSBI, postProcessorCallback?: (configurableCorePool: IConfigurableCorePool, transition: TransitionView) => Promise<void>): Promise<{
        amount0: JSBI;
        amount1: JSBI;
    }>;
    swap(zeroForOne: boolean, amountSpecified: JSBI, sqrtPriceLimitX96?: JSBI, postProcessorCallback?: (configurableCorePool: IConfigurableCorePool, transition: TransitionView) => Promise<void>): Promise<{
        amount0: JSBI;
        amount1: JSBI;
    }>;
    querySwap(zeroForOne: boolean, amountSpecified: JSBI, sqrtPriceLimitX96?: JSBI): Promise<{
        amount0: JSBI;
        amount1: JSBI;
        sqrtPriceX96: JSBI;
    }>;
    resolveInputFromSwapResultEvent(param: SwapEvent): Promise<{
        amountSpecified: JSBI;
        sqrtPriceX96?: JSBI;
    }>;
    updatePostProcessor(callback: (configurableCorePool: IConfigurableCorePool, transition: TransitionView) => Promise<void>): void;
    takeSnapshot(description: string): boolean;
    fork(): IConfigurableCorePool;
    persistSnapshot(): Promise<string>;
    stepBack(): void;
    recover(poolStateId: string): void;
    get poolState(): PoolState;
    accept(visitor: SimulatorVisitor): Promise<string>;
    showStateTransitionRoute(toPoolStateId?: string, fromPoolStateId?: string): Promise<void>;
    persistSnapshots(toPoolStateId: string, fromPoolStateId?: string): Promise<Array<number>>;
    private traversePoolStateChain;
    private handleSingleStepOnChain;
    private buildRecord;
    private getNextPoolState;
    private postProcess;
}
