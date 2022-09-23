"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapMath = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const FullMath_1 = require("./FullMath");
const SqrtPriceMath_1 = require("./SqrtPriceMath");
const InternalConstants_1 = require("../enum/InternalConstants");
class SwapMath {
    static computeSwapStep(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, amountRemaining, feePips) {
        const returnValues = {};
        const zeroForOne = jsbi_1.default.greaterThanOrEqual(sqrtRatioCurrentX96, sqrtRatioTargetX96);
        const exactIn = jsbi_1.default.greaterThanOrEqual(amountRemaining, InternalConstants_1.ZERO);
        if (exactIn) {
            const amountRemainingLessFee = jsbi_1.default.divide(jsbi_1.default.multiply(amountRemaining, jsbi_1.default.subtract(InternalConstants_1.MAX_FEE, jsbi_1.default.BigInt(feePips))), InternalConstants_1.MAX_FEE);
            returnValues.amountIn = zeroForOne
                ? SqrtPriceMath_1.SqrtPriceMath.getAmount0DeltaWithRoundUp(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, true)
                : SqrtPriceMath_1.SqrtPriceMath.getAmount1DeltaWithRoundUp(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, true);
            if (jsbi_1.default.greaterThanOrEqual(amountRemainingLessFee, returnValues.amountIn)) {
                returnValues.sqrtRatioNextX96 = sqrtRatioTargetX96;
            }
            else {
                returnValues.sqrtRatioNextX96 = SqrtPriceMath_1.SqrtPriceMath.getNextSqrtPriceFromInput(sqrtRatioCurrentX96, liquidity, amountRemainingLessFee, zeroForOne);
            }
        }
        else {
            returnValues.amountOut = zeroForOne
                ? SqrtPriceMath_1.SqrtPriceMath.getAmount1DeltaWithRoundUp(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, false)
                : SqrtPriceMath_1.SqrtPriceMath.getAmount0DeltaWithRoundUp(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, false);
            if (jsbi_1.default.greaterThanOrEqual(jsbi_1.default.multiply(amountRemaining, InternalConstants_1.NEGATIVE_ONE), returnValues.amountOut)) {
                returnValues.sqrtRatioNextX96 = sqrtRatioTargetX96;
            }
            else {
                returnValues.sqrtRatioNextX96 =
                    SqrtPriceMath_1.SqrtPriceMath.getNextSqrtPriceFromOutput(sqrtRatioCurrentX96, liquidity, jsbi_1.default.multiply(amountRemaining, InternalConstants_1.NEGATIVE_ONE), zeroForOne);
            }
        }
        const max = jsbi_1.default.equal(sqrtRatioTargetX96, returnValues.sqrtRatioNextX96);
        if (zeroForOne) {
            returnValues.amountIn =
                max && exactIn
                    ? returnValues.amountIn
                    : SqrtPriceMath_1.SqrtPriceMath.getAmount0DeltaWithRoundUp(returnValues.sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, true);
            returnValues.amountOut =
                max && !exactIn
                    ? returnValues.amountOut
                    : SqrtPriceMath_1.SqrtPriceMath.getAmount1DeltaWithRoundUp(returnValues.sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, false);
        }
        else {
            returnValues.amountIn =
                max && exactIn
                    ? returnValues.amountIn
                    : SqrtPriceMath_1.SqrtPriceMath.getAmount1DeltaWithRoundUp(sqrtRatioCurrentX96, returnValues.sqrtRatioNextX96, liquidity, true);
            returnValues.amountOut =
                max && !exactIn
                    ? returnValues.amountOut
                    : SqrtPriceMath_1.SqrtPriceMath.getAmount0DeltaWithRoundUp(sqrtRatioCurrentX96, returnValues.sqrtRatioNextX96, liquidity, false);
        }
        if (!exactIn &&
            jsbi_1.default.greaterThan(returnValues.amountOut, jsbi_1.default.multiply(amountRemaining, InternalConstants_1.NEGATIVE_ONE))) {
            returnValues.amountOut = jsbi_1.default.multiply(amountRemaining, InternalConstants_1.NEGATIVE_ONE);
        }
        if (exactIn &&
            jsbi_1.default.notEqual(returnValues.sqrtRatioNextX96, sqrtRatioTargetX96)) {
            // we didn't reach the target, so take the remainder of the maximum input as fee
            returnValues.feeAmount = jsbi_1.default.subtract(amountRemaining, returnValues.amountIn);
        }
        else {
            returnValues.feeAmount = FullMath_1.FullMath.mulDivRoundingUp(returnValues.amountIn, jsbi_1.default.BigInt(feePips), jsbi_1.default.subtract(InternalConstants_1.MAX_FEE, jsbi_1.default.BigInt(feePips)));
        }
        return [
            returnValues.sqrtRatioNextX96,
            returnValues.amountIn,
            returnValues.amountOut,
            returnValues.feeAmount,
        ];
    }
}
exports.SwapMath = SwapMath;
