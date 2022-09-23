"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const typedjson_1 = require("typedjson");
const InternalConstants_1 = require("../enum/InternalConstants");
const FullMath_1 = require("../util/FullMath");
const LiquidityMath_1 = require("../util/LiquidityMath");
const Serializer_1 = require("../util/Serializer");
const assert_1 = __importDefault(require("assert"));
let Position = class Position {
    constructor() {
        this._liquidity = jsbi_1.default.BigInt(0);
        this._feeGrowthInside0LastX128 = jsbi_1.default.BigInt(0);
        this._feeGrowthInside1LastX128 = jsbi_1.default.BigInt(0);
        this._tokensOwed0 = jsbi_1.default.BigInt(0);
        this._tokensOwed1 = jsbi_1.default.BigInt(0);
    }
    get liquidity() {
        return this._liquidity;
    }
    get feeGrowthInside0LastX128() {
        return this._feeGrowthInside0LastX128;
    }
    get feeGrowthInside1LastX128() {
        return this._feeGrowthInside1LastX128;
    }
    get tokensOwed0() {
        return this._tokensOwed0;
    }
    get tokensOwed1() {
        return this._tokensOwed1;
    }
    update(liquidityDelta, feeGrowthInside0X128, feeGrowthInside1X128) {
        let liquidityNext;
        if (jsbi_1.default.equal(liquidityDelta, InternalConstants_1.ZERO)) {
            assert_1.default(jsbi_1.default.greaterThan(this.liquidity, InternalConstants_1.ZERO), "NP");
            liquidityNext = this.liquidity;
        }
        else {
            liquidityNext = LiquidityMath_1.LiquidityMath.addDelta(this.liquidity, liquidityDelta);
        }
        const tokensOwed0 = FullMath_1.FullMath.mulDiv(jsbi_1.default.subtract(feeGrowthInside0X128, this.feeGrowthInside0LastX128), this.liquidity, InternalConstants_1.Q128);
        const tokensOwed1 = FullMath_1.FullMath.mulDiv(jsbi_1.default.subtract(feeGrowthInside1X128, this.feeGrowthInside1LastX128), this.liquidity, InternalConstants_1.Q128);
        if (jsbi_1.default.notEqual(liquidityDelta, InternalConstants_1.ZERO))
            this._liquidity = liquidityNext;
        this._feeGrowthInside0LastX128 = feeGrowthInside0X128;
        this._feeGrowthInside1LastX128 = feeGrowthInside1X128;
        if (jsbi_1.default.greaterThan(tokensOwed0, InternalConstants_1.ZERO) ||
            jsbi_1.default.greaterThan(tokensOwed1, InternalConstants_1.ZERO)) {
            this._tokensOwed0 = jsbi_1.default.add(this.tokensOwed0, tokensOwed0);
            this._tokensOwed1 = jsbi_1.default.add(this.tokensOwed1, tokensOwed1);
        }
    }
    updateBurn(newTokensOwed0, newTokensOwed1) {
        this._tokensOwed0 = newTokensOwed0;
        this._tokensOwed1 = newTokensOwed1;
    }
    isEmpty() {
        return (jsbi_1.default.equal(this._liquidity, InternalConstants_1.ZERO) &&
            jsbi_1.default.equal(this._tokensOwed0, InternalConstants_1.ZERO) &&
            jsbi_1.default.equal(this._tokensOwed1, InternalConstants_1.ZERO));
    }
};
__decorate([
    typedjson_1.jsonMember({ deserializer: Serializer_1.JSBIDeserializer, serializer: Serializer_1.JSBISerializer })
], Position.prototype, "_liquidity", void 0);
__decorate([
    typedjson_1.jsonMember({ deserializer: Serializer_1.JSBIDeserializer, serializer: Serializer_1.JSBISerializer })
], Position.prototype, "_feeGrowthInside0LastX128", void 0);
__decorate([
    typedjson_1.jsonMember({ deserializer: Serializer_1.JSBIDeserializer, serializer: Serializer_1.JSBISerializer })
], Position.prototype, "_feeGrowthInside1LastX128", void 0);
__decorate([
    typedjson_1.jsonMember({ deserializer: Serializer_1.JSBIDeserializer, serializer: Serializer_1.JSBISerializer })
], Position.prototype, "_tokensOwed0", void 0);
__decorate([
    typedjson_1.jsonMember({ deserializer: Serializer_1.JSBIDeserializer, serializer: Serializer_1.JSBISerializer })
], Position.prototype, "_tokensOwed1", void 0);
Position = __decorate([
    typedjson_1.jsonObject
], Position);
exports.Position = Position;
