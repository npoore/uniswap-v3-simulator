"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolStateHelper = void 0;
const CorePool_1 = require("../core/CorePool");
const ActionType_1 = require("../enum/ActionType");
const Serializer_1 = require("./Serializer");
const TickManager_1 = require("../manager/TickManager");
const PositionManager_1 = require("../manager/PositionManager");
class PoolStateHelper {
    static countHistoricalPoolStateTransitions(poolState) {
        let fromTransition = poolState.getTransitionSource();
        if (!fromTransition ||
            fromTransition.getRecord().actionType == ActionType_1.ActionType.FORK)
            return 1;
        return (PoolStateHelper.countHistoricalPoolStateTransitions(fromTransition.getSource()) + 1);
    }
    static recoverCorePoolByPoolStateChain(poolState) {
        let fromTransition = poolState.transitionSource;
        if (!fromTransition) {
            return poolState.hasBaseSnapshot()
                ? PoolStateHelper.buildCorePoolBySnapshot(poolState.baseSnapshot)
                : PoolStateHelper.buildCorePoolByPoolConfig(poolState.poolConfig);
        }
        else {
            if (poolState.hasSnapshot()) {
                let snapshot = poolState.snapshot;
                return PoolStateHelper.buildCorePoolBySnapshot(snapshot);
            }
            else {
                return PoolStateHelper.applyRecordOnCorePool(PoolStateHelper.recoverCorePoolByPoolStateChain(fromTransition.source), fromTransition.record);
            }
        }
    }
    static buildCorePoolBySnapshot(snapshot) {
        return new CorePool_1.CorePool(snapshot.poolConfig.token0, snapshot.poolConfig.token1, snapshot.poolConfig.fee, snapshot.poolConfig.tickSpacing, snapshot.token0Balance, snapshot.token1Balance, snapshot.sqrtPriceX96, snapshot.liquidity, snapshot.tickCurrent, snapshot.feeGrowthGlobal0X128, snapshot.feeGrowthGlobal1X128, Serializer_1.Serializer.deserialize(TickManager_1.TickManager, Serializer_1.Serializer.serialize(TickManager_1.TickManager, snapshot.tickManager)), Serializer_1.Serializer.deserialize(PositionManager_1.PositionManager, Serializer_1.Serializer.serialize(PositionManager_1.PositionManager, snapshot.positionManager)));
    }
    static buildCorePoolByPoolConfig(poolConfig) {
        return new CorePool_1.CorePool(poolConfig.token0, poolConfig.token1, poolConfig.fee, poolConfig.tickSpacing);
    }
    static applyRecordOnCorePool(corepool, record) {
        if (record.actionType == ActionType_1.ActionType.FORK) {
            return corepool;
        }
        let event = corepool[record.actionType];
        event.call(corepool, ...this.actionParamsToParamsArray(record.actionParams));
        return corepool;
    }
    static actionParamsToParamsArray(actionParams) {
        let paramKeys = Object.keys(actionParams);
        paramKeys.splice(paramKeys.indexOf("type"), 1);
        return paramKeys.map((paramKey) => actionParams[paramKey]);
    }
}
exports.PoolStateHelper = PoolStateHelper;
