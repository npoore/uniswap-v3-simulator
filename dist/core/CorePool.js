"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorePool = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const assert_1 = __importDefault(require("assert"));
const TickManager_1 = require("../manager/TickManager");
const PositionManager_1 = require("../manager/PositionManager");
const TickMath_1 = require("../util/TickMath");
const SqrtPriceMath_1 = require("../util/SqrtPriceMath");
const InternalConstants_1 = require("../enum/InternalConstants");
const SwapMath_1 = require("../util/SwapMath");
const LiquidityMath_1 = require("../util/LiquidityMath");
const FullMath_1 = require("../util/FullMath");
class CorePool {
    constructor(token0, token1, fee, tickSpacing, token0Balance = jsbi_1.default.BigInt(0), token1Balance = jsbi_1.default.BigInt(0), sqrtPriceX96 = jsbi_1.default.BigInt(0), liquidity = jsbi_1.default.BigInt(0), tickCurrent = 0, feeGrowthGlobal0X128 = jsbi_1.default.BigInt(0), feeGrowthGlobal1X128 = jsbi_1.default.BigInt(0), tickManager = new TickManager_1.TickManager(), positionManager = new PositionManager_1.PositionManager()) {
        this.token0 = token0;
        this.token1 = token1;
        this.fee = fee;
        this.tickSpacing = tickSpacing;
        this.maxLiquidityPerTick =
            TickMath_1.TickMath.tickSpacingToMaxLiquidityPerTick(tickSpacing);
        this._token0Balance = token0Balance;
        this._token1Balance = token1Balance;
        this._sqrtPriceX96 = sqrtPriceX96;
        this._liquidity = liquidity;
        this._tickCurrent = tickCurrent;
        this._feeGrowthGlobal0X128 = feeGrowthGlobal0X128;
        this._feeGrowthGlobal1X128 = feeGrowthGlobal1X128;
        this._tickManager = tickManager;
        this._positionManager = positionManager;
    }
    get token0Balance() {
        return this._token0Balance;
    }
    get token1Balance() {
        return this._token1Balance;
    }
    get sqrtPriceX96() {
        return this._sqrtPriceX96;
    }
    get liquidity() {
        return this._liquidity;
    }
    get tickCurrent() {
        return this._tickCurrent;
    }
    get feeGrowthGlobal0X128() {
        return this._feeGrowthGlobal0X128;
    }
    get feeGrowthGlobal1X128() {
        return this._feeGrowthGlobal1X128;
    }
    get tickManager() {
        return this._tickManager;
    }
    get positionManager() {
        return this._positionManager;
    }
    initialize(sqrtPriceX96) {
        assert_1.default(jsbi_1.default.equal(this.sqrtPriceX96, InternalConstants_1.ZERO), "Already initialized!");
        this._tickCurrent = TickMath_1.TickMath.getTickAtSqrtRatio(sqrtPriceX96);
        this._sqrtPriceX96 = sqrtPriceX96;
    }
    mint(recipient, tickLower, tickUpper, amount) {
        assert_1.default(jsbi_1.default.greaterThan(amount, InternalConstants_1.ZERO), "Mint amount should greater than 0");
        let amount0 = InternalConstants_1.ZERO;
        let amount1 = InternalConstants_1.ZERO;
        let positionStep = this.modifyPosition(recipient, tickLower, tickUpper, amount);
        amount0 = positionStep.amount0;
        amount1 = positionStep.amount1;
        return {
            amount0,
            amount1,
        };
    }
    burn(owner, tickLower, tickUpper, amount) {
        let { position, amount0, amount1 } = this.modifyPosition(owner, tickLower, tickUpper, jsbi_1.default.unaryMinus(amount));
        amount0 = jsbi_1.default.unaryMinus(amount0);
        amount1 = jsbi_1.default.unaryMinus(amount1);
        if (jsbi_1.default.greaterThan(amount0, InternalConstants_1.ZERO) || jsbi_1.default.greaterThan(amount1, InternalConstants_1.ZERO)) {
            let newTokensOwed0 = jsbi_1.default.add(position.tokensOwed0, amount0);
            let newTokensOwed1 = jsbi_1.default.add(position.tokensOwed1, amount1);
            position.updateBurn(newTokensOwed0, newTokensOwed1);
        }
        return {
            amount0,
            amount1,
        };
    }
    collect(recipient, tickLower, tickUpper, amount0Requested, amount1Requested) {
        this.checkTicks(tickLower, tickUpper);
        let { amount0, amount1 } = this.positionManager.collectPosition(recipient, tickLower, tickUpper, amount0Requested, amount1Requested);
        return {
            amount0,
            amount1,
        };
    }
    querySwap(zeroForOne, amountSpecified, sqrtPriceLimitX96) {
        return this.handleSwap(zeroForOne, amountSpecified, sqrtPriceLimitX96, true);
    }
    swap(zeroForOne, amountSpecified, sqrtPriceLimitX96) {
        return this.handleSwap(zeroForOne, amountSpecified, sqrtPriceLimitX96, false);
    }
    handleSwap(zeroForOne, amountSpecified, sqrtPriceLimitX96, isStatic) {
        if (!sqrtPriceLimitX96)
            sqrtPriceLimitX96 = zeroForOne
                ? jsbi_1.default.add(TickMath_1.TickMath.MIN_SQRT_RATIO, InternalConstants_1.ONE)
                : jsbi_1.default.subtract(TickMath_1.TickMath.MAX_SQRT_RATIO, InternalConstants_1.ONE);
        if (zeroForOne) {
            assert_1.default(jsbi_1.default.greaterThan(sqrtPriceLimitX96, TickMath_1.TickMath.MIN_SQRT_RATIO), "RATIO_MIN");
            assert_1.default(jsbi_1.default.lessThan(sqrtPriceLimitX96, this.sqrtPriceX96), "RATIO_CURRENT");
        }
        else {
            assert_1.default(jsbi_1.default.lessThan(sqrtPriceLimitX96, TickMath_1.TickMath.MAX_SQRT_RATIO), "RATIO_MAX");
            assert_1.default(jsbi_1.default.greaterThan(sqrtPriceLimitX96, this.sqrtPriceX96), "RATIO_CURRENT");
        }
        const exactInput = jsbi_1.default.greaterThanOrEqual(amountSpecified, InternalConstants_1.ZERO);
        // keep track of swap state
        const state = {
            amountSpecifiedRemaining: amountSpecified,
            amountCalculated: InternalConstants_1.ZERO,
            sqrtPriceX96: this.sqrtPriceX96,
            tick: this.tickCurrent,
            liquidity: this.liquidity,
            feeGrowthGlobalX128: zeroForOne
                ? this._feeGrowthGlobal0X128
                : this._feeGrowthGlobal1X128,
        };
        // start swap while loop
        while (jsbi_1.default.notEqual(state.amountSpecifiedRemaining, InternalConstants_1.ZERO) &&
            jsbi_1.default.notEqual(state.sqrtPriceX96, sqrtPriceLimitX96)) {
            let step = {
                sqrtPriceStartX96: InternalConstants_1.ZERO,
                tickNext: 0,
                initialized: false,
                sqrtPriceNextX96: InternalConstants_1.ZERO,
                amountIn: InternalConstants_1.ZERO,
                amountOut: InternalConstants_1.ZERO,
                feeAmount: InternalConstants_1.ZERO,
            };
            step.sqrtPriceStartX96 = state.sqrtPriceX96;
            // because each iteration of the while loop rounds, we can't optimize this code (relative to the smart contract)
            // by simply traversing to the next available tick, we instead need to exactly replicate
            // tickBitmap.nextInitializedTickWithinOneWord
            ({ nextTick: step.tickNext, initialized: step.initialized } =
                this.tickManager.getNextInitializedTick(state.tick, this.tickSpacing, zeroForOne));
            if (step.tickNext < TickMath_1.TickMath.MIN_TICK) {
                step.tickNext = TickMath_1.TickMath.MIN_TICK;
            }
            else if (step.tickNext > TickMath_1.TickMath.MAX_TICK) {
                step.tickNext = TickMath_1.TickMath.MAX_TICK;
            }
            step.sqrtPriceNextX96 = TickMath_1.TickMath.getSqrtRatioAtTick(step.tickNext);
            [state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount] =
                SwapMath_1.SwapMath.computeSwapStep(state.sqrtPriceX96, (zeroForOne
                    ? jsbi_1.default.lessThan(step.sqrtPriceNextX96, sqrtPriceLimitX96)
                    : jsbi_1.default.greaterThan(step.sqrtPriceNextX96, sqrtPriceLimitX96))
                    ? sqrtPriceLimitX96
                    : step.sqrtPriceNextX96, state.liquidity, state.amountSpecifiedRemaining, this.fee);
            if (exactInput) {
                state.amountSpecifiedRemaining = jsbi_1.default.subtract(state.amountSpecifiedRemaining, jsbi_1.default.add(step.amountIn, step.feeAmount));
                state.amountCalculated = jsbi_1.default.subtract(state.amountCalculated, step.amountOut);
            }
            else {
                state.amountSpecifiedRemaining = jsbi_1.default.add(state.amountSpecifiedRemaining, step.amountOut);
                state.amountCalculated = jsbi_1.default.add(state.amountCalculated, jsbi_1.default.add(step.amountIn, step.feeAmount));
            }
            if (jsbi_1.default.greaterThan(state.liquidity, InternalConstants_1.ZERO))
                state.feeGrowthGlobalX128 = jsbi_1.default.add(state.feeGrowthGlobalX128, FullMath_1.FullMath.mulDiv(step.feeAmount, InternalConstants_1.Q128, state.liquidity));
            if (jsbi_1.default.equal(state.sqrtPriceX96, step.sqrtPriceNextX96)) {
                // if the tick is initialized, run the tick transition
                if (step.initialized) {
                    let nextTick = this.tickManager.getTickAndInitIfAbsent(step.tickNext);
                    let liquidityNet = isStatic
                        ? nextTick.liquidityNet
                        : nextTick.cross(zeroForOne
                            ? state.feeGrowthGlobalX128
                            : this._feeGrowthGlobal0X128, zeroForOne
                            ? this._feeGrowthGlobal1X128
                            : state.feeGrowthGlobalX128);
                    // if we're moving leftward, we interpret liquidityNet as the opposite sign
                    // safe because liquidityNet cannot be type(int128).min
                    if (zeroForOne)
                        liquidityNet = jsbi_1.default.multiply(liquidityNet, InternalConstants_1.NEGATIVE_ONE);
                    state.liquidity = LiquidityMath_1.LiquidityMath.addDelta(state.liquidity, liquidityNet);
                }
                state.tick = zeroForOne ? step.tickNext - 1 : step.tickNext;
            }
            else if (jsbi_1.default.notEqual(state.sqrtPriceX96, step.sqrtPriceStartX96)) {
                // recompute unless we're on a lower tick boundary (i.e. already transitioned ticks), and haven't moved
                state.tick = TickMath_1.TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
            }
        }
        if (!isStatic) {
            this._sqrtPriceX96 = state.sqrtPriceX96;
            if (state.tick != this.tickCurrent)
                this._tickCurrent = state.tick;
            if (jsbi_1.default.notEqual(state.liquidity, this._liquidity))
                this._liquidity = state.liquidity;
            // update fee growth global
            if (zeroForOne) {
                this._feeGrowthGlobal0X128 = state.feeGrowthGlobalX128;
            }
            else {
                this._feeGrowthGlobal1X128 = state.feeGrowthGlobalX128;
            }
        }
        let [amount0, amount1] = zeroForOne == exactInput
            ? [
                jsbi_1.default.subtract(amountSpecified, state.amountSpecifiedRemaining),
                state.amountCalculated,
            ]
            : [
                state.amountCalculated,
                jsbi_1.default.subtract(amountSpecified, state.amountSpecifiedRemaining),
            ];
        return { amount0, amount1, sqrtPriceX96: state.sqrtPriceX96 };
    }
    checkTicks(tickLower, tickUpper) {
        assert_1.default(tickLower < tickUpper, "tickLower should lower than tickUpper");
        assert_1.default(tickLower >= TickMath_1.TickMath.MIN_TICK, "tickLower should NOT lower than MIN_TICK");
        assert_1.default(tickUpper <= TickMath_1.TickMath.MAX_TICK, "tickUpper should NOT greater than MAX_TICK");
    }
    modifyPosition(owner, tickLower, tickUpper, liquidityDelta) {
        this.checkTicks(tickLower, tickUpper);
        let amount0 = InternalConstants_1.ZERO, amount1 = InternalConstants_1.ZERO;
        let positionView = this.getPosition(owner, tickLower, tickUpper);
        if (jsbi_1.default.lessThan(liquidityDelta, InternalConstants_1.ZERO)) {
            const negatedLiquidityDelta = jsbi_1.default.multiply(liquidityDelta, InternalConstants_1.NEGATIVE_ONE);
            assert_1.default(jsbi_1.default.greaterThanOrEqual(positionView.liquidity, negatedLiquidityDelta), "Liquidity Underflow");
        }
        // check ticks pass, update position
        let position = this.updatePosition(owner, tickLower, tickUpper, liquidityDelta);
        // use switch or pattern matching
        // check if liquidity happen add() or remove()
        if (jsbi_1.default.notEqual(liquidityDelta, InternalConstants_1.ZERO)) {
            if (this.tickCurrent < tickLower) {
                amount0 = SqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(TickMath_1.TickMath.getSqrtRatioAtTick(tickLower), TickMath_1.TickMath.getSqrtRatioAtTick(tickUpper), liquidityDelta);
            }
            else if (this.tickCurrent < tickUpper) {
                amount0 = SqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(this._sqrtPriceX96, TickMath_1.TickMath.getSqrtRatioAtTick(tickUpper), liquidityDelta);
                amount1 = SqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(TickMath_1.TickMath.getSqrtRatioAtTick(tickLower), this._sqrtPriceX96, liquidityDelta);
                this._liquidity = LiquidityMath_1.LiquidityMath.addDelta(this._liquidity, liquidityDelta);
            }
            else {
                amount1 = SqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(TickMath_1.TickMath.getSqrtRatioAtTick(tickLower), TickMath_1.TickMath.getSqrtRatioAtTick(tickUpper), liquidityDelta);
            }
        }
        return {
            position,
            amount0,
            amount1,
        };
    }
    updatePosition(owner, tickLower, tickUpper, liquidityDelta) {
        let position = this.positionManager.getPositionAndInitIfAbsent(PositionManager_1.PositionManager.getKey(owner, tickLower, tickUpper));
        let flippedLower = false;
        let flippedUpper = false;
        if (jsbi_1.default.notEqual(liquidityDelta, InternalConstants_1.ZERO)) {
            flippedLower = this.tickManager
                .getTickAndInitIfAbsent(tickLower)
                .update(liquidityDelta, this.tickCurrent, this.feeGrowthGlobal0X128, this.feeGrowthGlobal1X128, false, this.maxLiquidityPerTick);
            flippedUpper = this.tickManager
                .getTickAndInitIfAbsent(tickUpper)
                .update(liquidityDelta, this.tickCurrent, this.feeGrowthGlobal0X128, this.feeGrowthGlobal1X128, true, this.maxLiquidityPerTick);
        }
        let feeGrowthInsideStep = this.tickManager.getFeeGrowthInside(tickLower, tickUpper, this.tickCurrent, this.feeGrowthGlobal0X128, this.feeGrowthGlobal1X128);
        position.update(liquidityDelta, feeGrowthInsideStep.feeGrowthInside0X128, feeGrowthInsideStep.feeGrowthInside1X128);
        if (jsbi_1.default.lessThan(liquidityDelta, InternalConstants_1.ZERO)) {
            if (flippedLower) {
                this.tickManager.clear(tickLower);
            }
            if (flippedUpper) {
                this.tickManager.clear(tickUpper);
            }
        }
        return position;
    }
    getTickMap() {
        return this.tickManager.sortedTicks;
    }
    getTick(tick) {
        return this.tickManager.getTickReadonly(tick);
    }
    getPosition(owner, tickLower, tickUpper) {
        return this.positionManager.getPositionReadonly(owner, tickLower, tickUpper);
    }
    toString() {
        return `
    Current State:
        token0Balance: ${this.token0Balance.toString()}
        token1Balance: ${this.token1Balance.toString()}
        sqrtPriceX96: ${this.sqrtPriceX96.toString()}
        liquidity: ${this.liquidity.toString()}
        tickCurrent: ${this.tickCurrent}
        feeGrowthGlobal0X128: ${this.feeGrowthGlobal0X128.toString()}
        feeGrowthGlobal1X128: ${this.feeGrowthGlobal1X128.toString()}
    `;
    }
}
exports.CorePool = CorePool;
