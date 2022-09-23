"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityMath = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const InternalConstants_1 = require("../enum/InternalConstants");
const assert_1 = __importDefault(require("assert"));
const SqrtPriceMath_1 = require("./SqrtPriceMath");
class LiquidityMath {
    static addDelta(x, y) {
        assert_1.default(jsbi_1.default.lessThanOrEqual(x, InternalConstants_1.MaxUint128), "OVERFLOW");
        assert_1.default(jsbi_1.default.lessThanOrEqual(y, InternalConstants_1.MaxUint128), "OVERFLOW");
        if (jsbi_1.default.lessThan(y, InternalConstants_1.ZERO)) {
            const negatedY = jsbi_1.default.multiply(y, InternalConstants_1.NEGATIVE_ONE);
            assert_1.default(jsbi_1.default.greaterThanOrEqual(x, negatedY), "UNDERFLOW");
            return jsbi_1.default.subtract(x, negatedY);
        }
        else {
            assert_1.default(jsbi_1.default.lessThanOrEqual(jsbi_1.default.add(x, y), InternalConstants_1.MaxUint128), "OVERFLOW");
            return jsbi_1.default.add(x, y);
        }
    }
    static getAmountsForLiquidity(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, liquidity) {
        let amount0 = InternalConstants_1.ZERO;
        let amount1 = InternalConstants_1.ZERO;
        if (jsbi_1.default.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        if (jsbi_1.default.lessThanOrEqual(sqrtRatioX96, sqrtRatioAX96)) {
            amount0 = SqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity);
        }
        else if (jsbi_1.default.lessThan(sqrtRatioX96, sqrtRatioBX96)) {
            amount0 = SqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(sqrtRatioX96, sqrtRatioBX96, liquidity);
            amount1 = SqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(sqrtRatioAX96, sqrtRatioX96, liquidity);
        }
        else {
            amount1 = SqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity);
        }
        return { amount0, amount1 };
    }
    /**
     * Computes the maximum amount of liquidity received for a given amount of token0, token1,
     * and the prices at the tick boundaries.
     * @param sqrtRatioCurrentX96 the current price
     * @param sqrtRatioAX96 price at lower boundary
     * @param sqrtRatioBX96 price at upper boundary
     * @param amount0 token0 amount
     * @param amount1 token1 amount
     * @param useFullPrecision if false, liquidity will be maximized according to what the router can calculate,
     * not what core can theoretically support
     */
    static maxLiquidityForAmounts(sqrtRatioCurrentX96, sqrtRatioAX96, sqrtRatioBX96, amount0, amount1, useFullPrecision) {
        if (jsbi_1.default.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        const maxLiquidityForAmount0 = useFullPrecision
            ? LiquidityMath.maxLiquidityForAmount0Precise
            : LiquidityMath.maxLiquidityForAmount0Imprecise;
        if (jsbi_1.default.lessThanOrEqual(sqrtRatioCurrentX96, sqrtRatioAX96)) {
            return maxLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0);
        }
        else if (jsbi_1.default.lessThan(sqrtRatioCurrentX96, sqrtRatioBX96)) {
            const liquidity0 = maxLiquidityForAmount0(sqrtRatioCurrentX96, sqrtRatioBX96, amount0);
            const liquidity1 = LiquidityMath.maxLiquidityForAmount1(sqrtRatioAX96, sqrtRatioCurrentX96, amount1);
            return jsbi_1.default.lessThan(liquidity0, liquidity1) ? liquidity0 : liquidity1;
        }
        else {
            return LiquidityMath.maxLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1);
        }
    }
    static maxLiquidityForAmount0Imprecise(sqrtRatioAX96, sqrtRatioBX96, amount0) {
        if (jsbi_1.default.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        const intermediate = jsbi_1.default.divide(jsbi_1.default.multiply(sqrtRatioAX96, sqrtRatioBX96), InternalConstants_1.Q96);
        return jsbi_1.default.divide(jsbi_1.default.multiply(amount0, intermediate), jsbi_1.default.subtract(sqrtRatioBX96, sqrtRatioAX96));
    }
    /**
     * Returns a precise maximum amount of liquidity received for a given amount of token 0 by dividing by Q64 instead of Q96 in the intermediate step,
     * and shifting the subtracted ratio left by 32 bits.
     * @param sqrtRatioAX96 The price at the lower boundary
     * @param sqrtRatioBX96 The price at the upper boundary
     * @param amount0 The token0 amount
     * @returns liquidity for amount0, precise
     */
    static maxLiquidityForAmount0Precise(sqrtRatioAX96, sqrtRatioBX96, amount0) {
        if (jsbi_1.default.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        const numerator = jsbi_1.default.multiply(jsbi_1.default.multiply(amount0, sqrtRatioAX96), sqrtRatioBX96);
        const denominator = jsbi_1.default.multiply(InternalConstants_1.Q96, jsbi_1.default.subtract(sqrtRatioBX96, sqrtRatioAX96));
        return jsbi_1.default.divide(numerator, denominator);
    }
    /**
     * Computes the maximum amount of liquidity received for a given amount of token1
     * @param sqrtRatioAX96 The price at the lower tick boundary
     * @param sqrtRatioBX96 The price at the upper tick boundary
     * @param amount1 The token1 amount
     * @returns liquidity for amount1
     */
    static maxLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1) {
        if (jsbi_1.default.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        return jsbi_1.default.divide(jsbi_1.default.multiply(amount1, InternalConstants_1.Q96), jsbi_1.default.subtract(sqrtRatioBX96, sqrtRatioAX96));
    }
}
exports.LiquidityMath = LiquidityMath;
