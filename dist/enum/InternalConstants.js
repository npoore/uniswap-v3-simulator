"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICK_SPACINGS = exports.MAX_FEE = exports.Q192 = exports.Q128 = exports.Q96 = exports.Q32 = exports.MinInt128 = exports.MaxInt128 = exports.MaxUint256 = exports.MaxUint160 = exports.MaxUint128 = exports.TWO = exports.ONE = exports.ZERO = exports.NEGATIVE_ONE = exports.UNISWAP_V3_SUBGRAPH_ENDPOINT = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const FeeAmount_1 = require("./FeeAmount");
// constants used internally but not expected to be used externally
exports.UNISWAP_V3_SUBGRAPH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
exports.NEGATIVE_ONE = jsbi_1.default.BigInt(-1);
exports.ZERO = jsbi_1.default.BigInt(0);
exports.ONE = jsbi_1.default.BigInt(1);
exports.TWO = jsbi_1.default.BigInt(2);
exports.MaxUint128 = jsbi_1.default.subtract(jsbi_1.default.exponentiate(exports.TWO, jsbi_1.default.BigInt(128)), exports.ONE);
exports.MaxUint160 = jsbi_1.default.subtract(jsbi_1.default.exponentiate(exports.TWO, jsbi_1.default.BigInt(160)), exports.ONE);
exports.MaxUint256 = jsbi_1.default.subtract(jsbi_1.default.exponentiate(exports.TWO, jsbi_1.default.BigInt(256)), exports.ONE);
exports.MaxInt128 = jsbi_1.default.subtract(jsbi_1.default.exponentiate(exports.TWO, jsbi_1.default.BigInt(128 - 1)), exports.ONE);
exports.MinInt128 = jsbi_1.default.unaryMinus(jsbi_1.default.exponentiate(exports.TWO, jsbi_1.default.BigInt(128 - 1)));
// used in liquidity amount math
exports.Q32 = jsbi_1.default.exponentiate(exports.TWO, jsbi_1.default.BigInt(32));
exports.Q96 = jsbi_1.default.exponentiate(exports.TWO, jsbi_1.default.BigInt(96));
exports.Q128 = jsbi_1.default.exponentiate(exports.TWO, jsbi_1.default.BigInt(128));
exports.Q192 = jsbi_1.default.exponentiate(exports.Q96, exports.TWO);
// used in fee calculation
exports.MAX_FEE = jsbi_1.default.exponentiate(jsbi_1.default.BigInt(10), jsbi_1.default.BigInt(6));
// The default factory tick spacings by fee amount.
exports.TICK_SPACINGS = {
    [FeeAmount_1.FeeAmount.LOW]: 10,
    [FeeAmount_1.FeeAmount.MEDIUM]: 60,
    [FeeAmount_1.FeeAmount.HIGH]: 200,
};
