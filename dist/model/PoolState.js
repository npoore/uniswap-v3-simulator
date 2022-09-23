"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolState = void 0;
const Transition_1 = require("../model/Transition");
const PositionManager_1 = require("../manager/PositionManager");
const TickManager_1 = require("../manager/TickManager");
const IdGenerator_1 = require("../util/IdGenerator");
const PoolStateHelper_1 = require("../util/PoolStateHelper");
const ActionType_1 = require("../enum/ActionType");
const Serializer_1 = require("../util/Serializer");
const DEFAULT_SNAPSHOT_DESCRIPTION = "Automated for caching";
class PoolState {
    constructor(poolConfig, baseSnapshot, fromTransition) {
        this.transitionTargets = new Array();
        this.timestamp = new Date();
        if (!poolConfig && !baseSnapshot) {
            throw new Error("Please provide a pool config or a base snapshot!");
        }
        this.poolConfig = baseSnapshot ? baseSnapshot.poolConfig : poolConfig;
        this.id = baseSnapshot ? baseSnapshot.id : IdGenerator_1.IdGenerator.guid();
        this.baseSnapshot = baseSnapshot;
        this.transitionSource = fromTransition;
    }
    get snapshot() {
        return this._snapshot;
    }
    static from(baseSnapshot) {
        return new PoolState(undefined, baseSnapshot);
    }
    takeSnapshot(description, token0Balance, token1Balance, sqrtPriceX96, liquidity, tickCurrent, feeGrowthGlobal0X128, feeGrowthGlobal1X128, tickManager, positionManager) {
        this._snapshot = {
            id: this.id,
            description,
            poolConfig: this.poolConfig,
            token0Balance,
            token1Balance,
            sqrtPriceX96,
            liquidity,
            tickCurrent,
            feeGrowthGlobal0X128,
            feeGrowthGlobal1X128,
            tickManager: Serializer_1.Serializer.deserialize(TickManager_1.TickManager, Serializer_1.Serializer.serialize(TickManager_1.TickManager, tickManager)),
            positionManager: Serializer_1.Serializer.deserialize(PositionManager_1.PositionManager, Serializer_1.Serializer.serialize(PositionManager_1.PositionManager, positionManager)),
            timestamp: new Date(),
        };
    }
    accept(visitor, callback) {
        return visitor.visitPoolState(this, callback);
    }
    recoverCorePool(takeSnapshot) {
        let corePool = this.hasSnapshot()
            ? PoolStateHelper_1.PoolStateHelper.buildCorePoolBySnapshot(this.snapshot)
            : PoolStateHelper_1.PoolStateHelper.recoverCorePoolByPoolStateChain(this);
        if (takeSnapshot && !this.hasSnapshot()) {
            this.takeSnapshot(DEFAULT_SNAPSHOT_DESCRIPTION, corePool.token0Balance, corePool.token1Balance, corePool.sqrtPriceX96, corePool.liquidity, corePool.tickCurrent, corePool.feeGrowthGlobal0X128, corePool.feeGrowthGlobal1X128, corePool.tickManager, corePool.positionManager);
        }
        return corePool;
    }
    clearSnapshot(cachingOnly = false) {
        if (!this.hasSnapshot())
            return;
        if (!cachingOnly ||
            this.snapshot.description === DEFAULT_SNAPSHOT_DESCRIPTION)
            this._snapshot = undefined;
    }
    hasSnapshot() {
        return this.snapshot !== undefined;
    }
    hasBaseSnapshot() {
        return this.baseSnapshot !== undefined;
    }
    addTransitionTarget(record) {
        const transition = new Transition_1.Transition(this, record);
        this.transitionTargets.push(transition);
        return transition;
    }
    getTransitionSource() {
        return this.transitionSource;
    }
    getTransitionTargets() {
        return this.transitionTargets;
    }
    fork() {
        let record = {
            id: IdGenerator_1.IdGenerator.guid(),
            actionType: ActionType_1.ActionType.FORK,
            actionParams: { type: ActionType_1.ActionType.FORK },
            actionReturnValues: {},
            timestamp: new Date(),
        };
        let transition = this.addTransitionTarget(record);
        let forkedPoolState = new PoolState(this.poolConfig, this.baseSnapshot, transition);
        transition.target = forkedPoolState;
        forkedPoolState._snapshot = this.snapshot;
        return forkedPoolState;
    }
}
exports.PoolState = PoolState;
