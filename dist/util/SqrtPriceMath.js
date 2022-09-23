"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqrtPriceMath = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const FullMath_1 = require("./FullMath");
const InternalConstants_1 = require("../enum/InternalConstants");
const assert_1 = __importDefault(require("assert"));
function multiplyIn256(x, y) {
    const product = jsbi_1.default.multiply(x, y);
    return jsbi_1.default.bitwiseAnd(product, InternalConstants_1.MaxUint256);
}
function addIn256(x, y) {
    const sum = jsbi_1.default.add(x, y);
    return jsbi_1.default.bitwiseAnd(sum, InternalConstants_1.MaxUint256);
}
class SqrtPriceMath {
    static getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity) {
        return jsbi_1.default.lessThan(liquidity, jsbi_1.default.BigInt(0))
            ? jsbi_1.default.unaryMinus(SqrtPriceMath.getAmount0DeltaWithRoundUp(sqrtRatioAX96, sqrtRatioBX96, jsbi_1.default.unaryMinus(liquidity), false))
            : SqrtPriceMath.getAmount0DeltaWithRoundUp(sqrtRatioAX96, sqrtRatioBX96, liquidity, true);
    }
    static getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity) {
        return jsbi_1.default.lessThan(liquidity, jsbi_1.default.BigInt(0))
            ? jsbi_1.default.unaryMinus(SqrtPriceMath.getAmount1DeltaWithRoundUp(sqrtRatioAX96, sqrtRatioBX96, jsbi_1.default.unaryMinus(liquidity), false))
            : SqrtPriceMath.getAmount1DeltaWithRoundUp(sqrtRatioAX96, sqrtRatioBX96, liquidity, true);
    }
    static getNextSqrtPriceFromInput(sqrtPX96, liquidity, amountIn, zeroForOne) {
        assert_1.default(jsbi_1.default.greaterThan(sqrtPX96, InternalConstants_1.ZERO));
        assert_1.default(jsbi_1.default.greaterThan(liquidity, InternalConstants_1.ZERO));
        return zeroForOne
            ? this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
            : this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true);
    }
    static getNextSqrtPriceFromOutput(sqrtPX96, liquidity, amountOut, zeroForOne) {
        assert_1.default(jsbi_1.default.greaterThan(sqrtPX96, InternalConstants_1.ZERO));
        assert_1.default(jsbi_1.default.greaterThan(liquidity, InternalConstants_1.ZERO));
        return zeroForOne
            ? this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountOut, false)
            : this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false);
    }
    static getAmount0DeltaWithRoundUp(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp) {
        if (jsbi_1.default.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        const numerator1 = jsbi_1.default.leftShift(liquidity, jsbi_1.default.BigInt(96));
        const numerator2 = jsbi_1.default.subtract(sqrtRatioBX96, sqrtRatioAX96);
        return roundUp
            ? FullMath_1.FullMath.mulDivRoundingUp(FullMath_1.FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96), InternalConstants_1.ONE, sqrtRatioAX96)
            : jsbi_1.default.divide(jsbi_1.default.divide(jsbi_1.default.multiply(numerator1, numerator2), sqrtRatioBX96), sqrtRatioAX96);
    }
    static getAmount1DeltaWithRoundUp(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp) {
        if (jsbi_1.default.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
            [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
        }
        return roundUp
            ? FullMath_1.FullMath.mulDivRoundingUp(liquidity, jsbi_1.default.subtract(sqrtRatioBX96, sqrtRatioAX96), InternalConstants_1.Q96)
            : jsbi_1.default.divide(jsbi_1.default.multiply(liquidity, jsbi_1.default.subtract(sqrtRatioBX96, sqrtRatioAX96)), InternalConstants_1.Q96);
    }
    static getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amount, add) {
        if (jsbi_1.default.equal(amount, InternalConstants_1.ZERO))
            return sqrtPX96;
        const numerator1 = jsbi_1.default.leftShift(liquidity, jsbi_1.default.BigInt(96));
        if (add) {
            let product = multiplyIn256(amount, sqrtPX96);
            if (jsbi_1.default.equal(jsbi_1.default.divide(product, amount), sqrtPX96)) {
                const denominator = addIn256(numerator1, product);
                if (jsbi_1.default.greaterThanOrEqual(denominator, numerator1)) {
                    return FullMath_1.FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator);
                }
            }
            return FullMath_1.FullMath.mulDivRoundingUp(numerator1, InternalConstants_1.ONE, jsbi_1.default.add(jsbi_1.default.divide(numerator1, sqrtPX96), amount));
        }
        else {
            let product = multiplyIn256(amount, sqrtPX96);
            assert_1.default(jsbi_1.default.equal(jsbi_1.default.divide(product, amount), sqrtPX96));
            assert_1.default(jsbi_1.default.greaterThan(numerator1, product));
            const denominator = jsbi_1.default.subtract(numerator1, product);
            return FullMath_1.FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator);
        }
    }
    static getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amount, add) {
        if (add) {
            const quotient = jsbi_1.default.lessThanOrEqual(amount, InternalConstants_1.MaxUint160)
                ? jsbi_1.default.divide(jsbi_1.default.leftShift(amount, jsbi_1.default.BigInt(96)), liquidity)
                : jsbi_1.default.divide(jsbi_1.default.multiply(amount, InternalConstants_1.Q96), liquidity);
            return jsbi_1.default.add(sqrtPX96, quotient);
        }
        else {
            const quotient = FullMath_1.FullMath.mulDivRoundingUp(amount, InternalConstants_1.Q96, liquidity);
            assert_1.default(jsbi_1.default.greaterThan(sqrtPX96, quotient));
            return jsbi_1.default.subtract(sqrtPX96, quotient);
        }
    }
}
exports.SqrtPriceMath = SqrtPriceMath;
