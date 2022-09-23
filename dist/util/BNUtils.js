"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTokenStrFromDecimal = exports.toJSBI = exports.toBN = exports.isPositive = exports.get10pow = exports.div10pow = exports.mul10pow = exports.sum = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const ethers_1 = require("ethers");
const jsbi_1 = __importDefault(require("jsbi"));
bignumber_js_1.default.config({ EXPONENTIAL_AT: 50 });
function sum(bnArr) {
    return bnArr.reduce((prev, current) => {
        return prev.add(current);
    });
}
exports.sum = sum;
function mul10pow(bn, n) {
    return bn.mul(get10pow(n));
}
exports.mul10pow = mul10pow;
function div10pow(bn, n) {
    return bn.div(get10pow(n));
}
exports.div10pow = div10pow;
function get10pow(n) {
    return ethers_1.BigNumber.from(10).pow(n);
}
exports.get10pow = get10pow;
function isPositive(bn) {
    return bn.gt(0);
}
exports.isPositive = isPositive;
function toBN(number) {
    return ethers_1.BigNumber.from(number.toString());
}
exports.toBN = toBN;
function toJSBI(number) {
    return jsbi_1.default.BigInt(number.toString());
}
exports.toJSBI = toJSBI;
function convertTokenStrFromDecimal(bnStr, decimals) {
    return new bignumber_js_1.default(bnStr).times(new bignumber_js_1.default(10).pow(decimals)).toString();
}
exports.convertTokenStrFromDecimal = convertTokenStrFromDecimal;
