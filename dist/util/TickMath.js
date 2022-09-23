"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickMath = void 0;
const assert_1 = __importDefault(require("assert"));
const jsbi_1 = __importDefault(require("jsbi"));
const InternalConstants_1 = require("../enum/InternalConstants");
const POWERS_OF_2 = [128, 64, 32, 16, 8, 4, 2, 1].map((pow) => [
    pow,
    jsbi_1.default.exponentiate(InternalConstants_1.TWO, jsbi_1.default.BigInt(pow)),
]);
function mulShift(val, mulBy) {
    return jsbi_1.default.signedRightShift(jsbi_1.default.multiply(val, jsbi_1.default.BigInt(mulBy)), jsbi_1.default.BigInt(128));
}
class TickMath {
    /**
     * Returns the sqrt ratio as a Q64.96 for the given tick. The sqrt ratio is computed as sqrt(1.0001)^tick
     * @param tick the tick for which to compute the sqrt ratio
     */
    static getSqrtRatioAtTick(tick) {
        assert_1.default(tick >= TickMath.MIN_TICK &&
            tick <= TickMath.MAX_TICK &&
            Number.isInteger(tick), "TICK");
        const absTick = tick < 0 ? tick * -1 : tick;
        let ratio = (absTick & 0x1) != 0
            ? jsbi_1.default.BigInt("0xfffcb933bd6fad37aa2d162d1a594001")
            : jsbi_1.default.BigInt("0x100000000000000000000000000000000");
        if ((absTick & 0x2) != 0)
            ratio = mulShift(ratio, "0xfff97272373d413259a46990580e213a");
        if ((absTick & 0x4) != 0)
            ratio = mulShift(ratio, "0xfff2e50f5f656932ef12357cf3c7fdcc");
        if ((absTick & 0x8) != 0)
            ratio = mulShift(ratio, "0xffe5caca7e10e4e61c3624eaa0941cd0");
        if ((absTick & 0x10) != 0)
            ratio = mulShift(ratio, "0xffcb9843d60f6159c9db58835c926644");
        if ((absTick & 0x20) != 0)
            ratio = mulShift(ratio, "0xff973b41fa98c081472e6896dfb254c0");
        if ((absTick & 0x40) != 0)
            ratio = mulShift(ratio, "0xff2ea16466c96a3843ec78b326b52861");
        if ((absTick & 0x80) != 0)
            ratio = mulShift(ratio, "0xfe5dee046a99a2a811c461f1969c3053");
        if ((absTick & 0x100) != 0)
            ratio = mulShift(ratio, "0xfcbe86c7900a88aedcffc83b479aa3a4");
        if ((absTick & 0x200) != 0)
            ratio = mulShift(ratio, "0xf987a7253ac413176f2b074cf7815e54");
        if ((absTick & 0x400) != 0)
            ratio = mulShift(ratio, "0xf3392b0822b70005940c7a398e4b70f3");
        if ((absTick & 0x800) != 0)
            ratio = mulShift(ratio, "0xe7159475a2c29b7443b29c7fa6e889d9");
        if ((absTick & 0x1000) != 0)
            ratio = mulShift(ratio, "0xd097f3bdfd2022b8845ad8f792aa5825");
        if ((absTick & 0x2000) != 0)
            ratio = mulShift(ratio, "0xa9f746462d870fdf8a65dc1f90e061e5");
        if ((absTick & 0x4000) != 0)
            ratio = mulShift(ratio, "0x70d869a156d2a1b890bb3df62baf32f7");
        if ((absTick & 0x8000) != 0)
            ratio = mulShift(ratio, "0x31be135f97d08fd981231505542fcfa6");
        if ((absTick & 0x10000) != 0)
            ratio = mulShift(ratio, "0x9aa508b5b7a84e1c677de54f3e99bc9");
        if ((absTick & 0x20000) != 0)
            ratio = mulShift(ratio, "0x5d6af8dedb81196699c329225ee604");
        if ((absTick & 0x40000) != 0)
            ratio = mulShift(ratio, "0x2216e584f5fa1ea926041bedfe98");
        if ((absTick & 0x80000) != 0)
            ratio = mulShift(ratio, "0x48a170391f7dc42444e8fa2");
        if (tick > 0)
            ratio = jsbi_1.default.divide(InternalConstants_1.MaxUint256, ratio);
        // back to Q96
        return jsbi_1.default.greaterThan(jsbi_1.default.remainder(ratio, InternalConstants_1.Q32), InternalConstants_1.ZERO)
            ? jsbi_1.default.add(jsbi_1.default.divide(ratio, InternalConstants_1.Q32), InternalConstants_1.ONE)
            : jsbi_1.default.divide(ratio, InternalConstants_1.Q32);
    }
    /**
     * Returns the tick corresponding to a given sqrt ratio, s.t. #getSqrtRatioAtTick(tick) <= sqrtRatioX96
     * and #getSqrtRatioAtTick(tick + 1) > sqrtRatioX96
     * @param sqrtRatioX96 the sqrt ratio as a Q64.96 for which to compute the tick
     */
    static getTickAtSqrtRatio(sqrtRatioX96) {
        assert_1.default(jsbi_1.default.greaterThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO) &&
            jsbi_1.default.lessThan(sqrtRatioX96, TickMath.MAX_SQRT_RATIO), "SQRT_RATIO");
        const sqrtRatioX128 = jsbi_1.default.leftShift(sqrtRatioX96, jsbi_1.default.BigInt(32));
        const msb = TickMath.mostSignificantBit(sqrtRatioX128);
        let r;
        if (jsbi_1.default.greaterThanOrEqual(jsbi_1.default.BigInt(msb), jsbi_1.default.BigInt(128))) {
            r = jsbi_1.default.signedRightShift(sqrtRatioX128, jsbi_1.default.BigInt(msb - 127));
        }
        else {
            r = jsbi_1.default.leftShift(sqrtRatioX128, jsbi_1.default.BigInt(127 - msb));
        }
        let log_2 = jsbi_1.default.leftShift(jsbi_1.default.subtract(jsbi_1.default.BigInt(msb), jsbi_1.default.BigInt(128)), jsbi_1.default.BigInt(64));
        for (let i = 0; i < 14; i++) {
            r = jsbi_1.default.signedRightShift(jsbi_1.default.multiply(r, r), jsbi_1.default.BigInt(127));
            const f = jsbi_1.default.signedRightShift(r, jsbi_1.default.BigInt(128));
            log_2 = jsbi_1.default.bitwiseOr(log_2, jsbi_1.default.leftShift(f, jsbi_1.default.BigInt(63 - i)));
            r = jsbi_1.default.signedRightShift(r, f);
        }
        const log_sqrt10001 = jsbi_1.default.multiply(log_2, jsbi_1.default.BigInt("255738958999603826347141"));
        const tickLow = jsbi_1.default.toNumber(jsbi_1.default.signedRightShift(jsbi_1.default.subtract(log_sqrt10001, jsbi_1.default.BigInt("3402992956809132418596140100660247210")), jsbi_1.default.BigInt(128)));
        const tickHigh = jsbi_1.default.toNumber(jsbi_1.default.signedRightShift(jsbi_1.default.add(log_sqrt10001, jsbi_1.default.BigInt("291339464771989622907027621153398088495")), jsbi_1.default.BigInt(128)));
        return tickLow === tickHigh
            ? tickLow
            : jsbi_1.default.lessThanOrEqual(TickMath.getSqrtRatioAtTick(tickHigh), sqrtRatioX96)
                ? tickHigh
                : tickLow;
    }
    static mostSignificantBit(x) {
        assert_1.default(jsbi_1.default.greaterThan(x, InternalConstants_1.ZERO), "ZERO");
        assert_1.default(jsbi_1.default.lessThanOrEqual(x, InternalConstants_1.MaxUint256), "MAX");
        let msb = 0;
        for (const [power, min] of POWERS_OF_2) {
            if (jsbi_1.default.greaterThanOrEqual(x, min)) {
                x = jsbi_1.default.signedRightShift(x, jsbi_1.default.BigInt(power));
                msb += power;
            }
        }
        return msb;
    }
    static tickSpacingToMaxLiquidityPerTick(tickSpacing) {
        const minTick = jsbi_1.default.multiply(jsbi_1.default.divide(jsbi_1.default.BigInt(this.MIN_TICK), jsbi_1.default.BigInt(tickSpacing)), jsbi_1.default.BigInt(tickSpacing));
        const maxTick = jsbi_1.default.multiply(jsbi_1.default.divide(jsbi_1.default.BigInt(this.MAX_TICK), jsbi_1.default.BigInt(tickSpacing)), jsbi_1.default.BigInt(tickSpacing));
        const numTicks = jsbi_1.default.add(jsbi_1.default.divide(jsbi_1.default.subtract(maxTick, minTick), jsbi_1.default.BigInt(tickSpacing)), InternalConstants_1.ONE);
        return jsbi_1.default.divide(InternalConstants_1.MaxUint128, jsbi_1.default.BigInt(numTicks));
    }
}
exports.TickMath = TickMath;
/**
 * The minimum tick that can be used on any pool.
 */
TickMath.MIN_TICK = -887272;
/**
 * The maximum tick that can be used on any pool.
 */
TickMath.MAX_TICK = -TickMath.MIN_TICK;
/**
 * The sqrt ratio corresponding to the minimum tick that could be used on any pool.
 */
TickMath.MIN_SQRT_RATIO = jsbi_1.default.BigInt("4295128739");
/**
 * The sqrt ratio corresponding to the maximum tick that could be used on any pool.
 */
TickMath.MAX_SQRT_RATIO = jsbi_1.default.BigInt("1461446703485210103287273052203988822378723970342");
