"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullMath = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const InternalConstants_1 = require("../enum/InternalConstants");
const assert_1 = __importDefault(require("assert"));
class FullMath {
    static mulDiv(a, b, denominator) {
        const product = jsbi_1.default.multiply(a, b);
        return jsbi_1.default.divide(product, denominator);
    }
    static mulDivRoundingUp(a, b, denominator) {
        const product = jsbi_1.default.multiply(a, b);
        let result = jsbi_1.default.divide(product, denominator);
        if (jsbi_1.default.greaterThan(jsbi_1.default.remainder(product, denominator), InternalConstants_1.ZERO)) {
            assert_1.default(jsbi_1.default.lessThan(result, InternalConstants_1.MaxUint256), "OVERFLOW");
            result = jsbi_1.default.add(result, InternalConstants_1.ONE);
        }
        return result;
    }
    // simulates EVM uint256 "a - b" underflow behavior
    static mod256Sub(a, b) {
        assert_1.default(jsbi_1.default.greaterThanOrEqual(a, InternalConstants_1.ZERO) &&
            jsbi_1.default.greaterThanOrEqual(b, InternalConstants_1.ZERO) &&
            jsbi_1.default.lessThanOrEqual(a, InternalConstants_1.MaxUint256) &&
            jsbi_1.default.lessThanOrEqual(b, InternalConstants_1.MaxUint256));
        return jsbi_1.default.remainder(jsbi_1.default.subtract(jsbi_1.default.add(a, jsbi_1.default.exponentiate(InternalConstants_1.TWO, jsbi_1.default.BigInt(256))), b), jsbi_1.default.exponentiate(InternalConstants_1.TWO, jsbi_1.default.BigInt(256)));
    }
    static equalsWithTolerance(a, b, toleranceInMinUnit) {
        return (jsbi_1.default.greaterThanOrEqual(jsbi_1.default.subtract(a, b), jsbi_1.default.BigInt(jsbi_1.default.greaterThan(toleranceInMinUnit, InternalConstants_1.ZERO)
            ? jsbi_1.default.unaryMinus(toleranceInMinUnit)
            : toleranceInMinUnit)) &&
            jsbi_1.default.lessThanOrEqual(jsbi_1.default.subtract(a, b), jsbi_1.default.BigInt(jsbi_1.default.greaterThan(toleranceInMinUnit, InternalConstants_1.ZERO)
                ? toleranceInMinUnit
                : jsbi_1.default.unaryMinus(toleranceInMinUnit))));
    }
    /**
     * Computes floor(sqrt(value))
     * @param value the value for which to compute the square root, rounded down
     */
    static sqrt(value) {
        assert_1.default(jsbi_1.default.greaterThanOrEqual(value, InternalConstants_1.ZERO), "NEGATIVE");
        // rely on built in sqrt if possible
        if (jsbi_1.default.lessThan(value, FullMath.MAX_SAFE_INTEGER)) {
            return jsbi_1.default.BigInt(Math.floor(Math.sqrt(jsbi_1.default.toNumber(value))));
        }
        let z;
        let x;
        z = value;
        x = jsbi_1.default.add(jsbi_1.default.divide(value, InternalConstants_1.TWO), InternalConstants_1.ONE);
        while (jsbi_1.default.lessThan(x, z)) {
            z = x;
            x = jsbi_1.default.divide(jsbi_1.default.add(jsbi_1.default.divide(value, x), x), InternalConstants_1.TWO);
        }
        return z;
    }
    static incrTowardInfinity(value) {
        assert_1.default(jsbi_1.default.notEqual(value, InternalConstants_1.ZERO), "ZERO");
        return jsbi_1.default.greaterThan(value, InternalConstants_1.ZERO)
            ? jsbi_1.default.add(value, InternalConstants_1.ONE)
            : jsbi_1.default.subtract(value, InternalConstants_1.ONE);
    }
}
exports.FullMath = FullMath;
FullMath.MAX_SAFE_INTEGER = jsbi_1.default.BigInt(Number.MAX_SAFE_INTEGER);
