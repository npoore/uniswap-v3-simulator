"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurableCorePool = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const PoolState_1 = require("../model/PoolState");
const ActionType_1 = require("../enum/ActionType");
const PoolStateHelper_1 = require("../util/PoolStateHelper");
const IdGenerator_1 = require("../util/IdGenerator");
const SimulatorConsoleVisitor_1 = require("../manager/SimulatorConsoleVisitor");
const InternalConstants_1 = require("../enum/InternalConstants");
const __1 = require("..");
class ConfigurableCorePool {
    constructor(poolState, simulatorRoadmapManager, simulatorConsoleVisitor, simulatorPersistenceVisitor) {
        this.postProcessorCallback = async function () { };
        this.simulatorConsoleVisitor = simulatorConsoleVisitor;
        this.simulatorPersistenceVisitor = simulatorPersistenceVisitor;
        this.id = IdGenerator_1.IdGenerator.guid();
        if (poolState.hasSnapshot()) {
            this.corePool = PoolStateHelper_1.PoolStateHelper.buildCorePoolBySnapshot(poolState.snapshot);
        }
        else if (poolState.hasBaseSnapshot()) {
            this.corePool = PoolStateHelper_1.PoolStateHelper.buildCorePoolBySnapshot(poolState.baseSnapshot);
        }
        else {
            this.corePool = PoolStateHelper_1.PoolStateHelper.buildCorePoolByPoolConfig(poolState.poolConfig);
        }
        this._poolState = poolState;
        this.simulatorRoadmapManager = simulatorRoadmapManager;
        this.simulatorRoadmapManager.addPoolState(this.poolState);
        this.simulatorRoadmapManager.addRoute(this);
    }
    getPoolState() {
        return this.poolState;
    }
    getCorePool() {
        return this.corePool;
    }
    initialize(sqrtPriceX96, postProcessorCallback) {
        let currentPoolStateId = this.poolState.id;
        try {
            let res = this.corePool.initialize(sqrtPriceX96);
            return this.postProcess(ActionType_1.ActionType.INITIALIZE, { type: ActionType_1.ActionType.INITIALIZE, sqrtPriceX96 }, {}, postProcessorCallback).then(() => Promise.resolve(res));
        }
        catch (error) {
            this.recover(currentPoolStateId);
            throw error;
        }
    }
    mint(recipient, tickLower, tickUpper, amount, postProcessorCallback) {
        let currentPoolStateId = this.poolState.id;
        let res;
        try {
            res = this.corePool.mint(recipient, tickLower, tickUpper, amount);
        }
        catch (error) {
            this.recover(currentPoolStateId);
            throw error;
        }
        return this.postProcess(ActionType_1.ActionType.MINT, {
            type: ActionType_1.ActionType.MINT,
            recipient,
            tickLower,
            tickUpper,
            amount,
        }, res, postProcessorCallback)
            .then(() => Promise.resolve(res))
            .catch((err) => {
            this.recover(currentPoolStateId);
            return Promise.reject(err);
        });
    }
    burn(owner, tickLower, tickUpper, amount, postProcessorCallback) {
        let currentPoolStateId = this.poolState.id;
        let res;
        try {
            res = this.corePool.burn(owner, tickLower, tickUpper, amount);
        }
        catch (error) {
            this.recover(currentPoolStateId);
            throw error;
        }
        return this.postProcess(ActionType_1.ActionType.BURN, {
            type: ActionType_1.ActionType.BURN,
            owner,
            tickLower,
            tickUpper,
            amount,
        }, res, postProcessorCallback)
            .then(() => Promise.resolve(res))
            .catch((err) => {
            this.recover(currentPoolStateId);
            return Promise.reject(err);
        });
    }
    collect(recipient, tickLower, tickUpper, amount0Requested, amount1Requested, postProcessorCallback) {
        let currentPoolStateId = this.poolState.id;
        let res;
        try {
            res = this.corePool.collect(recipient, tickLower, tickUpper, amount0Requested, amount1Requested);
        }
        catch (error) {
            this.recover(currentPoolStateId);
            throw error;
        }
        return this.postProcess(ActionType_1.ActionType.COLLECT, {
            type: ActionType_1.ActionType.COLLECT,
            recipient,
            tickLower,
            tickUpper,
            amount0Requested,
            amount1Requested,
        }, res, postProcessorCallback)
            .then(() => Promise.resolve(res))
            .catch((err) => {
            this.recover(currentPoolStateId);
            return Promise.reject(err);
        });
    }
    swap(zeroForOne, amountSpecified, sqrtPriceLimitX96, postProcessorCallback) {
        let currentPoolStateId = this.poolState.id;
        let res;
        try {
            res = this.corePool.swap(zeroForOne, amountSpecified, sqrtPriceLimitX96);
        }
        catch (error) {
            this.recover(currentPoolStateId);
            throw error;
        }
        return this.postProcess(ActionType_1.ActionType.SWAP, {
            type: ActionType_1.ActionType.SWAP,
            zeroForOne,
            amountSpecified,
            sqrtPriceLimitX96,
        }, res, postProcessorCallback)
            .then(() => Promise.resolve(res))
            .catch((err) => {
            this.recover(currentPoolStateId);
            return Promise.reject(err);
        });
    }
    querySwap(zeroForOne, amountSpecified, sqrtPriceLimitX96) {
        return Promise.resolve(this.corePool.querySwap(zeroForOne, amountSpecified, sqrtPriceLimitX96));
    }
    async resolveInputFromSwapResultEvent(param) {
        let tryWithDryRun = (param, amountSpecified, sqrtPriceLimitX96) => {
            let zeroForOne = jsbi_1.default.greaterThan(param.amount0, InternalConstants_1.ZERO)
                ? true
                : false;
            return this.querySwap(zeroForOne, amountSpecified, sqrtPriceLimitX96).then(({ amount0, amount1, sqrtPriceX96 }) => {
                return (jsbi_1.default.equal(amount0, param.amount0) &&
                    jsbi_1.default.equal(amount1, param.amount1) &&
                    jsbi_1.default.equal(sqrtPriceX96, param.sqrtPriceX96));
            });
        };
        let solution1 = {
            amountSpecified: jsbi_1.default.equal(param.liquidity, InternalConstants_1.ZERO)
                ? __1.FullMath.incrTowardInfinity(param.amount0)
                : param.amount0,
            sqrtPriceLimitX96: param.sqrtPriceX96,
        };
        let solution2 = {
            amountSpecified: jsbi_1.default.equal(param.liquidity, InternalConstants_1.ZERO)
                ? __1.FullMath.incrTowardInfinity(param.amount1)
                : param.amount1,
            sqrtPriceLimitX96: param.sqrtPriceX96,
        };
        let solution3 = {
            amountSpecified: param.amount0,
            sqrtPriceLimitX96: undefined,
        };
        let solution4 = {
            amountSpecified: param.amount1,
            sqrtPriceLimitX96: undefined,
        };
        let solutionList = [solution3, solution4];
        if (jsbi_1.default.notEqual(param.sqrtPriceX96, this.getCorePool().sqrtPriceX96)) {
            if (jsbi_1.default.equal(param.liquidity, jsbi_1.default.BigInt(-1))) {
                let solution5 = {
                    amountSpecified: param.amount0,
                    sqrtPriceLimitX96: param.sqrtPriceX96,
                };
                let solution6 = {
                    amountSpecified: param.amount1,
                    sqrtPriceLimitX96: param.sqrtPriceX96,
                };
                solutionList.push(solution5);
                solutionList.push(solution6);
            }
            solutionList.push(solution1);
            solutionList.push(solution2);
        }
        for (let i = 0; i < solutionList.length; i++) {
            if (await tryWithDryRun(param, solutionList[i].amountSpecified, solutionList[i].sqrtPriceLimitX96)) {
                return {
                    amountSpecified: solutionList[i].amountSpecified,
                    sqrtPriceX96: solutionList[i].sqrtPriceLimitX96,
                };
            }
        }
        throw new Error("Can't resolve to the same as event records. Please check event input.");
    }
    // user custom PostProcessor will be called after pool state transition finishes
    updatePostProcessor(callback) {
        this.postProcessorCallback = callback;
    }
    takeSnapshot(description) {
        if (this.poolState.hasSnapshot())
            return false;
        this.poolState.takeSnapshot(description, this.corePool.token0Balance, this.corePool.token1Balance, this.corePool.sqrtPriceX96, this.corePool.liquidity, this.corePool.tickCurrent, this.corePool.feeGrowthGlobal0X128, this.corePool.feeGrowthGlobal1X128, this.corePool.tickManager, this.corePool.positionManager);
        return true;
    }
    fork() {
        this.takeSnapshot("Automated for forking");
        return new ConfigurableCorePool(this.poolState.fork(), this.simulatorRoadmapManager, this.simulatorConsoleVisitor, this.simulatorPersistenceVisitor);
    }
    persistSnapshot() {
        return this.traversePoolStateChain(this.simulatorPersistenceVisitor, this.poolState.id, this.poolState.id).then(() => Promise.resolve(this.poolState.id));
    }
    stepBack() {
        let fromTransition = this.poolState.transitionSource;
        if (!fromTransition) {
            throw new Error("This is already initial poolState.");
        }
        this.recover(fromTransition.source.id);
    }
    recover(poolStateId) {
        if (!this.simulatorRoadmapManager.hasPoolState(poolStateId)) {
            throw new Error("Can't find poolState, id: " + poolStateId);
        }
        let poolState = this.simulatorRoadmapManager.getPoolState(poolStateId);
        this._poolState = poolState;
        this.corePool = poolState.recoverCorePool();
    }
    get poolState() {
        return this._poolState;
    }
    accept(visitor) {
        return visitor.visitConfigurableCorePool(this);
    }
    // this will take snapshot during PoolStates to speed up
    showStateTransitionRoute(toPoolStateId, fromPoolStateId) {
        let simulatorConsoleVisitor = new SimulatorConsoleVisitor_1.SimulatorConsoleVisitor();
        return this.traversePoolStateChain(simulatorConsoleVisitor, toPoolStateId ? toPoolStateId : this.poolState.id, fromPoolStateId);
    }
    persistSnapshots(toPoolStateId, fromPoolStateId) {
        let snapshotIds = [];
        let poolStateVisitCallback = (_, returnValue) => {
            if (returnValue > 0)
                snapshotIds.push(returnValue);
        };
        return this.traversePoolStateChain(this.simulatorPersistenceVisitor, toPoolStateId, fromPoolStateId, poolStateVisitCallback).then(() => Promise.resolve(snapshotIds));
    }
    traversePoolStateChain(visitor, toPoolStateId, fromPoolStateId, poolStateVisitCallback) {
        if (fromPoolStateId &&
            !this.simulatorRoadmapManager.hasPoolState(fromPoolStateId)) {
            throw new Error("Can't find poolState, id: " + fromPoolStateId);
        }
        if (!this.simulatorRoadmapManager.hasPoolState(toPoolStateId)) {
            throw new Error("Can't find poolState, id: " + toPoolStateId);
        }
        let toPoolState = this.simulatorRoadmapManager.getPoolState(toPoolStateId);
        return this.accept(visitor).then(() => this.handleSingleStepOnChain(toPoolState, visitor, fromPoolStateId, poolStateVisitCallback));
    }
    handleSingleStepOnChain(poolState, simulatorVisitor, fromPoolStateId, poolStateVisitCallback) {
        if (!poolState.transitionSource ||
            poolState.transitionSource.record.actionType == ActionType_1.ActionType.FORK ||
            poolState.id == fromPoolStateId) {
            return poolState
                .accept(simulatorVisitor, poolStateVisitCallback)
                .then(() => Promise.resolve());
        }
        else {
            let fromTransition = poolState.transitionSource;
            return (this.handleSingleStepOnChain(fromTransition.source, simulatorVisitor, fromPoolStateId, poolStateVisitCallback)
                .then(() => fromTransition.accept(simulatorVisitor))
                .then(() => poolState.accept(simulatorVisitor, poolStateVisitCallback))
                // this will clear auto caching of snapshot in last PoolState to save memory space
                .then(() => fromTransition.source.clearSnapshot(true))
                .then(() => Promise.resolve()));
        }
    }
    buildRecord(actionType, actionParams, actionReturnValues) {
        return {
            id: IdGenerator_1.IdGenerator.guid(),
            actionType,
            actionParams,
            actionReturnValues,
            timestamp: new Date(),
        };
    }
    getNextPoolState(fromTransition) {
        let nextPoolState = new PoolState_1.PoolState(this.poolState.poolConfig, undefined, fromTransition);
        fromTransition.target = nextPoolState;
        return nextPoolState;
    }
    postProcess(actionType, actionParams, actionReturnValues, postProcessorCallback) {
        let record = this.buildRecord(actionType, actionParams, actionReturnValues);
        let transition = this.poolState.addTransitionTarget(record);
        let nextPoolState = this.getNextPoolState(transition);
        this.simulatorRoadmapManager.addPoolState(nextPoolState);
        this._poolState = nextPoolState;
        let postProcessor = postProcessorCallback
            ? postProcessorCallback
            : this.postProcessorCallback;
        return postProcessor(this, transition);
    }
}
exports.ConfigurableCorePool = ConfigurableCorePool;
