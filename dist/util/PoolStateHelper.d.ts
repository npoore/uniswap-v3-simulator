import { CorePool } from "../core/CorePool";
import { Snapshot } from "../entity/Snapshot";
import { PoolState } from "../model/PoolState";
import { PoolConfig } from "../model/PoolConfig";
import { PoolStateView } from "../interface/PoolStateView";
export declare abstract class PoolStateHelper {
    static countHistoricalPoolStateTransitions(poolState: PoolStateView): number;
    static recoverCorePoolByPoolStateChain(poolState: PoolState): CorePool;
    static buildCorePoolBySnapshot(snapshot: Snapshot): CorePool;
    static buildCorePoolByPoolConfig(poolConfig: PoolConfig): CorePool;
    private static applyRecordOnCorePool;
    private static actionParamsToParamsArray;
}
